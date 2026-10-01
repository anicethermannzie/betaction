'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight, BarChart3, Brain, RefreshCw, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { predictionApi } from '@/lib/api';
import { PredictionBadge } from '@/components/predictions/PredictionBadge';
import { ConfidenceMeter } from '@/components/predictions/ConfidenceMeter';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/common/StateMessage';
import { formatProbability } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { Prediction } from '@/types';

function ProbabilityBar({ prediction }: { prediction: Prediction }) {
  return <div className="space-y-1.5"><div className="flex h-1.5 overflow-hidden bg-muted" role="img" aria-label={`${Math.round(prediction.home_win * 100)} percent home, ${Math.round(prediction.draw * 100)} percent draw, ${Math.round(prediction.away_win * 100)} percent away`}><span className="bg-primary" style={{ width: `${prediction.home_win * 100}%` }} /><span className="bg-hold" style={{ width: `${prediction.draw * 100}%` }} /><span className="bg-down" style={{ width: `${prediction.away_win * 100}%` }} /></div><div className="flex justify-between num text-[10px]"><span className="text-primary">{formatProbability(prediction.home_win)}</span><span className="text-muted-foreground">X {formatProbability(prediction.draw)}</span><span className="text-down">{formatProbability(prediction.away_win)}</span></div></div>;
}

function PredictionRow({ prediction }: { prediction: Prediction }) {
  const pickProbability = prediction.prediction === 'HOME_WIN' ? prediction.home_win : prediction.prediction === 'AWAY_WIN' ? prediction.away_win : prediction.draw;
  return <Link href={`/predictions/${prediction.fixture_id}`} className="group block border-b border-border last:border-0"><article className="grid gap-4 px-4 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(210px,1.2fr)_minmax(180px,1fr)_150px_130px] md:items-center md:gap-6"><div className="min-w-0"><div className="label">Prediction · fixture {prediction.fixture_id}</div><h2 className="mt-1 truncate font-display text-base font-semibold">{prediction.home_team} <span className="text-muted-foreground">v</span> {prediction.away_team}</h2><div className="mt-2 flex items-center gap-2 label"><span className="h-1.5 w-1.5 bg-primary" /> Today&apos;s model board</div></div><div><ProbabilityBar prediction={prediction} /></div><div><PredictionBadge prediction={prediction.prediction} homeTeam={prediction.home_team} awayTeam={prediction.away_team} /><div className="mt-2 num text-xs text-foreground">{formatProbability(pickProbability)} signal</div></div><div className="flex items-center justify-between gap-3 md:block md:text-right"><ConfidenceMeter confidence={prediction.confidence} /><ArrowUpRight className="mt-2 ml-auto hidden h-4 w-4 text-primary group-hover:block" aria-hidden="true" /></div></article></Link>;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [confidence, setConfidence] = useState<'all' | Prediction['confidence']>('all');
  const [query, setQuery] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => { setLoading(true); setHasError(false); setReloadToken((n) => n + 1); }, []);

  useEffect(() => {
    let cancelled = false;
    void predictionApi.today().then(({ data }) => { if (cancelled) return; const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []; setPredictions(list as Prediction[]); }).catch((err) => { if (cancelled) return; logger.error("Failed to load today's predictions", err); setPredictions([]); setHasError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadToken]);

  const filtered = useMemo(() => predictions.filter((p) => (confidence === 'all' || p.confidence === confidence) && (!query.trim() || `${p.home_team} ${p.away_team}`.toLowerCase().includes(query.trim().toLowerCase()))), [predictions, confidence, query]);

  return <div className="min-h-screen bg-background"><div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="flex items-center gap-2 label text-primary"><Activity className="h-3.5 w-3.5" aria-hidden="true" /> MatchWise intelligence</div><h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">Predictions</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Today&apos;s model output, confidence signals, and a direct route into deeper match analysis.</p></div><div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card"><div className="px-4 py-2"><span className="label">Published</span><div className="num mt-1 text-lg font-semibold">{loading ? '—' : predictions.length}</div></div><div className="px-4 py-2"><span className="label">Shown</span><div className="num mt-1 text-lg font-semibold text-primary">{loading ? '—' : filtered.length}</div></div><div className="px-4 py-2"><span className="label">Markets</span><div className="num mt-1 text-lg font-semibold">18</div></div></div></div>
    <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3"><div className="bg-card p-4"><div className="flex items-center gap-2 text-primary"><Brain className="h-4 w-4" aria-hidden="true" /><span className="label text-foreground">Model read</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">A probability-led view of the fixture. The selected outcome is always shown with its confidence band.</p></div><div className="bg-card p-4"><div className="flex items-center gap-2 text-primary"><BarChart3 className="h-4 w-4" aria-hidden="true" /><span className="label text-foreground">Market discovery</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Open any prediction to explore the supported market analysis available for that match.</p></div><div className="bg-card p-4"><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" aria-hidden="true" /><span className="label text-foreground">Access clarity</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Free and VIP analysis stays clearly separated inside the detailed match experience.</p></div></div>
    <div className="sticky top-14 z-30 mt-6 border-y border-border bg-background/95 py-3 backdrop-blur-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2" role="tablist" aria-label="Confidence filter">{(['all', 'high', 'medium', 'low'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={confidence === value} onClick={() => setConfidence(value)} className={`rounded border px-3 py-2 text-xs font-semibold uppercase tracking-label transition-colors ${confidence === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>{value === 'all' ? 'All confidence' : `${value} confidence`}</button>)}</div><label className="relative block w-full lg:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><span className="sr-only">Search prediction teams</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search teams" className="h-10 w-full rounded border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" /></label></div></div>
    {loading ? <div className="mt-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} variant="card" />)}</div> : hasError ? <div className="mt-5"><ErrorState title="Predictions are unavailable" detail="We couldn&apos;t reach the prediction service. The provider quota may be exhausted; no substitute data is shown." onRetry={retry} /></div> : <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">{filtered.map((prediction) => <PredictionRow key={prediction.fixture_id} prediction={prediction} />)}{filtered.length === 0 && <EmptyState title={predictions.length === 0 ? 'No predictions published yet' : 'No predictions match this filter'} description={predictions.length === 0 ? 'Predictions appear when today&apos;s fixtures have enough data. Check back shortly.' : 'Try another confidence level or team search.'} />}</div>}
    <div className="mt-5 flex items-center gap-2 label"><Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Open a fixture for model factors, form, H2H, and supported market detail.</div><div className="mt-3 flex items-center gap-2 label text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> No prediction is guaranteed.</div>
  </div></div>;
}

