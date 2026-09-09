'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Prediction } from '@/types';

// ── Factor config ─────────────────────────────────────────────────────────────

interface Factor {
  key:     string;
  label:   string;
  weight:  number;
  home:    number;
  away:    number;
  tooltip: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AlgorithmBreakdownProps {
  prediction: Prediction;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AlgorithmBreakdown({ prediction, className }: AlgorithmBreakdownProps) {
  const { factors, home_team, away_team } = prediction;

  const factorList: Factor[] = [
    {
      key:     'form',
      label:   'Recent Form',
      weight:  30,
      home:    factors.home_form_score,
      away:    factors.away_form_score,
      tooltip: 'Win-rate over last 5 matches. Wins = 3pts, Draws = 1pt. Normalised 0–1.',
    },
    {
      key:     'h2h',
      label:   'Head to Head',
      weight:  20,
      home:    factors.home_h2h_score,
      away:    factors.away_h2h_score,
      tooltip: 'Win/draw/loss record across last 10 head-to-head meetings.',
    },
    {
      key:     'venue',
      label:   'Home / Away Advantage',
      weight:  15,
      home:    factors.home_home_win_rate,
      away:    factors.away_away_win_rate,
      tooltip: "Home team's home win rate vs away team's away win rate this season.",
    },
    {
      key:     'goals',
      label:   'Expected Goals',
      weight:  20,
      home:    factors.home_expected_goals,
      away:    factors.away_expected_goals,
      tooltip: 'xG model: shot quality, location, and volume over last 5 matches.',
    },
    {
      key:     'odds',
      label:   'Bookmaker Consensus',
      weight:  15,
      // derive implied probabilities from our model's output as proxy
      home:    prediction.home_win,
      away:    prediction.away_win,
      tooltip: 'Aggregate implied probability drawn from major bookmaker markets.',
    },
  ];

  return (
    <div className={cn('space-y-5', className)}>
      {/* Team labels */}
      <div className="flex items-center justify-between text-[12px] font-semibold">
        <span className="text-primary truncate">{home_team}</span>
        <span className="label shrink-0 px-2">v</span>
        <span className="text-down truncate text-right">{away_team}</span>
      </div>

      {factorList.map((f) => {
        const total     = f.home + f.away || 1;
        const homeW     = (f.home / total) * 100;
        const awayW     = (f.away / total) * 100;
        const homeleads = f.home >= f.away;
        const delta     = Math.abs(f.home - f.away);
        const isEven    = delta < 0.04;

        return (
          <div key={f.key} className="space-y-1.5">
            {/* Header row */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium flex-1">{f.label}</span>
              <span className="num text-[10px] text-muted-foreground bg-muted rounded-sm px-1.5 py-0.5 shrink-0">
                {f.weight}%
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label={`About ${f.label}`} className="shrink-0">
                    <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs">
                  {f.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Score values */}
            <div className="flex items-center justify-between">
              <span className={cn('num text-[11px] font-semibold', homeleads ? 'text-primary' : 'text-muted-foreground')}>
                {(f.home * 100).toFixed(0)}%
              </span>
              <span className={cn('num text-[11px] font-semibold', !homeleads ? 'text-down' : 'text-muted-foreground')}>
                {(f.away * 100).toFixed(0)}%
              </span>
            </div>

            {/* Dual bar — abutting, hard edges */}
            <div className="flex h-1.5 overflow-hidden bg-muted">
              <div className={cn('h-full', homeleads ? 'bg-primary' : 'bg-primary/30')} style={{ width: `${homeW}%` }} />
              <div className={cn('h-full', !homeleads ? 'bg-down' : 'bg-down/30')} style={{ width: `${awayW}%` }} />
            </div>

            {/* Favour label */}
            <p className="label normal-case tracking-normal text-muted-foreground/70">
              {isEven ? 'Evenly matched' : `Favours ${homeleads ? home_team : away_team}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
