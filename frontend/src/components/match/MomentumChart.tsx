'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipProps,
} from 'recharts';
import { matchApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import { EmptyState, ErrorState } from '@/components/common/StateMessage';
import { Skeleton } from '@/components/ui/skeleton';
import type { MatchMomentum, MomentumMarker } from '@/types';

/**
 * Match Momentum chart.
 *
 * Built only from real, timestamped events (goals, cards) — see
 * backend/match-service/src/services/momentumCalculator.js's file header.
 * SofaScore's version is driven by a proprietary shot-by-shot feed API-
 * Football does not expose, so this reads sparser: flat between goals/cards
 * rather than continuously undulating. Every point on it is real.
 *
 * Rendered as a single diverging bar per 2-minute window: net = home_score -
 * away_score for that window. A positive net (home had the eventful window)
 * draws emerald above the axis; a negative net (away did) draws blue below.
 * This is a derivation of two real per-team scores, not an invented signal.
 */

const HOME_COLOR = 'hsl(var(--primary))'; // emerald
const AWAY_COLOR = '#3b82f6'; // blue-500 — this app's palette has no semantic
// "away" color (unlike --down for "negative/no-value"); blue-500 already
// appears as a raw accent elsewhere (e.g. landing page decorative blur).
const GRID = 'hsl(var(--border))';
const AXIS = 'hsl(var(--muted-foreground))';

const POLL_INTERVAL_MS = 30_000;

interface ChartRow {
  minute: number;
  net: number;
}

function buildRows(windows: MatchMomentum['windows']): ChartRow[] {
  return windows.map((w) => ({ minute: w.minute, net: w.home_score - w.away_score }));
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const net = payload[0].value as number;
  if (net === 0) return null;
  return (
    <div className="panel-raised px-3 py-2">
      <p className="label mb-0.5">Minute {label}</p>
      <p className={`num text-sm font-semibold ${net > 0 ? 'text-primary' : ''}`} style={net < 0 ? { color: AWAY_COLOR } : undefined}>
        {net > 0 ? 'Home' : 'Away'} pressure
      </p>
    </div>
  );
}

function markerY(marker: MomentumMarker): number {
  // Goals/cards get plotted just off the axis on their team's side, clear of
  // the tallest bars (clamped to ±10 — see momentumCalculator.js).
  return marker.team === 'home' ? 12 : -12;
}

function MarkerIcon({ cx, cy, marker }: { cx: number; cy: number; marker: MomentumMarker }) {
  const icon = marker.type === 'goal' ? '⚽' : '🟥';
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={12}>
      {icon}
    </text>
  );
}

interface MomentumChartProps {
  fixtureId: number;
  isLive: boolean;
  currentMinute?: number | null;
  homeTeam: string;
  awayTeam: string;
}

export function MomentumChart({ fixtureId, isLive, currentMinute, homeTeam, awayTeam }: MomentumChartProps) {
  const [data, setData] = useState<MatchMomentum | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      matchApi.momentum(fixtureId, isLive)
        .then(({ data: body }) => {
          if (cancelled) return;
          const momentum = body as MatchMomentum;
          setData(momentum);
          setFailed(false);
        })
        .catch((err) => {
          if (cancelled) return;
          logger.error('Failed to load match momentum', err, { fixtureId });
          setFailed(true);
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    // No explicit setLoading(true) here — `loading` already starts true (see
    // useState below), and an effect must not call setState synchronously in
    // its own body. A fixture change resets it via the `key={fixtureId}` the
    // parent page mounts this component with, which remounts it (and its
    // state) cleanly rather than needing to reset state imperatively.
    load();

    if (!isLive) return () => { cancelled = true; };

    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fixtureId, isLive]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <ErrorState title="Momentum unavailable" detail="We couldn't load the event timeline for this match." />
      </div>
    );
  }

  if (!data || data.windows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState title="No momentum yet" description="Momentum builds from goals and cards as the match is played." />
      </div>
    );
  }

  const rows = buildRows(data.windows);
  const lastMinute = rows[rows.length - 1]?.minute ?? 90;
  const showHalftimeLine = lastMinute >= 45;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Match Momentum</h3>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: HOME_COLOR }} />
            <span className="text-muted-foreground truncate max-w-[80px]">{homeTeam}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: AWAY_COLOR }} />
            <span className="text-muted-foreground truncate max-w-[80px]">{awayTeam}</span>
          </span>
        </div>
      </div>

      {/* Horizontal scroll on narrow screens rather than squashing the axis
          unreadably small. */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: Math.max(320, rows.length * 8) }}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={rows} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
              <XAxis
                dataKey="minute"
                tick={{ fontSize: 9, fill: AXIS, fontFamily: 'var(--font-mono)' }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
                interval="preserveStartEnd"
                tickFormatter={(v) => `${v}'`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
              <ReferenceLine y={0} stroke={GRID} />

              {showHalftimeLine && (
                <ReferenceLine
                  x={44}
                  stroke={AXIS}
                  strokeDasharray="3 3"
                  label={{ value: '⏸ HT', position: 'top', fontSize: 9, fill: AXIS }}
                />
              )}

              {isLive && currentMinute != null && (
                <ReferenceLine
                  x={currentMinute}
                  stroke="hsl(var(--down))"
                  strokeWidth={1.5}
                  label={{ value: 'NOW', position: 'top', fontSize: 9, fill: 'hsl(var(--down))' }}
                />
              )}

              <Bar dataKey="net" isAnimationActive={false} maxBarSize={6}>
                {rows.map((row) => (
                  <Cell key={row.minute} fill={row.net >= 0 ? HOME_COLOR : AWAY_COLOR} fillOpacity={row.net === 0 ? 0.15 : 0.85} />
                ))}
              </Bar>

              {data.markers.map((marker) => (
                <ReferenceDot
                  key={`${marker.type}-${marker.minute}-${marker.player ?? ''}`}
                  x={marker.minute}
                  y={markerY(marker)}
                  r={0}
                  shape={(props: { cx: number; cy: number }) => (
                    <MarkerIcon cx={props.cx} cy={props.cy} marker={marker} />
                  )}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
