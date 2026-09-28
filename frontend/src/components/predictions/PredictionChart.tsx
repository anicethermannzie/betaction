'use client';

import { cn } from '@/lib/utils';
import type { Prediction } from '@/types';

interface PredictionChartProps {
  prediction: Prediction;
}

const OUTCOME_LABEL: Record<Prediction['prediction'], string> = {
  HOME_WIN: 'Home Win',
  DRAW:     'Draw',
  AWAY_WIN: 'Away Win',
};

// 1X2 probabilities as a market readout: a stacked hard-edged bar + a big
// monospace call. Clearer than a donut and on-language with the rest of the app.
export function PredictionChart({ prediction }: PredictionChartProps) {
  const rows = [
    { key: 'home', code: '1', name: prediction.home_team, p: prediction.home_win, color: 'text-primary', bar: 'bg-primary' },
    { key: 'draw', code: 'X', name: 'Draw',                p: prediction.draw,     color: 'text-hold',    bar: 'bg-hold' },
    { key: 'away', code: '2', name: prediction.away_team, p: prediction.away_win, color: 'text-down',    bar: 'bg-down' },
  ];

  const pick = prediction.prediction;
  const pickProb =
    pick === 'HOME_WIN' ? prediction.home_win :
    pick === 'AWAY_WIN' ? prediction.away_win :
    prediction.draw;
  const pickColor =
    pick === 'HOME_WIN' ? 'text-primary' :
    pick === 'AWAY_WIN' ? 'text-down' : 'text-hold';

  return (
    <div className="space-y-4">
      {/* The call */}
      <div className="flex items-end justify-between">
        <div>
          <p className="label mb-1">Model call</p>
          <p className="text-sm text-foreground">{OUTCOME_LABEL[pick]}</p>
        </div>
        <p className={cn('num text-3xl font-bold leading-none', pickColor)}>
          {(pickProb * 100).toFixed(1)}<span className="text-lg">%</span>
        </p>
      </div>

      {/* Stacked probability bar — three abutting segments */}
      <div className="h-2 w-full overflow-hidden bg-muted flex">
        {rows.map((r) => (
          <div key={r.key} className={r.bar} style={{ width: `${r.p * 100}%` }} />
        ))}
      </div>

      {/* Breakdown rows */}
      <div className="divide-y divide-border border-y border-border">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3 py-2">
            <span className={cn('num text-[11px] w-4 text-center opacity-60', r.color)}>{r.code}</span>
            <span className="text-[13px] text-foreground/85 truncate flex-1">{r.name}</span>
            <div className="h-1 w-24 bg-muted overflow-hidden shrink-0">
              <div className={cn('h-full', r.bar)} style={{ width: `${r.p * 100}%` }} />
            </div>
            <span className={cn('num text-[12px] font-semibold w-14 text-right', r.color)}>
              {(r.p * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
