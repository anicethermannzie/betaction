'use client';

import { cn } from '@/lib/utils';
import type { TeamStats } from '@/types';

// ── Props ─────────────────────────────────────────────────────────────────────

interface StatsComparisonProps {
  homeTeam:   string;
  awayTeam:   string;
  homeStats:  TeamStats;
  awayStats:  TeamStats;
  className?: string;
}

// ── Stat bar row ──────────────────────────────────────────────────────────────

interface StatBarProps {
  label:     string;
  homeValue: number;
  awayValue: number;
  format:    (v: number) => string;
  lowerIsBetter?: boolean; // for "Goals Conceded" — lower is better for the home team
}

function StatBar({ label, homeValue, awayValue, format, lowerIsBetter = false }: StatBarProps) {
  const total    = homeValue + awayValue || 1;
  const homeW    = (homeValue / total) * 100;
  const awayW    = (awayValue / total) * 100;
  // "leads" = has the better value
  const homeleads = lowerIsBetter ? homeValue <= awayValue : homeValue >= awayValue;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={cn('font-semibold w-10', homeleads ? 'text-emerald-400' : 'text-red-400')}>
          {format(homeValue)}
        </span>
        <span className="text-muted-foreground text-[11px] text-center flex-1 px-2">{label}</span>
        <span className={cn('font-semibold w-10 text-right', !homeleads ? 'text-emerald-400' : 'text-red-400')}>
          {format(awayValue)}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div
          className={cn(
            'h-full rounded-l-full transition-all duration-700',
            homeleads ? 'bg-emerald-500' : 'bg-red-500/50'
          )}
          style={{ width: `${homeW}%` }}
        />
        <div
          className={cn(
            'h-full rounded-r-full transition-all duration-700',
            !homeleads ? 'bg-emerald-500' : 'bg-red-500/50'
          )}
          style={{ width: `${awayW}%` }}
        />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatsComparison({ homeTeam, awayTeam, homeStats, awayStats, className }: StatsComparisonProps) {
  const rows: StatBarProps[] = [
    {
      label:     'Goals Scored',
      homeValue: homeStats.goalsScored,
      awayValue: awayStats.goalsScored,
      format:    (v) => v.toFixed(1),
    },
    {
      label:          'Goals Conceded',
      homeValue:      homeStats.goalsConceded,
      awayValue:      awayStats.goalsConceded,
      format:         (v) => v.toFixed(1),
      lowerIsBetter:  true,
    },
    {
      label:     'Shots on Target',
      homeValue: homeStats.shotsOnTarget,
      awayValue: awayStats.shotsOnTarget,
      format:    (v) => v.toFixed(1),
    },
    {
      label:     'Possession',
      homeValue: homeStats.possession,
      awayValue: awayStats.possession,
      format:    (v) => `${v}%`,
    },
    {
      label:     'Clean Sheets',
      homeValue: homeStats.cleanSheets,
      awayValue: awayStats.cleanSheets,
      format:    (v) => String(v),
    },
    {
      label:     'Corners / Game',
      homeValue: homeStats.cornersPerGame,
      awayValue: awayStats.cornersPerGame,
      format:    (v) => v.toFixed(1),
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Team labels */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-emerald-400">{homeTeam}</span>
        <span className="text-red-400">{awayTeam}</span>
      </div>

      {rows.map((row) => (
        <StatBar key={row.label} {...row} />
      ))}
    </div>
  );
}
