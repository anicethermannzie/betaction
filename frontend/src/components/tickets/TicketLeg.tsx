'use client';

import { cn } from '@/lib/utils';
import type { TicketLeg as TicketLegType } from '@/types';

function probColor(p: number): string {
  if (p >= 0.70) return 'bg-primary';
  if (p >= 0.55) return 'bg-hold';
  return 'bg-down';
}

function probTextColor(p: number): string {
  if (p >= 0.70) return 'text-primary';
  if (p >= 0.55) return 'text-hold';
  return 'text-down';
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface TicketLegProps {
  leg:        TicketLegType;
  index:      number;
  tierColor:  string;   // e.g. 'text-primary'
  tierBg:     string;   // e.g. 'bg-primary/15'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketLeg({ leg, index, tierColor, tierBg }: TicketLegProps) {
  const kickoffLabel = leg.kickoff
    ? new Date(leg.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Leg number */}
      <div className={cn(
        'shrink-0 w-6 h-6 rounded-sm flex items-center justify-center font-mono text-[11px] font-bold',
        tierBg, tierColor
      )}>
        {index + 1}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Match + league + kickoff */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-foreground truncate">
            {leg.match}
          </span>
          {leg.league && (
            <span className="label shrink-0">{leg.league}</span>
          )}
          {kickoffLabel && (
            <span className="num text-[10px] text-muted-foreground shrink-0">{kickoffLabel}</span>
          )}
        </div>

        {/* Selection */}
        <div className="flex items-center gap-2">
          <span className={cn('text-[13px] font-semibold', tierColor)}>
            {leg.selection}
          </span>
          <span className="num text-[11px] text-muted-foreground">@ {leg.odds}</span>
        </div>

        {/* Probability bar */}
        <div className="flex items-center gap-2">
          <div className="stat-bar max-w-[120px]">
            <div
              className={cn('h-full', probColor(leg.probability))}
              style={{ width: `${Math.round(leg.probability * 100)}%` }}
            />
          </div>
          <span className={cn('num text-[11px] font-medium', probTextColor(leg.probability))}>
            {Math.round(leg.probability * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
