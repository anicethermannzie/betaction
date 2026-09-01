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
      <div className="flex items-center justify-between">
        <span className={cn('num text-[12px] font-semibold w-10', homeleads ? 'text-primary' : 'text-muted-foreground')}>
          {format(homeValue)}
        </span>
        <span className="label flex-1 text-center px-2 normal-case tracking-normal">{label}</span>
        <span className={cn('num text-[12px] font-semibold w-10 text-right', !homeleads ? 'text-primary' : 'text-muted-foreground')}>
          {format(awayValue)}
        </span>
      </div>
      <div className="flex h-1 overflow-hidden bg-muted">
        <div className={cn('h-full', homeleads ? 'bg-primary' : 'bg-muted-foreground/40')} style={{ width: `${homeW}%` }} />
        <div className={cn('h-full', !homeleads ? 'bg-primary' : 'bg-muted-foreground/40')} style={{ width: `${awayW}%` }} />
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
      <div className="flex items-center justify-between text-[12px] font-semibold">
        <span className="text-primary truncate">{homeTeam}</span>
        <span className="text-down truncate text-right">{awayTeam}</span>
      </div>

      {rows.map((row) => (
        <StatBar key={row.label} {...row} />
      ))}
    </div>
  );
}
