'use client';

import { cn } from '@/lib/utils';
import type { TicketLeg as TicketLegType } from '@/types';

// ── Market icon map ───────────────────────────────────────────────────────────

function marketIcon(market: string): string {
  if (market === 'btts_yes' || market === 'btts_no') return '🎯';
  if (market.startsWith('over_') || market.startsWith('under_')) {
    // corners: over_8_5 / over_9_5 / over_10_5
    if (['over_8_5','under_8_5','over_9_5','under_9_5','over_10_5','under_10_5'].includes(market)) return '🚩';
    return '📊';
  }
  if (market === 'home_clean_sheet' || market === 'away_clean_sheet') return '🛡️';
  if (market === 'dc_1x' || market === 'dc_12' || market === 'dc_x2') return '⚽';
  return '⚽'; // 1x2 and fallback
}

function probColor(p: number): string {
  if (p >= 0.70) return 'bg-emerald-500';
  if (p >= 0.55) return 'bg-amber-500';
  return 'bg-red-500';
}

function probTextColor(p: number): string {
  if (p >= 0.70) return 'text-emerald-400';
  if (p >= 0.55) return 'text-amber-400';
  return 'text-red-400';
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface TicketLegProps {
  leg:        TicketLegType;
  index:      number;
  tierColor:  string;   // e.g. 'text-emerald-400'
  tierBg:     string;   // e.g. 'bg-emerald-500/15'
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
        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
        tierBg, tierColor
      )}>
        {index + 1}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Match + league + kickoff */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">
            {leg.match}
          </span>
          {leg.league && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
              {leg.league}
            </span>
          )}
          {kickoffLabel && (
            <span className="text-xs text-muted-foreground shrink-0">{kickoffLabel}</span>
          )}
        </div>

        {/* Selection */}
        <div className="flex items-center gap-2">
          <span className="text-sm">{marketIcon(leg.market)}</span>
          <span className={cn('text-sm font-semibold', tierColor)}>
            {leg.selection}
          </span>
          <span className="text-xs text-muted-foreground">@ {leg.odds}</span>
        </div>

        {/* Probability bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
            <div
              className={cn('h-full rounded-full transition-all duration-700', probColor(leg.probability))}
              style={{ width: `${Math.round(leg.probability * 100)}%` }}
            />
          </div>
          <span className={cn('text-xs font-medium tabular-nums', probTextColor(leg.probability))}>
            {Math.round(leg.probability * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
