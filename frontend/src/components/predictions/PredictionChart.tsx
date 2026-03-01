'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatProbability } from '@/lib/utils';
import type { Prediction } from '@/types';

interface PredictionChartProps {
  prediction: Prediction;
}

const COLORS = ['#10b981', '#94a3b8', '#f59e0b'];

export function PredictionChart({ prediction }: PredictionChartProps) {
  const data = [
    { name: prediction.home_team, value: Math.round(prediction.home_win * 100) },
    { name: 'Draw',               value: Math.round(prediction.draw * 100) },
    { name: prediction.away_team, value: Math.round(prediction.away_win * 100) },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}%`, '']}
            contentStyle={{
              backgroundColor: 'hsl(222 47% 8%)',
              border:          '1px solid hsl(215 20% 20%)',
              borderRadius:    '8px',
              fontSize:        '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 w-full text-center">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-xs font-bold" style={{ color: COLORS[i] }}>
              {formatProbability(i === 0 ? prediction.home_win : i === 1 ? prediction.draw : prediction.away_win)}
            </span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
