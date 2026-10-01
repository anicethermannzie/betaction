'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, RefreshCw, Shield, Table2 } from 'lucide-react';
import { matchApi, predictionApi } from '@/lib/api';
import { getTodayString, formatTime, isMatchLive, isMatchFinished, getMatchStatusLabel } from '@/lib/utils';
import { POPULAR_LEAGUES, type ApiFixture, type Prediction, type Standing } from '@/types';
import { LeagueLogo } from '@/components/leagues/LeagueLogo';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/common/StateMessage';
import { logger } from '@/lib/logger';

const CURRENT_SEASON = new Date().getFullYear();

function Crest({ src, name }: { src?: string; name: string }) {
  return src ? <Image src={src} alt="" width={28} height={28} className="h-7 w-7 object-contain" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground">{name.slice(0, 2).toUpperCase()}</span>;
}

function FixtureRow({ fixture, prediction }: { fixture: ApiFixture; prediction?: Prediction }) {
  const live = isMatchLive(fixture.fixture.status.short);
  const finished = isMatchFinished(fixture.fixture.status.short);
  const hasScore = fixture.goals.home !== null && fixture.goals.away !== null;
  return <Link href={`/predictions/${fixture.fixture.id}`} className="group grid gap-3 border-t border-border/70 px-4 py-4 transition-colors hover:bg-muted/20 sm:grid-cols-[96px_1fr_140px_auto] sm:items-center">
    <div className="flex items-center gap-2 text-xs"><span className={live ? 'h-1.5 w-1.5 rounded-full bg-down' : 'h-1.5 w-1.5 rounded-full bg-border'} /> <span className={live ? 'text-down' : 'num text-muted-foreground'}>{live ? getMatchStatusLabel(fixture.fixture.status.short, fixture.fixture.status.elapsed) : finished ? 'FT' : formatTime(fixture.fixture.date)}</span></div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="flex min-w-0 items-center gap-2"><Crest src={fixture.teams.home.logo} name={fixture.teams.home.name} /><span className="truncate text-sm font-medium">{fixture.teams.home.name}</span></div><span className="num text-xs text-muted-foreground">{hasScore ? `${fixture.goals.home}–${fixture.goals.away}` : 'vs'}</span><div className="flex min-w-0 items-center justify-end gap-2"><span className="truncate text-right text-sm font-medium">{fixture.teams.away.name}</span><Crest src={fixture.teams.away.logo} name={fixture.teams.away.name} /></div></div>
    {prediction ? <div className="num text-xs text-primary sm:text-right">{Math.round(Math.max(prediction.home_win, prediction.draw, prediction.away_win) * 100)}% signal</div> : <span className="text-xs text-muted-foreground sm:text-right">View fixture</span>}
    <ArrowUpRight className="hidden h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
  </Link>;
}

export default function LeaguePage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const id = Number(leagueId);
  const league = POPULAR_LEAGUES.find((item) => item.id === id);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [predictions, setPredictions] = useState<Map<number, Prediction>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'standings' | 'fixtures' | null>(null);
  const [retry, setRetry] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [standingsResult, fixturesResult, predictionResult] = await Promise.allSettled([
      matchApi.standings(id, CURRENT_SEASON), matchApi.byDate(getTodayString()), predictionApi.today(),
    ]);
    if (standingsResult.status === 'fulfilled') {
      const response = (standingsResult.value.data as { response?: { league?: { standings?: Standing[][] } }[] }).response;
      setStandings(response?.[0]?.league?.standings?.[0] ?? []);
    } else { setStandings([]); setError('standings'); logger.error('Failed to load league standings', standingsResult.reason, { leagueId: id }); }
    if (fixturesResult.status === 'fulfilled') {
      const data = fixturesResult.value.data as { response?: ApiFixture[]; club?: ApiFixture[]; international?: ApiFixture[] };
      const all = Array.isArray(data.response) ? data.response : [...(data.club ?? []), ...(data.international ?? [])];
      setFixtures(all.filter((fixture) => fixture.league.id === id));
    } else { setFixtures([]); setError((current) => current ?? 'fixtures'); logger.error('Failed to load league fixtures', fixturesResult.reason, { leagueId: id }); }
    if (predictionResult.status === 'fulfilled') {
      const payload = predictionResult.value.data as { predictions?: Prediction[]; response?: Prediction[] };
      const values = payload.predictions ?? payload.response ?? [];
      setPredictions(new Map(values.map((prediction) => [prediction.fixture_id, prediction])));
    } else setPredictions(new Map());
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load, retry]);
  const analyzedCount = useMemo(() => fixtures.filter((fixture) => predictions.has(fixture.fixture.id)).length, [fixtures, predictions]);

  return <main className="min-h-screen bg-background"><div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
    <header className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><LeagueLogo src={league?.logo ?? ''} fallback={league?.flag ?? '?'} country={league?.country ?? 'Competition'} /><div><p className="label text-primary">League intelligence</p><h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">{league?.name ?? `League ${id}`}</h1><p className="mt-1 text-sm text-muted-foreground">{league?.country ?? 'Competition'} <span className="mx-1 text-border">·</span> {CURRENT_SEASON}/{String(CURRENT_SEASON + 1).slice(-2)}</p></div></div><div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border"><div className="bg-background px-4 py-3"><span className="label">Today&apos;s fixtures</span><div className="num mt-1 text-lg font-semibold">{loading ? '—' : fixtures.length}</div></div><div className="bg-background px-4 py-3"><span className="label">Analysis ready</span><div className="num mt-1 text-lg font-semibold text-primary">{loading ? '—' : analyzedCount}</div></div></div></div></header>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-4"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><div><h2 className="font-display text-lg font-semibold">Today&apos;s fixtures</h2><p className="label mt-0.5">Match context and model availability</p></div></div><span className="num text-xs text-muted-foreground">{getTodayString()}</span></div>{loading ? <div className="space-y-3 p-4">{[1,2,3].map((item) => <LoadingSkeleton key={item} variant="match" />)}</div> : error === 'fixtures' ? <div className="p-5"><ErrorState title="Fixtures unavailable" detail="The competition feed could not be reached. Try again when the provider is available." onRetry={() => setRetry((value) => value + 1)} /></div> : fixtures.length === 0 ? <EmptyState title="No fixtures today" description="There are no fixtures for this competition on the selected date." /> : <div>{fixtures.map((fixture) => <FixtureRow key={fixture.fixture.id} fixture={fixture} prediction={predictions.get(fixture.fixture.id)} />)}</div>}</section>
      <section className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex items-center gap-2 border-b border-border px-4 py-4"><Table2 className="h-4 w-4 text-primary" /><div><h2 className="font-display text-lg font-semibold">Standings</h2><p className="label mt-0.5">Current competition table</p></div></div>{loading ? <div className="space-y-2 p-4">{[1,2,3,4,5].map((item) => <LoadingSkeleton key={item} variant="card" />)}</div> : error === 'standings' ? <div className="p-5"><ErrorState title="Standings unavailable" detail="We could not reach the standings feed. Your other league data is unaffected." onRetry={() => setRetry((value) => value + 1)} /></div> : standings.length === 0 ? <EmptyState title="No standings published" description="The provider has not returned a table for this season yet." /> : <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-sm"><thead><tr className="border-b border-border text-left label"><th className="px-4 py-3">#</th><th className="px-2 py-3">Team</th><th className="px-2 py-3 text-center">P</th><th className="hidden px-2 py-3 text-center sm:table-cell">W</th><th className="hidden px-2 py-3 text-center sm:table-cell">D</th><th className="hidden px-2 py-3 text-center sm:table-cell">L</th><th className="px-2 py-3 text-center">GD</th><th className="px-4 py-3 text-center">Pts</th></tr></thead><tbody>{standings.map((row) => <tr key={row.team.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20"><td className="num px-4 py-3 text-muted-foreground">{row.rank}</td><td className="px-2 py-3"><div className="flex items-center gap-2"><Crest src={row.team.logo} name={row.team.name} /><span className="max-w-[170px] truncate font-medium">{row.team.name}</span></div></td><td className="num px-2 py-3 text-center text-muted-foreground">{row.all.played}</td><td className="num hidden px-2 py-3 text-center text-muted-foreground sm:table-cell">{row.all.win}</td><td className="num hidden px-2 py-3 text-center text-muted-foreground sm:table-cell">{row.all.draw}</td><td className="num hidden px-2 py-3 text-center text-muted-foreground sm:table-cell">{row.all.lose}</td><td className="num px-2 py-3 text-center text-muted-foreground">{row.goalsDiff > 0 ? '+' : ''}{row.goalsDiff}</td><td className="num px-4 py-3 text-center font-semibold">{row.points}</td></tr>)}</tbody></table></div>}</section>
    </div>
    <div className="mt-5 flex items-center gap-2 rounded-lg border border-border/70 bg-card px-4 py-3 text-xs text-muted-foreground"><Shield className="h-4 w-4 text-primary" /> Match intelligence appears only when a fixture has a current model response. <button type="button" onClick={() => setRetry((value) => value + 1)} className="ml-auto inline-flex items-center gap-1 font-mono uppercase tracking-label text-primary hover:underline"><RefreshCw className="h-3 w-3" /> Refresh</button></div>
  </div></main>;
}


