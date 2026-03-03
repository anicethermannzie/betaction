'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { formatProbability } from '@/lib/utils';
import type { Prediction } from '@/types';

interface PredictionChartProps {
  prediction: Prediction;
}

const COLORS = {
  home: '#10b981', // emerald-500
  draw: '#f59e0b', // amber-500
  away: '#ef4444', // red-500
};

const OUTCOME_LABEL: Record<Prediction['prediction'], string> = {
  HOME_WIN: 'Home Win',
  DRAW:     'Draw',
  AWAY_WIN: 'Away Win',
};

// ── Custom SVG center label ───────────────────────────────────────────────────

function CenterLabel({ viewBox, prediction }: {
  viewBox?: { cx?: number; cy?: number };
  prediction: Prediction;
}) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;

  const outcome = OUTCOME_LABEL[prediction.prediction];
  const prob    =
    prediction.prediction === 'HOME_WIN' ? prediction.home_win :
    prediction.prediction === 'AWAY_WIN' ? prediction.away_win :
    prediction.draw;

  const color =
    prediction.prediction === 'HOME_WIN' ? COLORS.home :
    prediction.prediction === 'AWAY_WIN' ? COLORS.away :
    COLORS.draw;

  return (
    <text textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} y={cy - 10} fontSize={12} fontWeight={600} fill="hsl(215 20% 65%)">
        {outcome}
      </tspan>
      <tspan x={cx} y={cy + 12} fontSize={22} fontWeight={900} fill={color}>
        {formatProbability(prob)}
      </tspan>
    </text>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PredictionChart({ prediction }: PredictionChartProps) {
  const data = [
    { name: prediction.home_team, value: Math.round(prediction.home_win * 100), color: COLORS.home },
    { name: 'Draw',               value: Math.round(prediction.draw * 100),     color: COLORS.draw },
    { name: prediction.away_team, value: Math.round(prediction.away_win * 100), color: COLORS.away },
  ];

  return (
    <div className="flex flex-col items-center gap-5">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
            isAnimationActive
            animationBegin={100}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <Label
              content={(props) => (
                <CenterLabel
                  viewBox={props.viewBox as { cx?: number; cy?: number }}
                  prediction={prediction}
                />
              )}
              position="center"
            />
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}%`, '']}
            contentStyle={{
              backgroundColor: 'hsl(222 47% 8%)',
              border:          '1px solid hsl(215 20% 20%)',
              borderRadius:    '8px',
              fontSize:        '12px',
              color:           'hsl(215 20% 75%)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend — 3 columns */}
      <div className="grid grid-cols-3 gap-3 w-full text-center">
        {data.map((entry) => (
          <div key={entry.name} className="flex flex-col items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm font-bold tabular-nums" style={{ color: entry.color }}>
              {entry.value}%
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight truncate max-w-[90px]">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
