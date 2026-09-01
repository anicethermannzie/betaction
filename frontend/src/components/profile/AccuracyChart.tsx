'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';

export interface AccuracyPoint {
  period:   string;
  accuracy: number;
}

// Colours resolve from the design-system CSS custom properties.
const LINE = 'hsl(var(--primary))';
const GRID = 'hsl(var(--border))';
const AXIS = 'hsl(var(--muted-foreground))';

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel-raised px-3 py-2">
      <p className="label mb-0.5">{label}</p>
      <p className="num text-sm font-semibold text-primary">{payload[0].value}%</p>
    </div>
  );
}

interface AccuracyChartProps {
  data:       AccuracyPoint[];
  className?: string;
}

export function AccuracyChart({ data, className }: AccuracyChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />

          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: AXIS, fontFamily: 'var(--font-mono)' }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: AXIS, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: AXIS, strokeWidth: 1 }} />

          <Area
            type="linear"
            dataKey="accuracy"
            stroke={LINE}
            strokeWidth={1.5}
            fill={LINE}
            fillOpacity={0.08}
            dot={false}
            activeDot={{ r: 3, fill: LINE, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
