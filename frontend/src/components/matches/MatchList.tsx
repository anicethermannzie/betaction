'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, CalendarX } from 'lucide-react';
import { MatchCard } from './MatchCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { cn, isMatchInProgress } from '@/lib/utils';
import type { ApiFixture, ApiLeague, Prediction } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MatchGroup {
  key:      string;
  league:   ApiLeague;
  fixtures: ApiFixture[];
  hasLive:  boolean;
}

export interface MatchListProps {
  fixtures:       ApiFixture[];
  isLoading?:     boolean;
  groupByLeague?: boolean;
  collapsible?:   boolean;
  emptyMessage?:  string;
  predictions?:   Map<number, Prediction>;
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

function sortWithinGroup(fixtures: ApiFixture[]): ApiFixture[] {
  return [...fixtures].sort((a, b) => {
    const aLive = isMatchInProgress(a.fixture.status.short);
    const bLive = isMatchInProgress(b.fixture.status.short);
    if (aLive !== bLive) return aLive ? -1 : 1;
    return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
  });
}

function sortGroups(groups: MatchGroup[]): MatchGroup[] {
  return [...groups].sort((a, b) => {
    if (a.hasLive !== b.hasLive) return a.hasLive ? -1 : 1;
    return a.league.name.localeCompare(b.league.name);
  });
}

function buildGroups(fixtures: ApiFixture[]): MatchGroup[] {
  const map = new Map<string, MatchGroup>();

  for (const f of fixtures) {
    const key = `${f.league.id}-${f.league.season}`;
    if (!map.has(key)) {
      map.set(key, { key, league: f.league, fixtures: [], hasLive: false });
    }
    const group = map.get(key)!;
    group.fixtures.push(f);
    if (isMatchInProgress(f.fixture.status.short)) group.hasLive = true;
  }

  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    fixtures: sortWithinGroup(g.fixtures),
  }));

  return sortGroups(groups);
}

// ── Sub-component: league group header ────────────────────────────────────────

interface LeagueGroupHeaderProps {
  league:     ApiLeague;
  count:      number;
  hasLive:    boolean;
  open:       boolean;
  collapsible: boolean;
  onToggle:   () => void;
}

function LeagueGroupHeader({ league, count, hasLive, open, collapsible, onToggle }: LeagueGroupHeaderProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 text-left',
        'hover:bg-muted/30 transition-colors',
        hasLive ? 'bg-red-950/15' : 'bg-muted/20',
        !collapsible && 'cursor-default'
      )}
      onClick={collapsible ? onToggle : undefined}
    >
      {/* League logo */}
      {league.logo ? (
        <Image
          src={league.logo}
          alt={league.name}
          width={18}
          height={18}
          className="object-contain shrink-0 opacity-90"
        />
      ) : (
        <div className="h-4.5 w-4.5 rounded-full bg-muted shrink-0" />
      )}

      {/* Name + country */}
      <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
        <span className="text-sm font-semibold truncate">{league.name}</span>
        <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
          {league.country}
        </span>
      </div>

      {/* Live dot */}
      {hasLive && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
        </span>
      )}

      {/* Count */}
      <span className="text-[11px] text-muted-foreground shrink-0">{count}</span>

      {/* Chevron */}
      {collapsible && (
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MatchList({
  fixtures,
  isLoading,
  groupByLeague = false,
  collapsible   = false,
  emptyMessage  = 'No matches found.',
  predictions,
}: MatchListProps) {
  // Set of collapsed group keys
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => buildGroups(fixtures), [fixtures]);

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="match" />
        ))}
      </div>
    );
  }

  // ── Empty ──
  if (fixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <CalendarX className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  // ── Flat list (no grouping) ──
  if (!groupByLeague) {
    return (
      <div className="space-y-2">
        {fixtures.map((f) => (
          <MatchCard
            key={f.fixture.id}
            fixture={f}
            prediction={predictions?.get(f.fixture.id)}
          />
        ))}
      </div>
    );
  }

  // ── Grouped list ──
  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = !collapsible || !collapsed.has(group.key);

        return (
          <div
            key={group.key}
            className={cn(
              'rounded-xl border overflow-hidden',
              group.hasLive
                ? 'border-red-500/25 border-l-2 border-l-red-500'
                : 'border-border/60'
            )}
          >
            <LeagueGroupHeader
              league={group.league}
              count={group.fixtures.length}
              hasLive={group.hasLive}
              open={isOpen}
              collapsible={collapsible}
              onToggle={() => toggle(group.key)}
            />

            {isOpen && (
              <div className="divide-y divide-border/40">
                {group.fixtures.map((f) => (
                  <MatchCard
                    key={f.fixture.id}
                    fixture={f}
                    prediction={predictions?.get(f.fixture.id)}
                    className="rounded-none border-0 shadow-none"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
