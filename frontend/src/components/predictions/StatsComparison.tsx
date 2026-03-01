import { cn } from '@/lib/utils';
import type { Prediction } from '@/types';

interface StatsComparisonProps {
  prediction: Prediction;
  className?: string;
}

interface StatRowProps {
  label:     string;
  homeValue: number;
  awayValue: number;
  format?:   (v: number) => string;
}

function StatRow({ label, homeValue, awayValue, format = (v) => `${Math.round(v * 100)}%` }: StatRowProps) {
  const total = homeValue + awayValue || 1;
  const homeW = (homeValue / total) * 100;
  const awayW = (awayValue / total) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{format(homeValue)}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{format(awayValue)}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div
          className="h-full rounded-l-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${homeW}%` }}
        />
        <div
          className="h-full rounded-r-full bg-amber-500 transition-all duration-700"
          style={{ width: `${awayW}%` }}
        />
      </div>
    </div>
  );
}

export function StatsComparison({ prediction, className }: StatsComparisonProps) {
  const { factors } = prediction;

  const rows = [
    { label: 'Form',      homeValue: factors.home_form,         awayValue: factors.away_form },
    { label: 'H2H',       homeValue: factors.home_h2h_wins,     awayValue: factors.away_h2h_wins },
    { label: 'Home/Away', homeValue: factors.home_home_perf,    awayValue: factors.away_away_perf },
    { label: 'Att. xG',   homeValue: factors.home_xg ?? 0,      awayValue: factors.away_xg ?? 0, format: (v: number) => v.toFixed(2) },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span className="font-semibold text-emerald-500">{prediction.home_team}</span>
        <span className="font-semibold text-amber-500">{prediction.away_team}</span>
      </div>
      {rows.map((row) => (
        <StatRow key={row.label} {...row} format={row.format as (v: number) => string | undefined} />
      ))}
    </div>
  );
}
