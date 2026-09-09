'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSmartPicksToday } from '@/lib/api';
import { MOCK_SMART_PICKS } from '@/lib/mockData';
import { SmartPickCard } from './SmartPickCard';
import type { SmartPick } from '@/types';

export function SmartPicksSection({ limit = 6, compact = false, title = "🎯 Smart Picks — Today's Best Matches" }: { limit?: number; compact?: boolean; title?: string }) {
 const [picks, setPicks] = useState<SmartPick[]>([]); const [loading, setLoading] = useState(true);
 useEffect(() => { getSmartPicksToday({ min_odds: 1.2, max_odds: 1.6, limit }).then(({ data }) => { const rows = data?.data ?? data; setPicks(Array.isArray(rows) && rows.length ? rows : MOCK_SMART_PICKS.slice(0, limit)); }).catch(() => setPicks(MOCK_SMART_PICKS.slice(0, limit))).finally(() => setLoading(false)); }, [limit]);
 return <section className="space-y-4"><div className="flex items-end justify-between"><div><h2 className="text-xl font-black">{title}</h2><p className="text-sm text-slate-400">Automatically selected by our AI based on form, standings, odds and 18 market analysis</p></div><Link href="/smart-picks" className="text-xs text-emerald-400">View all →</Link></div>{loading ? <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map((x)=><div key={x} className="h-64 animate-pulse rounded-xl bg-slate-900"/>)}</div> : <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3">{picks.map((pick, i)=><SmartPickCard key={pick.fixture_id} pick={pick} index={i} compact={compact}/>)}</div>}</section>;
}
