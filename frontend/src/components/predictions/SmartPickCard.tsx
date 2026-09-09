'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Lock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FREE_FEATURES, VIP_FEATURES, useSubscriptionStore } from '@/stores/subscriptionStore';
import type { SmartPick } from '@/types';

const marketLabel = (value: string) => value.replaceAll('_', ' ').toUpperCase();
export function SmartPickCard({ pick, index = 0, compact = false }: { pick: SmartPick; index?: number; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false); const plan = useSubscriptionStore((s) => s.plan); const features = plan === 'vip' ? VIP_FEATURES : FREE_FEATURES;
  const locked = index >= features.smart_picks_per_day; const a = pick.smart_analysis; const favorite = a.favorite === 'home' ? pick.home_team : pick.away_team;
  const color = a.confidence_score > 70 ? 'bg-emerald-500' : a.confidence_score > 40 ? 'bg-amber-500' : 'bg-red-500';
  return <article className="relative min-w-[290px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition hover:-translate-y-0.5 hover:border-emerald-500/50">
    {locked && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950/75 backdrop-blur-sm"><Lock className="text-amber-400"/><b>Upgrade for more Smart Picks</b></div>}
    {pick.top_vs_bottom?.has_odds_anomaly && <div className="bg-amber-500/15 px-4 py-2 text-xs text-amber-300">⚠️ Odds Alert: {pick.top_vs_bottom.alert_message}</div>}
    <div className="p-4"><div className="flex justify-between text-xs text-slate-400"><span>{pick.league_flag} {pick.league}</span><span className="text-emerald-400">⚡ SMART PICK</span></div><p className="mt-2 text-center text-xs text-slate-500">{new Date(pick.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><Link href={`/predictions/${pick.fixture_id}`} className="mt-1 block text-center text-lg font-black hover:text-emerald-400">{pick.home_team} <span className="text-slate-500">vs</span> {pick.away_team}</Link><div className="mt-3 flex justify-center gap-3 text-xs text-slate-400"><span>📍 Favorite: {favorite}</span><span>🔥 {a.consecutive_wins}W streak</span></div></div>
    <div className="border-y border-slate-800 bg-slate-900/60 p-4 text-center"><p className="text-[10px] uppercase tracking-widest text-slate-500">Recommended Market</p><p className="mt-1 text-xl font-black">{marketLabel(a.recommended_market)}</p><p className="text-2xl font-black text-emerald-400">@ {a.recommended_market_odds.toFixed(2)}</p>{features.smart_picks_confidence_score ? <><div className="mt-3 h-1.5 overflow-hidden rounded bg-slate-800"><div className={cn('h-full', color)} style={{ width: `${a.confidence_score}%` }}/></div><p className="mt-1 text-xs">{a.confidence_score}% Confidence</p></> : <p className="mt-2 text-xs text-slate-500">🔒 Confidence score: VIP</p>}</div>
    {!compact && <div className="p-4">{features.smart_picks_show_all_markets ? <><button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between text-xs font-bold"><span>📊 All Markets</span><ChevronDown className={cn('h-4 w-4 transition', expanded && 'rotate-180')}/></button>{expanded && <div className="mt-3 space-y-1">{a.all_markets.map((m) => <div key={m.market} className={cn('grid grid-cols-[1fr_auto_auto] gap-3 rounded px-2 py-1 text-xs', m.in_target_range && 'bg-emerald-500/10')}><span>{m.label}</span><b>{m.odds ? m.odds.toFixed(2) : '—'}</b><span>{m.in_target_range ? '✅' : '⬜'}</span></div>)}</div>}</> : <p className="text-xs text-slate-500"><Lock className="mr-1 inline h-3 w-3"/> See all 7 markets (VIP)</p>}{features.smart_picks_show_reasoning ? <p className="mt-3 text-xs italic text-slate-400">{a.reasoning}</p> : <p className="mt-3 text-xs text-slate-500">🔒 Upgrade to see full analysis</p>}<p className="mt-3 text-[10px] text-slate-600">Statistical analysis only. No result guaranteed.</p></div>}
  </article>;
}
