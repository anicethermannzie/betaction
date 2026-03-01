'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn, formatProbability, getPredictionColors, getConfidenceConfig } from '@/lib/utils';
import type { Prediction } from '@/types';

// ── Sort helper ───────────────────────────────────────────────────────────────

const CONF_RANK = { high: 3, medium: 2, low: 1 } as const;

function sortByConfidenceThenProbability(predictions: Prediction[]): Prediction[] {
  return [...predictions].sort((a, b) => {
    const cd = CONF_RANK[b.confidence] - CONF_RANK[a.confidence];
    if (cd !== 0) return cd;
    const aMax = Math.max(a.home_win, a.away_win, a.draw);
    const bMax = Math.max(b.home_win, b.away_win, b.draw);
    return bMax - aMax;
  });
}

// ── Individual card ───────────────────────────────────────────────────────────

function PredictionCard({ p }: { p: Prediction }) {
  const colors   = getPredictionColors(p.prediction);
  const confCfg  = getConfidenceConfig(p.confidence);

  const winnerName =
    p.prediction === 'HOME_WIN'
      ? p.home_team
      : p.prediction === 'AWAY_WIN'
      ? p.away_team
      : 'Draw';

  const winnerProb =
    p.prediction === 'HOME_WIN'
      ? p.home_win
      : p.prediction === 'AWAY_WIN'
      ? p.away_win
      : p.draw;

  return (
    <Link
      href={`/predictions/${p.fixture_id}`}
      className="block shrink-0 w-[192px] group"
    >
      <div className="h-full rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover-glow hover:border-primary/40 transition-all duration-200">
        {/* Teams */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{p.home_team}</p>
          <p className="text-[10px] text-muted-foreground/60">vs</p>
          <p className="text-xs font-medium text-foreground truncate">{p.away_team}</p>
        </div>

        {/* Outcome pill + probability */}
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              'self-start inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border',
              colors.text,
              colors.bg,
              colors.border
            )}
          >
            {winnerName}
          </span>
          <span className={cn('text-2xl font-black', colors.text)}>
            {formatProbability(winnerProb)}
          </span>
        </div>

        {/* Tri-color mini bar */}
        <div className="flex h-1 rounded-full overflow-hidden gap-px">
          <div className="bg-emerald-500 rounded-l-full" style={{ width: `${p.home_win * 100}%` }} />
          <div className="bg-amber-400"                  style={{ width: `${p.draw * 100}%` }} />
          <div className="bg-red-400 rounded-r-full"     style={{ width: `${p.away_win * 100}%` }} />
        </div>

        {/* Confidence row */}
        <div className="space-y-1 mt-auto">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground">Confidence</span>
            <span className={cn('font-semibold', confCfg.color)}>{confCfg.label}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full rounded-full', confCfg.bg)} style={{ width: confCfg.width }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface TopPredictionsScrollProps {
  predictions: Prediction[];
}

export function TopPredictionsScroll({ predictions }: TopPredictionsScrollProps) {
  if (predictions.length === 0) return null;

  const sorted = sortByConfidenceThenProbability(predictions).slice(0, 8);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Top Predictions Today</h2>
        <Link
          href="/predictions"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Horizontal scroll container */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-6 md:px-6"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
      >
        {sorted.map((p) => (
          <PredictionCard key={p.fixture_id} p={p} />
        ))}
      </div>
    </section>
  );
}
