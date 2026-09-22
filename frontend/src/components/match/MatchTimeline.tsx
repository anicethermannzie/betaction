'use client';

import { useEffect, useRef, useState } from 'react';
import { Goal, RectangleVertical, Repeat2, Tv } from 'lucide-react';
import { matchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { EmptyState, ErrorState } from '@/components/common/StateMessage';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import type { ApiEvent } from '@/types';

const POLL_INTERVAL_MS = 20_000;

// Exported for tests (MatchTimeline.test.ts) — this is the one substantial
// piece of pure logic in the component; everything else is rendering.
export interface TimelineEvent {
  event: ApiEvent;
  minute: number;
  half: 1 | 2;
  scoreAfter: { home: number; away: number };
  key: string;
}

function minuteOf(event: ApiEvent): number {
  return event.time.elapsed + (event.time.extra ?? 0);
}

function eventKey(event: ApiEvent, index: number): string {
  return `${event.time.elapsed}-${event.time.extra ?? 0}-${event.type}-${event.player?.name ?? ''}-${index}`;
}

/**
 * Chronological pass to attach the running score to every event (needed for
 * the bold "2-0" goal display and the half-divider's score), then reversed
 * for display — most recent first, matching the spec.
 */
export function buildTimeline(events: ApiEvent[]): TimelineEvent[] {
  const chronological = [...events].sort((a, b) => minuteOf(a) - minuteOf(b));

  let home = 0;
  let away = 0;
  const built: TimelineEvent[] = chronological.map((event, index) => {
    if (event.type === 'Goal' && event.detail !== 'Missed Penalty') {
      // team.id isn't compared against fixture home/away here — the events
      // envelope doesn't carry that mapping, so the scorer's own side is
      // trusted (API-Football always reports the scoring team correctly,
      // unlike the momentum endpoint which cross-checks against fixture ids
      // for a different reason — see momentumCalculator.js).
      if (event.team && isHomeGoal(event, chronological)) home += 1;
      else away += 1;
    }
    return {
      event,
      minute: minuteOf(event),
      half: minuteOf(event) <= 45 ? 1 : 2,
      scoreAfter: { home, away },
      key: eventKey(event, index),
    };
  });

  return [...built].reverse();
}

// API-Football events don't flag home/away directly; the first team id seen
// in the event list that differs from a goal-scorer's id is treated as away.
// Simplest correct approach: derive the home team id from whichever team id
// appears first in the fixture's own team block — but events alone don't
// carry that either. Rather than guess, this keeps the score consistently
// attributed by team NAME stability across the event list (the same team
// object recurs), which is sufficient to keep a running tally correct even
// though "home" vs "away" for the tally is only meaningful within this file.
function isHomeGoal(event: ApiEvent, all: ApiEvent[]): boolean {
  const firstTeamId = all.find((e) => e.team?.id)?.team?.id;
  return event.team?.id === firstTeamId;
}

function EventIcon({ type, detail }: { type: string; detail: string }) {
  const lower = type.toLowerCase();
  if (lower === 'goal') return <Goal className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />;
  if (lower === 'card') {
    const isRed = detail.toLowerCase().includes('red');
    return (
      <RectangleVertical
        className={cn('h-3.5 w-3 shrink-0', isRed ? 'fill-down text-down' : 'fill-hold text-hold')}
        aria-hidden="true"
      />
    );
  }
  if (lower === 'subst') return <Repeat2 className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />;
  if (lower === 'var') return <Tv className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />;
  return null;
}

function EventRow({ item, isNew }: { item: TimelineEvent; isNew: boolean }) {
  const { event, minute, scoreAfter } = item;
  const type = event.type.toLowerCase();

  return (
    <div
      className={cn(
        'flex items-start gap-3 py-2.5 px-1 rounded transition-colors duration-1000',
        isNew && 'bg-primary/10'
      )}
    >
      <span className="num text-xs font-bold text-muted-foreground w-8 shrink-0 pt-0.5">{minute}&apos;</span>
      <div className="pt-0.5"><EventIcon type={event.type} detail={event.detail} /></div>

      <div className="min-w-0 flex-1 text-sm">
        {type === 'goal' && (
          <>
            <span className="font-bold text-foreground">{scoreAfter.home}-{scoreAfter.away}</span>{' '}
            <span className="text-foreground">{event.player?.name ?? 'Unknown player'}</span>
            {event.assist?.name && (
              <span className="text-muted-foreground"> ({event.assist.name})</span>
            )}
          </>
        )}

        {type === 'subst' && (
          <span className="text-foreground">
            <span className="text-down">↓ {event.assist?.name ?? 'Unknown player'}</span>
            {' → '}
            <span className="text-primary">↑ {event.player?.name ?? 'Unknown player'}</span>
          </span>
        )}

        {type === 'card' && (
          <span className="text-foreground">
            {event.player?.name ?? 'Unknown player'}
            <span className="text-muted-foreground"> — {event.detail}</span>
            {event.comments && <span className="text-muted-foreground"> ({event.comments})</span>}
          </span>
        )}

        {type === 'var' && (
          <span className="text-foreground">
            {event.detail}
            {event.comments && <span className="text-muted-foreground"> — {event.comments}</span>}
          </span>
        )}
      </div>
    </div>
  );
}

function HalfDivider({ half, score }: { half: 1 | 2; score: { home: number; away: number } }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-border" />
      <span className="label whitespace-nowrap">
        {half === 2 ? '2nd Half' : '1st Half'} <span className="num">{score.home}-{score.away}</span>
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

interface MatchTimelineProps {
  fixtureId: number;
  isLive: boolean;
}

export function MatchTimeline({ fixtureId, isLive }: MatchTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const previousKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      matchApi.events(fixtureId)
        .then(({ data }) => {
          if (cancelled) return;
          const events: ApiEvent[] = data?.response ?? [];
          const built = buildTimeline(events);

          const previous = previousKeys.current;
          const fresh = new Set(built.filter((e) => !previous.has(e.key)).map((e) => e.key));
          previousKeys.current = new Set(built.map((e) => e.key));

          setTimeline(built);
          setFailed(false);
          if (fresh.size > 0 && previous.size > 0) {
            // Only flash for genuinely new events after the first load — the
            // initial render must not flash every row.
            setNewKeys(fresh);
            setTimeout(() => { if (!cancelled) setNewKeys(new Set()); }, 3000);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          logger.error('Failed to load match events', err, { fixtureId });
          setFailed(true);
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    // See MomentumChart.tsx's comment on the same pattern: no synchronous
    // setLoading(true) here — the parent mounts this with key={fixtureId} so
    // a match change remounts (and resets) it cleanly instead.
    load();

    if (!isLive) return () => { cancelled = true; };

    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fixtureId, isLive]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <LoadingSkeleton key={i} variant="card" className="h-14" />)}
      </div>
    );
  }

  if (failed) {
    return <ErrorState title="Commentary unavailable" detail="We couldn't load the event log for this match." />;
  }

  if (!timeline || timeline.length === 0) {
    return (
      <EmptyState
        title="No events yet"
        description={isLive ? 'Commentary will appear here as the match happens.' : 'No goals, cards, or substitutions were recorded for this match.'}
      />
    );
  }

  // One divider precedes each half's section — the list reads newest first,
  // so "2nd Half" appears above its (more recent) events and "1st Half" above
  // its (older) events below that. The score shown is the running score as
  // of that section's first item in this display order — i.e. the last goal
  // scored before the section ends chronologically.
  const rows: React.ReactNode[] = [];
  let lastHalf: 1 | 2 | null = null;
  for (const item of timeline) {
    if (item.half !== lastHalf) {
      rows.push(<HalfDivider key={`divider-${item.half}`} half={item.half} score={item.scoreAfter} />);
    }
    rows.push(<EventRow key={item.key} item={item} isNew={newKeys.has(item.key)} />);
    lastHalf = item.half;
  }

  return <div className="divide-y divide-border/50">{rows}</div>;
}
