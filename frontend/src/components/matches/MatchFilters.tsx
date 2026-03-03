'use client';

import { cn } from '@/lib/utils';
import { POPULAR_LEAGUES } from '@/types';

export type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished';

const ALL_LEAGUES_OPTION = { id: null as number | null, name: 'All Leagues', flag: '🌍' };

const LEAGUE_OPTIONS = [
  ALL_LEAGUES_OPTION,
  ...POPULAR_LEAGUES.map((l) => ({ id: l.id as number | null, name: l.name, flag: l.flag })),
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',      label: 'All'      },
  { value: 'live',     label: 'Live'     },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'finished', label: 'Finished' },
];

interface MatchFiltersProps {
  selectedLeague: number | null;
  selectedStatus: StatusFilter;
  liveCount:      number;
  onLeagueChange: (id: number | null) => void;
  onStatusChange: (status: StatusFilter) => void;
}

export function MatchFilters({
  selectedLeague,
  selectedStatus,
  liveCount,
  onLeagueChange,
  onStatusChange,
}: MatchFiltersProps) {
  return (
    <div className="space-y-2.5">
      {/* ── League filter ── scrollable pill row */}
      <div
        className="flex items-center gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {LEAGUE_OPTIONS.map(({ id, name, flag }) => {
          const active = selectedLeague === id;
          return (
            <button
              key={id ?? 'all'}
              type="button"
              onClick={() => onLeagueChange(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5',
                'text-xs font-medium whitespace-nowrap shrink-0 border transition-all duration-150',
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card/70 text-muted-foreground border-border hover:text-foreground hover:border-border/80'
              )}
            >
              <span className="text-sm leading-none" aria-hidden="true">{flag}</span>
              <span>{name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Status filter ── inline tabs */}
      <div className="flex items-center gap-0.5" role="tablist">
        {STATUS_OPTIONS.map(({ value, label }) => {
          const active  = selectedStatus === value;
          const isLive  = value === 'live';
          const hasLive = isLive && liveCount > 0;

          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatusChange(value)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
                active
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {/* Pulsing dot when there are live matches */}
              {hasLive && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
              )}
              {label}
              {/* Live count badge */}
              {hasLive && (
                <span className="rounded-full bg-red-500/20 text-red-400 px-1.5 py-px text-[10px] font-bold leading-none">
                  {liveCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
