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
import { MatchTabs, type MatchDetailTab } from '@/components/match/MatchTabs';
import { MomentumChart }            from '@/components/match/MomentumChart';
import { LiveOddsBar }              from '@/components/match/LiveOddsBar';
import { MatchTimeline }            from '@/components/match/MatchTimeline';
import { AiInsightsPanel }          from '@/components/match/AiInsightsPanel';
import { OddsButton }               from '@/components/match/OddsButton';

import { PredictionChart }     from '@/components/predictions/PredictionChart';
import { PredictionBadge }     from '@/components/predictions/PredictionBadge';
import { ConfidenceMeter }     from '@/components/predictions/ConfidenceMeter';
import { AlgorithmBreakdown }  from '@/components/predictions/AlgorithmBreakdown';
import { H2HDisplay }          from '@/components/predictions/H2HDisplay';
import { OddsComparison }      from '@/components/predictions/OddsComparison';
import { LiveBadge }           from '@/components/matches/LiveBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }              from '@/components/ui/button';

import {
  cn, formatTime, formatMatchDate,
  isMatchLive, isMatchHalftime, isMatchFinished,
  getPredictionColors, getInitials,
} from '@/lib/utils';

import { buildMarkets, type Market } from '@/lib/markets';
import { toH2HMatches, toMatchOdds } from '@/lib/matchDetail';
import { logger } from '@/lib/logger';
import { EmptyState, ErrorState } from '@/components/common/StateMessage';
import { PredictionWorkspace } from '@/components/predictions/PredictionWorkspace';
import type { ApiFixture, H2HMatch, MatchOdds, Prediction, LiveScorePayload, MarketCategory } from '@/types';

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
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-5 animate-live-pulse">
      <div className="h-10 bg-card rounded-lg" />
      <div className="h-44 rounded-lg bg-card" />
      <div className="h-12 rounded-lg bg-card" />
      <div className="h-64 rounded-lg bg-card" />
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
  const [h2h,        setH2h]        = useState<H2HMatch[]>([]);
  const [odds,       setOdds]       = useState<MatchOdds | null>(null);
  const [similar,    setSimilar]    = useState<Prediction[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loadedKey, setLoadedKey] = useState<number | null>(null);
  const isLoading = loadedKey !== fixtureId;
  const [copied,     setCopied]     = useState(false);
  const [activeTab,  setActiveTab]  = useState<MarketCategory>('All');
  const [decimalMode, setDecimalMode] = useState(false);
  const [matchResultTab, setMatchResultTab] = useState<'reg' | '1h'>('reg');
  // Top-level Details|Commentary|AI Insights|Lineups navigation — distinct
  // from `activeTab` above (the SGP/Totals/Corners/etc. market category tabs
  // nested inside the Details tab's own content).
  const [matchDetailTab, setMatchDetailTab] = useState<MatchDetailTab>('details');

  // Zustand Store
  const selections = useBetSlipStore((state) => state.selections);
  const addSelection = useBetSlipStore((state) => state.addSelection);
  const removeSelection = useBetSlipStore((state) => state.removeSelection);

  // ── Fetch fixture + prediction ────────────────────────────────────────────
  // Every section below is driven by a real response. Where a call fails the
  // section is hidden; nothing is substituted. The page previously fell back to
  // three hardcoded demo fixtures, which meant an outage looked like data.
  // Retry bumps this; the effect reacts to it. The loading transition lives in
  // the click handler because an effect must not set state synchronously.
  const retry = useCallback(() => {
    setLoadedKey(null);
    setLoadFailed(false);
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.allSettled([
      matchApi.byId(fixtureId),
      predictionApi.markets(fixtureId),
    ]).then(async ([fixRes, predRes]) => {
      if (cancelled) return;
      setLoadFailed(false);

      let loadedFixture: ApiFixture | null = null;

      if (fixRes.status === 'fulfilled') {
        const d = fixRes.value.data as { response?: ApiFixture[] };
        loadedFixture = d?.response?.[0] ?? null;
        setFixture(loadedFixture);
      } else {
        logger.error('Failed to load fixture', fixRes.reason, { fixtureId });
        setFixture(null);
        setLoadFailed(true);
      }

      if (predRes.status === 'fulfilled') {
        const d = predRes.value.data as { data?: Prediction } | Prediction;
        setPrediction(('data' in d ? d.data : (d as Prediction)) ?? null);
      } else {
        // A missing prediction is not fatal: the fixture header and score still
        // render, the market grid simply stays empty.
        logger.error('Failed to load prediction', predRes.reason, { fixtureId });
        setPrediction(null);
      }

      if (cancelled || !loadedFixture) return;

      // Supporting detail — each is optional and independent.
      const [h2hRes, oddsRes, todayRes] = await Promise.allSettled([
        matchApi.h2h(loadedFixture.teams.home.id, loadedFixture.teams.away.id),
        matchApi.odds(fixtureId),
        predictionApi.today(),
      ]);
      if (cancelled) return;

      setH2h(h2hRes.status === 'fulfilled'
        ? toH2HMatches((h2hRes.value.data as { response?: ApiFixture[] })?.response)
        : []);

      setOdds(oddsRes.status === 'fulfilled'
        ? toMatchOdds((oddsRes.value.data as { response?: [] })?.response)
        : null);

      if (todayRes.status === 'fulfilled') {
        const d = todayRes.value.data;
        const list: Prediction[] = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setSimilar(list.filter((p) => p.fixture_id !== fixtureId).slice(0, 5));
      } else {
        setSimilar([]);
      }
    }).finally(() => { if (!cancelled) setLoadedKey(fixtureId); });

    return () => { cancelled = true; };
  }, [fixtureId, reloadToken]);

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

  // ── Derived Markets ───────────────────────────────────────────────────────
  // Markets are built only from probabilities the algorithm returned. A market
  // the model did not price is absent, never invented.
  const markets = useMemo(() => {
    if (!fixture) return [];
    return buildMarkets(prediction?.markets, fixture.teams.home.name, fixture.teams.away.name);
  }, [fixture, prediction]);

  const isInternational = useMemo(() => {
    if (!fixture) return false;
    const lid = fixture.league.id;
    return [1, 4, 9, 6, 7, 5, 8, 32, 33, 34, 35, 36, 481, 10].includes(lid) || fixture.competition_type === 'international';
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

    // Sub-tabs are offered only where the algorithm actually prices that period.
    // The 2nd-half tab is gone: it was priced by multiplying the full-time odds
    // by 1.4, which is not a forecast of anything.
    const periods: { key: 'reg' | '1h'; label: string; market?: Market; marketLabel: string }[] = ([
      { key: 'reg' as const, label: 'Regular Time', market: regMarket, marketLabel: 'Match Result (1X2)' },
      { key: '1h' as const, label: '1st Half', market: fhMarket, marketLabel: '1st Half Result' },
    ]).filter((p) => p.market !== undefined);

    const active = periods.find((p) => p.key === matchResultTab) ?? periods[0];
    const activeMarket = active?.market;
    const marketLabel = active?.marketLabel ?? 'Match Result (1X2)';

    if (!activeMarket) return null;

    return (
      <div className="space-y-4">
        {/* Sub-tabs — only for periods the model prices */}
        {periods.length > 1 && (
          <div className="flex bg-card p-0.5 rounded-lg border border-border">
            {periods.map((period) => (
              <button
                key={period.key}
                type="button"
                onClick={() => setMatchResultTab(period.key)}
                className={cn(
                  "flex-1 py-1.5 text-[11px] font-bold uppercase rounded tracking-wider transition-colors",
                  active?.key === period.key
                    ? "bg-muted text-primary font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        )}

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
        <div className="grid grid-cols-3 text-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-2">
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
                <span className="text-center font-bold text-sm text-foreground/80">{line}</span>
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
        <div className="grid grid-cols-3 text-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-2">
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
              <div key={line} className="space-y-1 bg-card p-2 rounded-lg border border-border">
                <span className="label text-primary tracking-wider block mb-1.5 text-center">Spread Line: {line}</span>
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
          <span className="block text-center label tracking-wider text-muted-foreground mb-1.5">Home Win</span>
          {homeScores.map(getBtn)}
        </div>

        {/* Column 2: Draw Scores */}
        <div>
          <span className="block text-center label tracking-wider text-muted-foreground mb-1.5">Draw</span>
          {drawScores.map(getBtn)}
        </div>

        {/* Column 3: Away Win Scores */}
        <div>
          <span className="block text-center label tracking-wider text-muted-foreground mb-1.5">Away Win</span>
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

  // A failed request and a fixture that genuinely does not exist need different
  // messages: one asks the user to retry, the other to go back.
  if (!fixture && loadFailed) {
    return (
      <div className="px-4 md:px-6 py-10 max-w-3xl mx-auto">
        <ErrorState
          title="We couldn't load this match"
          detail="The match feed is not responding. Please try again in a moment."
          onRetry={retry}
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push('/matches')}>Back to matches</Button>
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="px-4 md:px-6 py-16 max-w-3xl mx-auto flex flex-col items-center gap-4 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Match not found.</p>
        <Button variant="outline" onClick={() => router.push('/matches')}>Back to matches</Button>
      </div>
    );
  }

  return (
    <PredictionWorkspace
      fixture={fixture}
      prediction={prediction}
      markets={markets}
      h2h={h2h}
      odds={odds}
      fixtureId={fixtureId}
      copied={copied}
      decimalMode={decimalMode}
      tab={matchDetailTab === 'details' ? 'overview' : matchDetailTab === 'commentary' ? 'live' : matchDetailTab === 'ai-insights' ? 'insights' : 'lineups'}
      onShare={handleShare}
      onDecimalMode={setDecimalMode}
      onTab={(tab) => setMatchDetailTab(tab === 'overview' ? 'details' : tab === 'live' ? 'commentary' : tab === 'insights' ? 'ai-insights' : 'lineups')}
      isSelected={isSelected}
      onSelect={handleSelectionClick}
    />
  );

}


