'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Share2, Clock, Trophy, TrendingUp, BarChart3,
  Users, Activity, Repeat2, Settings, Sparkles, Check
} from 'lucide-react';

import { matchApi, predictionApi }  from '@/lib/api';
import { useLiveScores }            from '@/hooks/useLiveScores';
import { getSocket }                from '@/lib/socket';
import { useBetSlipStore }          from '@/stores/betSlipStore';

import { MarketAccordion }          from '@/components/match/MarketAccordion';
import { MarketTabs }               from '@/components/match/MarketTabs';
import { OddsButton }               from '@/components/match/OddsButton';

import { PredictionChart }     from '@/components/predictions/PredictionChart';
import { PredictionBadge }     from '@/components/predictions/PredictionBadge';
import { ConfidenceMeter }     from '@/components/predictions/ConfidenceMeter';
import { AlgorithmBreakdown }  from '@/components/predictions/AlgorithmBreakdown';
import { FormDisplay }         from '@/components/predictions/FormDisplay';
import { H2HDisplay }          from '@/components/predictions/H2HDisplay';
import { StatsComparison }     from '@/components/predictions/StatsComparison';
import { OddsComparison }      from '@/components/predictions/OddsComparison';
import { LiveBadge }           from '@/components/matches/LiveBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }              from '@/components/ui/button';

import {
  cn, formatTime, formatMatchDate,
  isMatchLive, isMatchHalftime, isMatchFinished,
  getPredictionColors, getInitials,
} from '@/lib/utils';

import {
  MOCK_FIXTURES_BY_DATE, MOCK_PREDICTION_MAP, MOCK_DETAIL, MOCK_PREDICTIONS,
  generateMarketsForMatch,
} from '@/lib/mockData';
import type { Market, MarketOption } from '@/lib/mockData';
import type { ApiFixture, Prediction, LiveScorePayload, MarketCategory } from '@/types';

const COUNTRY_FLAGS: Record<string, string> = {
  'Panama': '🇵🇦',
  'Dominican Republic': '🇩🇴',
  'Dominican Rep.': '🇩🇴',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'USA': '🇺🇸',
  'Mexico': '🇲🇽',
  'Nigeria': '🇳🇬',
  'Ghana': '🇬🇭',
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-5 animate-pulse">
      <div className="h-10 bg-slate-900 rounded-xl" />
      <div className="h-44 rounded-2xl bg-slate-900" />
      <div className="h-12 rounded-xl bg-slate-900" />
      <div className="h-64 rounded-xl bg-slate-900" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PredictionPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router      = useRouter();
  const fixtureId   = parseInt(matchId, 10);

  const [fixture,    setFixture]    = useState<ApiFixture | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [copied,     setCopied]     = useState(false);
  const [activeTab,  setActiveTab]  = useState<MarketCategory>('All');
  const [decimalMode, setDecimalMode] = useState(false);
  const [matchResultTab, setMatchResultTab] = useState<'reg' | '1h' | '2h'>('reg');

  // Zustand Store
  const selections = useBetSlipStore((state) => state.selections);
  const addSelection = useBetSlipStore((state) => state.addSelection);
  const removeSelection = useBetSlipStore((state) => state.removeSelection);

  // ── Fetch fixture + prediction ────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    const allMock = Object.values(MOCK_FIXTURES_BY_DATE).flat();

    Promise.allSettled([
      matchApi.byId(fixtureId),
      predictionApi.forMatch(fixtureId),
    ]).then(([fixRes, predRes]) => {
      if (fixRes.status === 'fulfilled') {
        const d   = fixRes.value.data;
        const res = (d as { response: ApiFixture[] }).response;
        setFixture(res?.[0] ?? null);
      } else {
        setFixture(allMock.find((f) => f.fixture.id === fixtureId) ?? null);
      }

      if (predRes.status === 'fulfilled') {
        const d = predRes.value.data;
        setPrediction((d as { data?: Prediction })?.data ?? (d as Prediction) ?? null);
      } else {
        setPrediction(MOCK_PREDICTION_MAP.get(fixtureId) ?? null);
      }
    }).finally(() => setIsLoading(false));
  }, [fixtureId]);

  // ── Live score updates ────────────────────────────────────────────────────
  useLiveScores(fixtureId);

  useEffect(() => {
    const socket = getSocket();
    const handler = (payload: LiveScorePayload) => {
      if (payload.matchId !== fixtureId) return;
      setFixture((prev) => prev ? {
        ...prev,
        goals: { home: payload.score.home, away: payload.score.away },
        fixture: {
          ...prev.fixture,
          status: { ...prev.fixture.status, elapsed: payload.minute, short: payload.status },
        },
      } : prev);
    };
    socket.on('live:score', handler);
    return () => { socket.off('live:score', handler); };
  }, [fixtureId]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ── Derived Markets & Details ─────────────────────────────────────────────
  const detail  = MOCK_DETAIL[fixtureId] ?? null;
  const similar = MOCK_PREDICTIONS.filter((p) => p.fixture_id !== fixtureId).slice(0, 5);

  const markets = useMemo(() => {
    if (!fixture) return [];
    return generateMarketsForMatch(fixtureId, fixture.teams.home.name, fixture.teams.away.name);
  }, [fixture, fixtureId]);

  const isInternational = useMemo(() => {
    if (!fixture) return false;
    const lid = fixture.league.id;
    return [1, 4, 9, 6, 7, 5, 8, 32, 33, 34, 35, 36, 481, 10].includes(lid) || (fixture as any).competition_type === 'international';
  }, [fixture]);

  const live     = fixture ? isMatchLive(fixture.fixture.status.short) : false;
  const finished = fixture ? isMatchFinished(fixture.fixture.status.short) : false;
  const hasScore = fixture ? (fixture.goals.home !== null && fixture.goals.away !== null) : false;

  // ── Selection helper checks ────────────────────────────────────────────────
  const isSelected = useCallback((marketName: string, selectionName: string) => {
    return selections.some(
      (s) => s.matchId === fixtureId && s.market === marketName && s.selection === selectionName
    );
  }, [selections, fixtureId]);

  const handleSelectionClick = useCallback((marketName: string, selectionName: string, odds: number) => {
    if (!fixture) return;
    const matchName = `${fixture.teams.home.name} vs ${fixture.teams.away.name}`;
    const selectionId = `${fixtureId}:${marketName}`;
    const alreadySelected = selections.find(
      (s) => s.matchId === fixtureId && s.market === marketName
    );

    if (alreadySelected) {
      if (alreadySelected.selection === selectionName) {
        removeSelection(selectionId);
      } else {
        addSelection(fixtureId, matchName, marketName, selectionName, odds);
      }
    } else {
      addSelection(fixtureId, matchName, marketName, selectionName, odds);
    }
  }, [fixture, fixtureId, selections, addSelection, removeSelection]);

  // ── Custom Render Helpers ──────────────────────────────────────────────────

  const renderMatchResultMarket = () => {
    const regMarket = markets.find(m => m.id === 'match_result_1x2');
    const fhMarket = markets.find(m => m.id === 'match_result_1st_half');
    const shMarket = markets.find(m => m.id === 'match_result_2nd_half');

    let activeMarket = regMarket;
    let marketLabel = 'Match Result (1X2)';
    if (matchResultTab === '1h') {
      activeMarket = fhMarket;
      marketLabel = '1st Half Result';
    } else if (matchResultTab === '2h') {
      activeMarket = shMarket;
      marketLabel = '2nd Half Result';
    }

    if (!activeMarket) return null;

    return (
      <div className="space-y-4">
        {/* Sub-tabs */}
        <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMatchResultTab('reg')}
            className={cn(
              "flex-1 py-1.5 text-[11px] font-black uppercase rounded tracking-wider transition-all",
              matchResultTab === 'reg' ? "bg-slate-800 text-emerald-400 font-extrabold shadow-sm border border-slate-700/50" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Regular Time
          </button>
          <button
            type="button"
            onClick={() => setMatchResultTab('1h')}
            className={cn(
              "flex-1 py-1.5 text-[11px] font-black uppercase rounded tracking-wider transition-all",
              matchResultTab === '1h' ? "bg-slate-800 text-emerald-400 font-extrabold shadow-sm border border-slate-700/50" : "text-slate-400 hover:text-slate-200"
            )}
          >
            1st Half
          </button>
          <button
            type="button"
            onClick={() => setMatchResultTab('2h')}
            className={cn(
              "flex-1 py-1.5 text-[11px] font-black uppercase rounded tracking-wider transition-all",
              matchResultTab === '2h' ? "bg-slate-800 text-emerald-400 font-extrabold shadow-sm border border-slate-700/50" : "text-slate-400 hover:text-slate-200"
            )}
          >
            2nd Half
          </button>
        </div>

        {/* Odds Grid */}
        <div className="grid grid-cols-3 gap-2">
          {activeMarket.options.map((opt) => (
            <OddsButton
              key={opt.name}
              label={opt.name}
              odds={opt.decimalOdds}
              decimalMode={decimalMode}
              isSelected={isSelected(marketLabel, opt.name)}
              onClick={() => handleSelectionClick(marketLabel, opt.name, opt.decimalOdds)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderTotalsMarket = (marketId: string, marketName: string, lines: string[]) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return null;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 text-center text-[10px] uppercase font-black tracking-widest text-slate-400 px-2">
          <span>Line</span>
          <span>Over</span>
          <span>Under</span>
        </div>
        <div className="space-y-2">
          {lines.map((line) => {
            const overOpt = market.options.find((o) => o.name === `Over ${line}`);
            const underOpt = market.options.find((o) => o.name === `Under ${line}`);

            return (
              <div key={line} className="grid grid-cols-3 items-center gap-2">
                <span className="text-center font-bold text-sm text-slate-300">{line}</span>
                <div>
                  {overOpt && (
                    <OddsButton
                      label="Over"
                      odds={overOpt.decimalOdds}
                      decimalMode={decimalMode}
                      isSelected={isSelected(marketName, overOpt.name)}
                      onClick={() => handleSelectionClick(marketName, overOpt.name, overOpt.decimalOdds)}
                    />
                  )}
                </div>
                <div>
                  {underOpt && (
                    <OddsButton
                      label="Under"
                      odds={underOpt.decimalOdds}
                      decimalMode={decimalMode}
                      isSelected={isSelected(marketName, underOpt.name)}
                      onClick={() => handleSelectionClick(marketName, underOpt.name, underOpt.decimalOdds)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSpreadsMarket = (marketId: string, marketName: string, homeTeam: string, awayTeam: string, lines: number[]) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return null;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 text-center text-[10px] uppercase font-black tracking-widest text-slate-400 px-2">
          <span>Home</span>
          <span>Tie</span>
          <span>Away</span>
        </div>
        <div className="space-y-2">
          {lines.map((line) => {
            const homeOpt = market.options.find((o) => o.name === `${homeTeam} (-${line})` || o.name === `${homeTeam} (-${line}) 1H`);
            const tieOpt = market.options.find((o) => o.name === `Tie (-${line})` || o.name === `Tie (-${line}) 1H`);
            const awayOpt = market.options.find((o) => o.name === `${awayTeam} (+${line})` || o.name === `${awayTeam} (+${line}) 1H`);

            return (
              <div key={line} className="space-y-1 bg-slate-900/30 p-2 rounded-lg border border-slate-800/40">
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider block mb-1.5 text-center">Spread Line: {line}</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    {homeOpt && (
                      <OddsButton
                        label={`-${line}`}
                        odds={homeOpt.decimalOdds}
                        decimalMode={decimalMode}
                        isSelected={isSelected(marketName, homeOpt.name)}
                        onClick={() => handleSelectionClick(marketName, homeOpt.name, homeOpt.decimalOdds)}
                      />
                    )}
                  </div>
                  <div>
                    {tieOpt && (
                      <OddsButton
                        label={`Tie (-${line})`}
                        odds={tieOpt.decimalOdds}
                        decimalMode={decimalMode}
                        isSelected={isSelected(marketName, tieOpt.name)}
                        onClick={() => handleSelectionClick(marketName, tieOpt.name, tieOpt.decimalOdds)}
                      />
                    )}
                  </div>
                  <div>
                    {awayOpt && (
                      <OddsButton
                        label={`+${line}`}
                        odds={awayOpt.decimalOdds}
                        decimalMode={decimalMode}
                        isSelected={isSelected(marketName, awayOpt.name)}
                        onClick={() => handleSelectionClick(marketName, awayOpt.name, awayOpt.decimalOdds)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCorrectScoreMarket = () => {
    const market = markets.find(m => m.id === 'correct_score');
    if (!market) return null;

    const homeScores = ['1-0', '2-0', '2-1', '3-0', '3-1'];
    const drawScores = ['0-0', '1-1', '2-2', 'Other'];
    const awayScores = ['0-1', '0-2', '1-2', '0-3', '1-3'];

    const getBtn = (score: string) => {
      const opt = market.options.find(o => o.name === score);
      if (!opt) return <div key={score} className="h-[46px]" />;
      return (
        <div key={score} className="mb-2">
          <OddsButton
            label={score}
            odds={opt.decimalOdds}
            decimalMode={decimalMode}
            isSelected={isSelected('Correct Score', score)}
            onClick={() => handleSelectionClick('Correct Score', score, opt.decimalOdds)}
          />
        </div>
      );
    };

    return (
      <div className="grid grid-cols-3 gap-3">
        {/* Column 1: Home Win Scores */}
        <div>
          <span className="block text-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Home Win</span>
          {homeScores.map(getBtn)}
        </div>

        {/* Column 2: Draw Scores */}
        <div>
          <span className="block text-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Draw</span>
          {drawScores.map(getBtn)}
        </div>

        {/* Column 3: Away Win Scores */}
        <div>
          <span className="block text-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Away Win</span>
          {awayScores.map(getBtn)}
        </div>
      </div>
    );
  };

  const renderGenericGridMarket = (marketId: string, marketName: string, cols: number = 2) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return null;

    return (
      <div className={cn("grid gap-2", cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-1")}>
        {market.options.map((opt) => (
          <OddsButton
            key={opt.name}
            label={opt.name}
            odds={opt.decimalOdds}
            decimalMode={decimalMode}
            isSelected={isSelected(marketName, opt.name)}
            onClick={() => handleSelectionClick(marketName, opt.name, opt.decimalOdds)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) return <PageSkeleton />;

  if (!fixture) {
    return (
      <div className="px-4 md:px-6 py-16 max-w-3xl mx-auto flex flex-col items-center gap-4 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Match not found.</p>
        <Button variant="outline" onClick={() => router.push('/matches')}>Back to matches</Button>
      </div>
    );
  }

  // Determine which sections to render based on active tab
  const showSGP = activeTab === 'All' || activeTab === 'SGP';
  const showTotals = activeTab === 'All' || activeTab === 'Totals';
  const showCorners = activeTab === 'All' || activeTab === 'Corners';
  const showHalftime = activeTab === 'All' || activeTab === 'Halftime';
  const showSpreads = activeTab === 'All' || activeTab === 'Spreads';
  const showCorrectScore = activeTab === 'All' || activeTab === 'Correct Score';

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      {/* ── Sticky Match Header ── */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/matches" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                {fixture.league.country}
              </span>
              <span className="text-xs text-slate-300 font-extrabold truncate max-w-[180px] sm:max-w-none">
                {fixture.league.name}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="h-8 gap-1.5 border-slate-700 bg-slate-900/40 hover:bg-slate-800 text-xs text-slate-300">
              <Share2 className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Share'}
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-4 grid grid-cols-7 items-center">
          {/* Home Team */}
          <div className="col-span-3 flex items-center gap-2.5 pr-2 min-w-0">
            {fixture.teams.home.logo && (
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={32}
                height={32}
                className="object-contain drop-shadow-md shrink-0"
              />
            )}
            <span className="text-sm font-black text-slate-100 truncate flex items-center gap-1.5">
              {isInternational && COUNTRY_FLAGS[fixture.teams.home.name] && (
                <span className="text-sm shrink-0 leading-none">{COUNTRY_FLAGS[fixture.teams.home.name]}</span>
              )}
              {fixture.teams.home.name}
            </span>
          </div>

          {/* Score / Status */}
          <div className="col-span-1 flex flex-col items-center justify-center text-center shrink-0">
            {live ? (
              <div className="flex flex-col items-center gap-0.5">
                <LiveBadge elapsed={fixture.fixture.status.elapsed} />
                {hasScore && (
                  <span className="text-lg font-black text-emerald-400 tabular-nums">
                    {fixture.goals.home} - {fixture.goals.away}
                  </span>
                )}
              </div>
            ) : finished ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700/50 leading-none">FT</span>
                <span className="text-base font-black text-slate-300 tabular-nums">
                  {fixture.goals.home} - {fixture.goals.away}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  {formatTime(fixture.fixture.date)}
                </span>
                <span className="text-[9px] text-emerald-400 font-extrabold whitespace-nowrap mt-0.5">
                  {formatMatchDate(fixture.fixture.date)}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="col-span-3 flex items-center gap-2.5 pl-2 justify-end min-w-0">
            <span className="text-sm font-black text-slate-100 truncate flex items-center gap-1.5 text-right">
              {fixture.teams.away.name}
              {isInternational && COUNTRY_FLAGS[fixture.teams.away.name] && (
                <span className="text-sm shrink-0 leading-none">{COUNTRY_FLAGS[fixture.teams.away.name]}</span>
              )}
            </span>
            {fixture.teams.away.logo && (
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={32}
                height={32}
                className="object-contain drop-shadow-md shrink-0"
              />
            )}
          </div>
        </div>
      </header>

      {/* ── Tabs sticky navigation bar ── */}
      <MarketTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Odds Format Control Row ── */}
      <div className="bg-[#0f172a]/20 border-b border-slate-800/60 py-2.5 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Choose Markets
          </span>
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setDecimalMode(false)}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all",
                !decimalMode ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              American
            </button>
            <button
              onClick={() => setDecimalMode(true)}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all",
                decimalMode ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Decimal
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Content Container ── */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-4">
        
        {/* SGP Category Markets */}
        {showSGP && (
          <>
            <MarketAccordion title="Match Result (1X2)" sgpBadge initiallyExpanded>
              {renderMatchResultMarket()}
            </MarketAccordion>

            <MarketAccordion title="Pre-Built Same Game Parlays (SGPs)" sgpBadge>
              {renderGenericGridMarket('pre_built_sgps', 'Pre-Built SGPs', 2)}
            </MarketAccordion>

            <MarketAccordion title="Double Chance" sgpBadge>
              {renderGenericGridMarket('double_chance', 'Double Chance', 3)}
            </MarketAccordion>

            <MarketAccordion title="Both Teams to Score (BTTS)" sgpBadge>
              {renderGenericGridMarket('both_teams_to_score', 'Both Teams to Score', 2)}
            </MarketAccordion>

            <MarketAccordion title="Match Result and Both Teams to Score" sgpBadge>
              {renderGenericGridMarket('match_result_btts', 'Match Result and Both Teams to Score', 2)}
            </MarketAccordion>

            <MarketAccordion title="BTTS & Either Team to Win" sgpBadge>
              {renderGenericGridMarket('btts_either_win', 'Both Teams to Score & Either Team to Win', 2)}
            </MarketAccordion>

            <MarketAccordion title="Both Teams to Score Both Halves" sgpBadge>
              {renderGenericGridMarket('btts_both_halves', 'Both Teams to Score Both Halves', 2)}
            </MarketAccordion>

            <MarketAccordion title="BTTS and Total Goals 2.5" sgpBadge>
              {renderGenericGridMarket('btts_total_2_5', 'Both Teams to Score and Total Goals 2.5', 2)}
            </MarketAccordion>

            <MarketAccordion title="BTTS and Total Goals 3.5" sgpBadge>
              {renderGenericGridMarket('btts_total_3_5', 'Both Teams to Score and Total Goals 3.5', 2)}
            </MarketAccordion>

            <MarketAccordion title="BTTS and Total Goals 4.5" sgpBadge>
              {renderGenericGridMarket('btts_total_4_5', 'Both Teams to Score and Total Goals 4.5', 2)}
            </MarketAccordion>

            <MarketAccordion title="BTTS and Total Goals 5.5" sgpBadge>
              {renderGenericGridMarket('btts_total_5_5', 'Both Teams to Score and Total Goals 5.5', 2)}
            </MarketAccordion>

            <MarketAccordion title="To Win and Both Teams to Score" sgpBadge>
              {renderGenericGridMarket('to_win_btts', 'To Win and Both Teams to Score', 2)}
            </MarketAccordion>

            <MarketAccordion title="Win Both Halves" sgpBadge>
              {renderGenericGridMarket('win_both_halves', 'Win Both Halves', 2)}
            </MarketAccordion>
          </>
        )}

        {/* Totals Category Markets */}
        {showTotals && (
          <>
            <MarketAccordion title="Total Goals (Match Over/Under)">
              {renderTotalsMarket('total_goals_match', 'Total Goals (Over/Under)', ['0.5', '1.5', '2.5', '3.5', '4.5', '5.5'])}
            </MarketAccordion>
            <MarketAccordion title="Home Team Goals Over/Under">
              {renderTotalsMarket('total_goals_home', `Home Team Goals (${fixture.teams.home.name})`, ['0.5', '1.5', '2.5'])}
            </MarketAccordion>
            <MarketAccordion title="Away Team Goals Over/Under">
              {renderTotalsMarket('total_goals_away', `Away Team Goals (${fixture.teams.away.name})`, ['0.5', '1.5', '2.5'])}
            </MarketAccordion>
          </>
        )}

        {/* Corners Category Markets */}
        {showCorners && (
          <MarketAccordion title="Total Corners (Over/Under)">
            {renderTotalsMarket('total_corners', 'Total Corners (Over/Under)', ['7.5', '8.5', '9.5', '10.5', '11.5'])}
          </MarketAccordion>
        )}

        {/* Halftime Category Markets */}
        {showHalftime && (
          <>
            <MarketAccordion title="Halftime Result (1X2)">
              {renderGenericGridMarket('halftime_result_1x2', 'Halftime Result', 3)}
            </MarketAccordion>
            <MarketAccordion title="Halftime / Fulltime Combinations">
              {renderGenericGridMarket('halftime_fulltime', 'Halftime / Fulltime', 3)}
            </MarketAccordion>
            <MarketAccordion title="Halftime or Fulltime">
              {renderGenericGridMarket('halftime_or_fulltime', 'Halftime or Fulltime', 3)}
            </MarketAccordion>
          </>
        )}

        {/* Spreads Category Markets */}
        {showSpreads && (
          <>
            <MarketAccordion title="3-Way Spread">
              {renderSpreadsMarket('spreads', '3-Way Spread', fixture.teams.home.name, fixture.teams.away.name, [1, 2, 3])}
            </MarketAccordion>
            <MarketAccordion title="3-Way Spread 1st Half">
              {renderSpreadsMarket('spreads_1st_half', '3-Way Spread 1st Half', fixture.teams.home.name, fixture.teams.away.name, [1, 2])}
            </MarketAccordion>
          </>
        )}

        {/* Correct Score Grid */}
        {showCorrectScore && (
          <MarketAccordion title="Correct Score Grid">
            {renderCorrectScoreMarket()}
          </MarketAccordion>
        )}

        {/* All Tab only: Additional Markets */}
        {activeTab === 'All' && (
          <>
            <MarketAccordion title="Draw No Bet">
              {renderGenericGridMarket('draw_no_bet', 'Draw No Bet', 2)}
            </MarketAccordion>

            <MarketAccordion title="No Bet Sub-Markets">
              {renderGenericGridMarket('home_no_bet', 'Home No Bet / Away No Bet', 2)}
            </MarketAccordion>

            <MarketAccordion title="Home/Away to Win & Both Teams to Score">
              {renderGenericGridMarket('home_to_win_and_btts', 'Home/Away to Win & Both Teams to Score', 2)}
            </MarketAccordion>

            <MarketAccordion title="Double Chance & Both Teams to Score">
              {renderGenericGridMarket('double_chance_and_btts', 'Double Chance & Both Teams to Score', 3)}
            </MarketAccordion>

            <MarketAccordion title="Home/Away to Score">
              {renderGenericGridMarket('home_to_score', 'Home to Score / Away to Score', 2)}
            </MarketAccordion>

            <MarketAccordion title="Win from Behind">
              {renderGenericGridMarket('win_from_behind', 'Win from Behind', 2)}
            </MarketAccordion>

            <MarketAccordion title="Any Team to Come from Behind and Win">
              {renderGenericGridMarket('any_team_from_behind', 'Any Team to Come from Behind and Win', 2)}
            </MarketAccordion>

            <MarketAccordion title="Win Either Half">
              {renderGenericGridMarket('win_either_half', 'Win Either Half', 2)}
            </MarketAccordion>

            <MarketAccordion title="Clean Sheets">
              {renderGenericGridMarket('clean_sheet', 'Home Clean Sheet / Away Clean Sheet', 2)}
            </MarketAccordion>

            <MarketAccordion title="Home/Away to Lead at Anytime">
              {renderGenericGridMarket('lead_at_anytime', 'Home/Away to Lead at Anytime', 2)}
            </MarketAccordion>

            <MarketAccordion title="Run of Play">
              {renderGenericGridMarket('run_of_play', 'Run of Play', 3)}
            </MarketAccordion>
          </>
        )}

        {/* ── AI Predictions & Insights Section (organized in Accordion) ── */}
        <section className="pt-6 border-t border-slate-800/80">
          <div className="mb-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-200">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" /> AI Prediction Insights
            </h2>
            <p className="text-xs text-slate-400">Review analytical projections and indicators before placing your bets.</p>
          </div>

          <div className="space-y-3">
            {prediction && (
              <>
                <MarketAccordion title="AI Projections & Confidence">
                  <div className="space-y-5">
                    <PredictionChart prediction={prediction} />
                    <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-slate-800/40">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recommended Match Outcome</span>
                      <PredictionBadge
                        prediction={prediction.prediction}
                        homeTeam={prediction.home_team}
                        awayTeam={prediction.away_team}
                        className="text-sm px-4 py-1.5 font-bold"
                      />
                    </div>
                    <div className="pt-2 border-t border-slate-800/40">
                      <ConfidenceMeter confidence={prediction.confidence} />
                    </div>
                  </div>
                </MarketAccordion>

                <MarketAccordion title="Algorithm Projections Breakdown">
                  <AlgorithmBreakdown prediction={prediction} />
                </MarketAccordion>
              </>
            )}

            {detail && (
              <>
                <MarketAccordion title="Team Form (Last 5 Matches)">
                  <FormDisplay
                    homeTeam={fixture.teams.home.name}
                    awayTeam={fixture.teams.away.name}
                    homeForm={detail.homeForm}
                    awayForm={detail.awayForm}
                  />
                </MarketAccordion>

                <MarketAccordion title="Head to Head Matches (H2H)">
                  <H2HDisplay
                    homeTeam={fixture.teams.home.name}
                    awayTeam={fixture.teams.away.name}
                    h2h={detail.h2h}
                  />
                </MarketAccordion>

                <MarketAccordion title="Team Statistics Profile">
                  <StatsComparison
                    homeTeam={fixture.teams.home.name}
                    awayTeam={fixture.teams.away.name}
                    homeStats={detail.homeStats}
                    awayStats={detail.awayStats}
                  />
                </MarketAccordion>

                {detail.odds && prediction && (
                  <MarketAccordion title="Bookmaker Reference Odds">
                    <OddsComparison odds={detail.odds} prediction={prediction} />
                  </MarketAccordion>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── More Matches Carousel ── */}
        {similar.length > 0 && (
          <section className="pt-6 border-t border-slate-800/80">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-3">Other Predictions</h3>
            <div
              className="flex gap-3 overflow-x-auto pb-4 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {similar.map((p) => {
                const colors = getPredictionColors(p.prediction);
                const outcomeLabel = p.prediction === 'HOME_WIN' ? 'Home Win' : p.prediction === 'AWAY_WIN' ? 'Away Win' : 'Draw';
                return (
                  <Link key={p.fixture_id} href={`/predictions/${p.fixture_id}`}>
                    <div className="w-40 shrink-0 rounded-xl border border-slate-800 bg-slate-900/30 p-3 space-y-2 hover:border-emerald-500/50 transition-all active:scale-[0.98]">
                      <div className="space-y-1 text-center">
                        <p className="text-xs font-bold text-slate-200 truncate">{p.home_team}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">vs</p>
                        <p className="text-xs font-bold text-slate-200 truncate">{p.away_team}</p>
                      </div>
                      <div className="text-center pt-1.5">
                        <span className={cn('text-[10px] font-black uppercase tracking-wider rounded px-2 py-0.5 border leading-none', colors.text, colors.bg, colors.border)}>
                          {outcomeLabel}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <p className="text-[10px] text-slate-500/70 text-center pt-4">
          Projections are calculated based on algorithmic factors and are for reference only. Play responsibly.
        </p>

      </main>
    </div>
  );
}
