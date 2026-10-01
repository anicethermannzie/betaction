'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Check, Clock3, Copy, ExternalLink, Lock, Share2, Sparkles, Trophy, Users } from 'lucide-react';
import { cn, formatMatchDate, formatTime, isMatchFinished, isMatchLive } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PredictionChart } from '@/components/predictions/PredictionChart';
import { PredictionBadge } from '@/components/predictions/PredictionBadge';
import { ConfidenceMeter } from '@/components/predictions/ConfidenceMeter';
import { AlgorithmBreakdown } from '@/components/predictions/AlgorithmBreakdown';
import { H2HDisplay } from '@/components/predictions/H2HDisplay';
import { OddsComparison } from '@/components/predictions/OddsComparison';
import { MarketAccordion } from '@/components/match/MarketAccordion';
import { LiveOddsBar } from '@/components/match/LiveOddsBar';
import { MomentumChart } from '@/components/match/MomentumChart';
import { MatchTimeline } from '@/components/match/MatchTimeline';
import { AiInsightsPanel } from '@/components/match/AiInsightsPanel';
import { EmptyState, ErrorState } from '@/components/common/StateMessage';
import { LiveBadge } from '@/components/matches/LiveBadge';
import type { ApiFixture, H2HMatch, MatchOdds, Prediction } from '@/types';
import type { Market } from '@/lib/markets';

type Tab = 'overview' | 'live' | 'insights' | 'lineups';

interface Props {
  fixture: ApiFixture;
  prediction: Prediction | null;
  markets: Market[];
  h2h: H2HMatch[];
  odds: MatchOdds | null;
  fixtureId: number;
  copied: boolean;
  decimalMode: boolean;
  tab: Tab;
  onShare: () => void;
  onDecimalMode: (value: boolean) => void;
  onTab: (value: Tab) => void;
  isSelected: (market: string, selection: string) => boolean;
  onSelect: (market: string, selection: string, odds: number) => void;
}

const marketGroups = [
  { id: 'SGP', label: 'Core signals', hint: 'Result, chance and scoring outlook' },
  { id: 'Totals', label: 'Goals and corners', hint: 'Volume and team totals' },
  { id: 'Halftime', label: 'Time splits', hint: 'First-half and full-time combinations' },
  { id: 'Spreads', label: 'Handicap', hint: 'Margin-based model outputs' },
  { id: 'Correct Score', label: 'Correct score', hint: 'Scoreline probability grid' },
  { id: 'All', label: 'Additional signals', hint: 'Clean sheet, comeback and lead data' },
] as const;

export function PredictionWorkspace({ fixture, prediction, markets, h2h, odds, fixtureId, copied, decimalMode, tab, onShare, onDecimalMode, onTab, isSelected, onSelect }: Props) {
  const live = isMatchLive(fixture.fixture.status.short);
  const finished = isMatchFinished(fixture.fixture.status.short);
  const hasScore = fixture.goals.home !== null && fixture.goals.away !== null;
  const grouped = marketGroups.map((group) => ({ ...group, markets: markets.filter((market) => market.category === group.id || (group.id === 'All' && market.category === 'All')) })).filter((group) => group.markets.length > 0);
  const modelLabel = prediction?.prediction === 'HOME_WIN' ? fixture.teams.home.name : prediction?.prediction === 'AWAY_WIN' ? fixture.teams.away.name : prediction ? 'Draw' : 'Awaiting model read';

  return (
    <div className="min-h-screen bg-[#07100e] text-[#edf5f0]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07100e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/matches" aria-label="Back to matches" className="rounded-md p-2 text-white/55 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d084]"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">{fixture.league.country} / {fixture.league.name}</p>
              <p className="mt-0.5 truncate text-xs text-white/45">{formatMatchDate(fixture.fixture.date)} · {formatTime(fixture.fixture.date)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onShare} className="h-9 shrink-0 gap-2 border-white/15 bg-transparent text-xs text-white/75 hover:bg-white/10 hover:text-white">{copied ? <Check className="h-3.5 w-3.5 text-[#00d084]" /> : <Share2 className="h-3.5 w-3.5" />} {copied ? 'Link copied' : 'Share'}</Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 pb-24 pt-6 lg:px-8 lg:pt-8">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1714] shadow-2xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3 text-xs text-white/50 lg:px-7">
            <span className="inline-flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-[#00d084]" /> Match intelligence</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">Fixture {fixtureId}</span>
          </div>
          <div className="grid items-center gap-6 px-5 py-7 sm:grid-cols-[1fr_auto_1fr] lg:px-12 lg:py-9">
            <Team name={fixture.teams.home.name} logo={fixture.teams.home.logo} align="left" />
            <div className="text-center">
              {live ? <><LiveBadge elapsed={fixture.fixture.status.elapsed} />{hasScore && <p className="mt-2 font-mono text-3xl font-bold tracking-tight">{fixture.goals.home} <span className="text-white/30">:</span> {fixture.goals.away}</p>}</> : finished ? <><span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Full time</span><p className="mt-2 font-mono text-2xl font-bold">{fixture.goals.home} <span className="text-white/30">:</span> {fixture.goals.away}</p></> : <><Clock3 className="mx-auto h-4 w-4 text-[#00d084]" /><p className="mt-1 font-mono text-lg font-semibold">{formatTime(fixture.fixture.date)}</p><p className="text-[11px] text-white/45">{formatMatchDate(fixture.fixture.date)}</p></>}
            </div>
            <Team name={fixture.teams.away.name} logo={fixture.teams.away.logo} align="right" />
          </div>
        </section>

        <nav aria-label="Match analysis sections" className="mt-5 flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
          {([['overview', 'Model read'], ['live', 'Live context'], ['insights', 'Deep analysis'], ['lineups', 'Lineups']] as const).map(([key, label]) => <button key={key} onClick={() => onTab(key)} className={cn('whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition', tab === key ? 'border-[#00d084] text-white' : 'border-transparent text-white/45 hover:text-white')} aria-current={tab === key ? 'page' : undefined}>{label}</button>)}
        </nav>

        {tab === 'overview' && <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#00d084]/30 bg-[#0c1d18] p-5 lg:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">Model read</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{modelLabel}</h1><p className="mt-1 text-sm text-white/50">Primary outcome from the MatchWise model</p></div>{prediction && <PredictionBadge prediction={prediction.prediction} homeTeam={prediction.home_team} awayTeam={prediction.away_team} className="border border-[#00d084]/30 bg-[#00d084]/10 px-3 py-1.5 text-xs" />}</div>
              {prediction ? <><div className="mt-7 rounded-xl border border-white/10 bg-[#07100e]/70 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Model probabilities</span><span className="font-mono text-[10px] text-white/35">{prediction.generated_at ? new Date(prediction.generated_at).toLocaleDateString() : 'Latest model run'}</span></div><PredictionChart prediction={prediction} /></div><div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr]"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><ConfidenceMeter confidence={prediction.confidence} /></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Signal</p><p className="mt-2 text-lg font-semibold text-[#00d084]">{prediction.confidence} confidence</p><p className="mt-1 text-xs leading-relaxed text-white/50">Probability is model output, not a guarantee or bookmaker quote.</p></div></div></> : <EmptyState icon={BarChart3} title="Prediction unavailable" description="The model does not have enough verified data to price this fixture yet." />}
            </section>

            {prediction && <section className="rounded-2xl border border-white/10 bg-[#0b1714] p-5 lg:p-7"><div className="mb-5"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">Why MatchWise thinks this</p><h2 className="mt-2 text-xl font-semibold">Supporting evidence</h2></div><AlgorithmBreakdown prediction={prediction} /></section>}

            <section className="rounded-2xl border border-white/10 bg-[#0b1714] p-5 lg:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">Market intelligence</p><h2 className="mt-2 text-xl font-semibold">Model-priced markets</h2><p className="mt-1 text-sm text-white/45">Only markets returned by the current model are shown.</p></div><div className="flex rounded-lg border border-white/10 p-1 text-xs"><button onClick={() => onDecimalMode(false)} className={cn('rounded-md px-3 py-1.5', !decimalMode ? 'bg-[#00d084] text-[#03100b]' : 'text-white/50')}>American</button><button onClick={() => onDecimalMode(true)} className={cn('rounded-md px-3 py-1.5', decimalMode ? 'bg-[#00d084] text-[#03100b]' : 'text-white/50')}>Decimal</button></div></div>{grouped.length > 0 && <div className="mt-6 space-y-3">{grouped.map((group) => <div key={group.id}><div className="mb-2 flex items-center justify-between"><div><h3 className="text-sm font-semibold">{group.label}</h3><p className="text-xs text-white/40">{group.hint}</p></div><span className="font-mono text-[10px] text-white/30">{group.markets.length} market{group.markets.length === 1 ? '' : 's'}</span></div>{group.markets.map((market) => <MarketAccordion key={market.id} title={market.name} sgpBadge={market.sgpBadge}><div className="grid gap-2 sm:grid-cols-2">{market.options.map((option) => <button key={option.name} onClick={() => onSelect(market.name, option.name, option.decimalOdds)} className={cn('flex items-center justify-between rounded-lg border px-3 py-3 text-left transition active:scale-[.99]', isSelected(market.name, option.name) ? 'border-[#00d084] bg-[#00d084]/10' : 'border-white/10 bg-white/[0.03] hover:border-[#00d084]/50')}><span className="min-w-0 truncate text-sm">{option.name}</span><span className="ml-3 shrink-0 font-mono text-sm text-[#00d084]">{decimalMode ? option.decimalOdds.toFixed(2) : option.odds}</span></button>)}</div></MarketAccordion>)}</div>)}</div>} {grouped.length === 0 && <div className="mt-6"><EmptyState icon={BarChart3} title="No markets available" description="Markets appear when the model has enough verified data for both teams." /></div>}</section>
          </div>
          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            {h2h.length > 0 && <section className="rounded-2xl border border-white/10 bg-[#0b1714] p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">Evidence</p><h2 className="mt-2 text-lg font-semibold">Head to head</h2><div className="mt-4"><H2HDisplay homeTeam={fixture.teams.home.name} awayTeam={fixture.teams.away.name} h2h={h2h} /></div></section>}
            {odds && prediction && <section className="rounded-2xl border border-white/10 bg-[#0b1714] p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">Context</p><h2 className="mt-2 text-lg font-semibold">Bookmaker comparison</h2><p className="mt-1 text-xs text-white/40">External market prices are shown separately from model probabilities.</p><div className="mt-4"><OddsComparison odds={odds} prediction={prediction} /></div></section>}
            <section className="rounded-2xl border border-white/10 bg-[#0b1714] p-5"><div className="flex items-center gap-2"><Lock className="h-4 w-4 text-[#00d084]" /><h2 className="text-lg font-semibold">VIP analysis</h2></div><p className="mt-2 text-sm leading-relaxed text-white/50">Unlock the full factor breakdown, deeper reasoning and all model-returned markets when available.</p><Link href="/#pricing" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#00d084] hover:text-white">View access options <ExternalLink className="h-3.5 w-3.5" /></Link></section>
          </aside>
        </div>}

        {tab === 'live' && <div className="mt-6 space-y-5"><LiveOddsBar fixtureId={fixtureId} isLive={live} homeTeam={fixture.teams.home.name} awayTeam={fixture.teams.away.name} onViewAllOdds={() => onTab('overview')} /><MomentumChart fixtureId={fixtureId} isLive={live} currentMinute={fixture.fixture.status.elapsed} homeTeam={fixture.teams.home.name} awayTeam={fixture.teams.away.name} /><MatchTimeline fixtureId={fixtureId} isLive={live} /></div>}
        {tab === 'insights' && <div className="mt-6"><AiInsightsPanel fixtureId={fixtureId} prediction={prediction} /></div>}
        {tab === 'lineups' && <div className="mt-6"><EmptyState icon={Users} title="Lineups coming soon" description="Starting XIs and formations are not available from the current match data feed." /></div>}
      </main>
    </div>
  );
}

function Team({ name, logo, align }: { name: string; logo?: string; align: 'left' | 'right' }) {
  return <div className={cn('flex min-w-0 items-center gap-3', align === 'right' && 'justify-end text-right')}>
    {align === 'left' && logo && <Image src={logo} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />}
    <span className="truncate text-lg font-semibold sm:text-xl">{name}</span>
    {align === 'right' && logo && <Image src={logo} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />}
  </div>;
}





