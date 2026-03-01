'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { isMatchInProgress } from '@/lib/utils';
import type { ApiFixture } from '@/types';

// ── Countdown helper ──────────────────────────────────────────────────────────

function useCountdown(targetMs: number | null): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (targetMs === null) { setLabel(''); return; }

    const update = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) { setLabel('Starting now'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };

    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [targetMs]);

  return label;
}

// ── Single ticker item ────────────────────────────────────────────────────────

function TickerItem({ fixture }: { fixture: ApiFixture }) {
  const { fixture: f, teams, goals } = fixture;
  const inProgress = isMatchInProgress(f.status.short);
  const elapsed    = f.status.elapsed;

  return (
    <Link
      href={`/predictions/${f.id}`}
      className="flex items-center gap-3 px-4 h-full shrink-0 hover:bg-white/5 transition-colors border-r border-border/30 last:border-r-0 cursor-pointer"
    >
      {/* Home team */}
      <div className="flex items-center gap-1.5 min-w-0">
        {teams.home.logo ? (
          <Image
            src={teams.home.logo}
            alt={teams.home.name}
            width={18}
            height={18}
            className="object-contain shrink-0"
          />
        ) : (
          <div className="h-4.5 w-4.5 rounded-full bg-slate-700 shrink-0" />
        )}
        <span className="text-xs font-medium text-foreground/90 truncate max-w-[72px]">
          {teams.home.name}
        </span>
      </div>

      {/* Score + time */}
      <div className="flex items-center gap-1.5 shrink-0">
        {inProgress && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
        )}
        <span
          className={`text-sm font-bold tabular-nums ${
            inProgress ? 'text-primary' : 'text-foreground'
          }`}
        >
          {goals.home ?? 0}&nbsp;–&nbsp;{goals.away ?? 0}
        </span>
        {elapsed != null && (
          <span className="text-[10px] text-red-400 font-semibold">{elapsed}&prime;</span>
        )}
        {f.status.short === 'HT' && (
          <span className="text-[10px] text-amber-400 font-semibold">HT</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-medium text-foreground/90 truncate max-w-[72px]">
          {teams.away.name}
        </span>
        {teams.away.logo ? (
          <Image
            src={teams.away.logo}
            alt={teams.away.name}
            width={18}
            height={18}
            className="object-contain shrink-0"
          />
        ) : (
          <div className="h-4.5 w-4.5 rounded-full bg-slate-700 shrink-0" />
        )}
      </div>
    </Link>
  );
}

// ── Loading dots ──────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex items-center justify-center h-full gap-1.5">
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LiveScoresTickerProps {
  /** Today's upcoming (not-started) fixtures, used for the countdown display */
  upcomingFixtures?: ApiFixture[];
}

export function LiveScoresTicker({ upcomingFixtures = [] }: LiveScoresTickerProps) {
  const { fixtures: liveFixtures, loading } = useLiveMatches();

  // Duplicate items for seamless infinite scroll loop
  const hasLive      = liveFixtures.length > 0;
  const needsLoop    = liveFixtures.length >= 3;
  const displayItems = hasLive && needsLoop
    ? [...liveFixtures, ...liveFixtures]
    : liveFixtures;

  // Next upcoming match for countdown
  const nextMs: number | null = (() => {
    const now  = Date.now();
    const next = upcomingFixtures
      .filter((f) => f.fixture.status.short === 'NS' && new Date(f.fixture.date).getTime() > now)
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())[0];
    return next ? new Date(next.fixture.date).getTime() : null;
  })();

  const nextFixture = nextMs
    ? upcomingFixtures.find(
        (f) => new Date(f.fixture.date).getTime() === nextMs
      )
    : undefined;

  const countdown = useCountdown(nextMs);

  // Auto-scroll (RAF-based, pause on hover / touch)
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !needsLoop) return;

    const tick = () => {
      if (!pausedRef.current && el) {
        el.scrollLeft += 0.5;
        // Seamless reset at the halfway point (second copy begins)
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const pause  = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };

    el.addEventListener('mouseenter',  pause);
    el.addEventListener('mouseleave',  resume);
    el.addEventListener('touchstart',  pause,  { passive: true });
    el.addEventListener('touchend',    resume);
    el.addEventListener('touchcancel', resume);

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('mouseenter',  pause);
      el.removeEventListener('mouseleave',  resume);
      el.removeEventListener('touchstart',  pause);
      el.removeEventListener('touchend',    resume);
      el.removeEventListener('touchcancel', resume);
    };
  }, [needsLoop]);

  return (
    <div className="w-full h-11 bg-slate-900/70 border-b border-border/50 backdrop-blur-sm overflow-hidden">
      {loading ? (
        <LoadingDots />
      ) : hasLive ? (
        /* ── Live matches scrolling ── */
        <div
          ref={scrollRef}
          className="flex items-center h-full overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayItems.map((f, i) => (
            <TickerItem key={`${f.fixture.id}-${i}`} fixture={f} />
          ))}
        </div>
      ) : (
        /* ── No live matches: countdown ── */
        <div className="flex items-center justify-center h-full gap-2 px-4 text-xs text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-600" />
          </span>
          <span>No live matches right now</span>

          {nextFixture && countdown && (
            <>
              <span className="text-border mx-1">·</span>
              <span>
                Next:{' '}
                <span className="text-foreground font-medium">
                  {nextFixture.teams.home.name} vs {nextFixture.teams.away.name}
                </span>{' '}
                in{' '}
                <span className="text-primary font-semibold">{countdown}</span>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
