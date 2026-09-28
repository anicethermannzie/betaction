'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { predictionApi } from '@/lib/api';
import { cn, formatProbability } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { EmptyState, ErrorState } from '@/components/common/StateMessage';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { AlgorithmBreakdown } from '@/components/predictions/AlgorithmBreakdown';
import type { DeepAnalysisData, DeepAnalysisResponse, Prediction } from '@/types';

/**
 * AI Insights tab.
 *
 * The analysis itself is built by prediction-service's DeepAnalysisService —
 * this panel is a dedicated, prominent home for output that previously had
 * none. Entitlement is enforced server-side (services/entitlements.py::
 * limit_deep_analysis): a free response's gated sections arrive as `{}`, not
 * hidden client-side from a full payload — this component renders exactly
 * what it receives and shows an upgrade prompt where a VIP-only section came
 * back empty. It never decides who sees what.
 */

const DISCLAIMER_FALLBACK =
  'No result is ever guaranteed. This is statistical analysis for informational purposes only.';

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="label text-muted-foreground">Confidence</span>
        <span className="num text-xs font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function UpgradeLock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-card/50 p-3">
      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface AiInsightsPanelProps {
  fixtureId: number;
  /** For "How We Got Here" — reuses AlgorithmBreakdown, which already
   * self-gates on prediction.factors being null for free plans. */
  prediction: Prediction | null;
}

export function AiInsightsPanel({ fixtureId, prediction }: AiInsightsPanelProps) {
  const [response, setResponse] = useState<DeepAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // No synchronous setLoading(true)/setFailed(false) here — the parent
    // mounts this with key={fixtureId}, so a match change remounts (and
    // resets) it cleanly; see MomentumChart.tsx's comment on the same pattern.

    predictionApi.deepAnalysis(fixtureId)
      .then(({ data }) => { if (!cancelled) setResponse(data as DeepAnalysisResponse); })
      .catch((err) => {
        if (cancelled) return;
        logger.error('Failed to load deep analysis', err, { fixtureId });
        setFailed(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [fixtureId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (failed) {
    return <ErrorState title="AI Insights unavailable" detail="We couldn't load the analysis for this match. Please try again shortly." />;
  }

  if (!response) {
    return <EmptyState icon={Sparkles} title="No insights available" description="Our model needs enough recent data for both teams before it can analyze this match." />;
  }

  const data: DeepAnalysisData = response.data;
  const rec = data.final_recommendation;
  const isVip = response.plan === 'vip';
  const hasMarketsTable = (data.smart_filter.all_markets?.length ?? 0) > 0;
  const hasTopVsBottom = data.top_vs_bottom.is_top_vs_bottom === true;

  return (
    <div className="space-y-4">
      {/* 🎯 Smart Recommendation */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" /> Smart Recommendation
        </h3>

        {rec.market ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground capitalize">{rec.market.replace(/_/g, ' ')}</span>
              {rec.odds !== undefined && rec.odds > 0 && (
                <span className="num text-sm font-bold text-primary">{rec.odds.toFixed(2)}</span>
              )}
            </div>
            <ConfidenceBar value={rec.confidence} />
            {rec.reasoning ? (
              <p className="text-xs text-muted-foreground leading-relaxed">{rec.reasoning}</p>
            ) : !isVip ? (
              <UpgradeLock label="Upgrade to VIP to see the reasoning behind this pick." />
            ) : null}
            {rec.warning && (
              <p className="text-xs text-hold">{rec.warning}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No standout market for this match today.</p>
        )}
      </section>

      {/* ⚠️ Odds Alert */}
      {data.odds_analysis.anomaly_detected && (
        <section className="flex items-start gap-2.5 rounded-lg border border-amber-900/40 bg-amber-500/10 p-3.5">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-200">Odds Alert</p>
            {data.odds_analysis.anomaly_reasons?.length ? (
              <ul className="text-xs text-amber-200/80 space-y-0.5">
                {data.odds_analysis.anomaly_reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            ) : !isVip ? (
              <p className="text-xs text-amber-200/80">Upgrade to VIP to see why this match was flagged.</p>
            ) : null}
          </div>
        </section>
      )}

      {/* 📈 Top vs Bottom Context */}
      {hasTopVsBottom && (
        <section className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm font-bold text-foreground">Top vs Bottom Context</h3>
          <p className="text-xs text-muted-foreground">
            {data.top_vs_bottom.top_team === 'home' ? 'Home' : 'Away'} side (pos. {data.top_vs_bottom.top_position})
            {' '}faces a bottom-table opponent (pos. {data.top_vs_bottom.bottom_position}) — a {data.top_vs_bottom.position_gap}-place gap.
          </p>
          {data.top_vs_bottom.alert_message && (
            <p className="text-xs text-hold">{data.top_vs_bottom.alert_message}</p>
          )}
          {data.top_vs_bottom.recommended_markets && data.top_vs_bottom.recommended_markets.length > 0 && (
            <ul className="text-xs text-foreground/85 space-y-1 pt-1">
              {data.top_vs_bottom.recommended_markets.map((m) => (
                <li key={m.selection} className="flex items-start gap-1.5">
                  <span className="text-primary shrink-0">·</span>
                  <span><strong className="font-semibold">{m.selection}</strong> — {m.reasoning}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 📊 All 18 Markets */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" /> All Markets
        </h3>
        {hasMarketsTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-1.5 pr-2 font-medium">Market</th>
                  <th className="py-1.5 px-2 font-medium text-right">Odds</th>
                  <th className="py-1.5 pl-2 font-medium text-right">In range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.smart_filter.all_markets!.map((m) => (
                  <tr key={m.market}>
                    <td className="py-1.5 pr-2 text-foreground/85">{m.label}</td>
                    <td className="py-1.5 px-2 text-right num text-foreground">{m.odds > 0 ? m.odds.toFixed(2) : '—'}</td>
                    <td className={cn('py-1.5 pl-2 text-right', m.in_target_range ? 'text-primary' : 'text-muted-foreground/50')}>
                      {m.in_target_range ? '✓' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <UpgradeLock label="Upgrade to VIP to see the full side-by-side market comparison." />
        )}
      </section>

      {/* 🧠 How We Got Here — reuses AlgorithmBreakdown, which already shows its
          own VIP lock when prediction.factors is null. */}
      {prediction && (
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">How We Got Here</h3>
          <AlgorithmBreakdown prediction={prediction} />
          {prediction.confidence && (
            <p className="text-[11px] text-muted-foreground">
              Model confidence: {prediction.confidence} · {formatProbability(Math.max(prediction.home_win, prediction.draw, prediction.away_win))} on the favoured outcome.
            </p>
          )}
        </section>
      )}

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        {response.disclaimer || DISCLAIMER_FALLBACK}
      </p>
    </div>
  );
}
