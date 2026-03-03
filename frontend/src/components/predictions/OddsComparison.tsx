'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchOdds, Prediction } from '@/types';

// ── Props ─────────────────────────────────────────────────────────────────────

interface OddsComparisonProps {
  odds:       MatchOdds;
  prediction: Prediction;
  className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function impliedProb(decimalOdds: number): number {
  return 1 / decimalOdds;
}

// ── Odds row ──────────────────────────────────────────────────────────────────

interface OddsRowProps {
  label:       string;
  odds:        number;
  implied:     number;
  ourProb:     number;
  accentColor: string;
}

function OddsRow({ label, odds, implied, ourProb, accentColor }: OddsRowProps) {
  const delta    = ourProb - implied;
  const hasValue = Math.abs(delta) > 0.05;
  const positive = delta > 0;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      {/* Outcome label */}
      <div className="w-16 shrink-0">
        <p className="text-xs font-semibold truncate">{label}</p>
      </div>

      {/* 3-column data */}
      <div className="flex-1 grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="font-mono font-bold text-sm">{odds.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Odds</p>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: accentColor }}>
            {(implied * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">Implied</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">
            {(ourProb * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">Model</p>
        </div>
      </div>

      {/* Delta badge */}
      {hasValue ? (
        <div
          className={cn(
            'flex items-center gap-0.5 text-[10px] font-bold shrink-0 rounded px-1.5 py-0.5',
            positive
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          )}
        >
          {positive
            ? <TrendingUp className="h-2.5 w-2.5" />
            : <TrendingDown className="h-2.5 w-2.5" />
          }
          {(Math.abs(delta) * 100).toFixed(1)}%
        </div>
      ) : (
        <Minus className="h-3 w-3 text-muted-foreground/30 shrink-0" />
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OddsComparison({ odds, prediction, className }: OddsComparisonProps) {
  const homeImplied = impliedProb(odds.homeWin);
  const drawImplied = impliedProb(odds.draw);
  const awayImplied = impliedProb(odds.awayWin);

  const rows: OddsRowProps[] = [
    {
      label:       prediction.home_team,
      odds:        odds.homeWin,
      implied:     homeImplied,
      ourProb:     prediction.home_win,
      accentColor: '#10b981',
    },
    {
      label:       'Draw',
      odds:        odds.draw,
      implied:     drawImplied,
      ourProb:     prediction.draw,
      accentColor: '#f59e0b',
    },
    {
      label:       prediction.away_team,
      odds:        odds.awayWin,
      implied:     awayImplied,
      ourProb:     prediction.away_win,
      accentColor: '#ef4444',
    },
  ];

  // Value bet: our model gives ≥8% more probability than the odds imply for the predicted outcome
  const predictedRow =
    prediction.prediction === 'HOME_WIN' ? rows[0] :
    prediction.prediction === 'AWAY_WIN' ? rows[2] :
    rows[1];
  const isValueBet = predictedRow.ourProb - predictedRow.implied >= 0.08;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header: bookmaker + value bet badge */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{odds.bookmaker}</p>
        {isValueBet && (
          <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full px-2.5 py-1 border border-emerald-500/25">
            <TrendingUp className="h-3 w-3" />
            Value Bet
          </span>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 uppercase tracking-wide">
        <div className="w-16 shrink-0" />
        <div className="flex-1 grid grid-cols-3 gap-1 text-center">
          <span>Odds</span>
          <span>Implied</span>
          <span>Our Model</span>
        </div>
        <div className="w-12 shrink-0" />
      </div>

      {/* Rows */}
      {rows.map((row) => (
        <OddsRow key={row.label} {...row} />
      ))}

      <p className="text-[10px] text-muted-foreground/50 text-center pt-1">
        Odds are indicative. This is not betting advice.
      </p>
    </div>
  );
}
