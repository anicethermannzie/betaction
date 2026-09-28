'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays } from 'lucide-react';

import { matchApi, predictionApi } from '@/lib/api';
import { getTodayString, cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { EmptyState, ErrorState } from '@/components/common/StateMessage';

import { LiveScoresTicker }      from '@/components/home/LiveScoresTicker';
import { HeroSection }           from '@/components/home/HeroSection';
import { TopPredictionsScroll }  from '@/components/home/TopPredictionsScroll';
import { PopularLeaguesGrid }    from '@/components/home/PopularLeaguesGrid';
import { TicketSummarySection }  from '@/components/tickets/TicketSummary';
import { MatchCard }             from '@/components/matches/MatchCard';
import { LoadingSkeleton }       from '@/components/common/LoadingSkeleton';

import type { ApiFixture, Prediction } from '@/types';

// ── Confidence rank (for hero selection) ─────────────────────────────────────

const CONF_RANK = { high: 3, medium: 2, low: 1 } as const;

function pickTopPrediction(predictions: Prediction[]): Prediction | null {
  if (predictions.length === 0) return null;
  return [...predictions].sort((a, b) => {
    const cd = CONF_RANK[b.confidence] - CONF_RANK[a.confidence];
    if (cd !== 0) return cd;
    return (
      Math.max(b.home_win, b.away_win, b.draw) -
      Math.max(a.home_win, a.away_win, a.draw)
    );
  })[0];
}

// ── Today's Matches section ───────────────────────────────────────────────────

interface TodaySectionProps {
  fixtures:      ApiFixture[];
  predictionMap: Map<number, Prediction>;
  isLoading:     boolean;
  hasError:      boolean;
  onRetry:       () => void;
}

const LEAGUE_PILLS = [
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 2, name: 'Champions League' },
  { id: 1, name: 'World Cup' },
  { id: 4, name: 'UEFA Euro' },
  { id: 9, name: 'Copa America' },
  { id: 5, name: 'Nations League' },
  { id: 10, name: 'Friendlies' },
];

function TodayMatchesSection({
  fixtures, predictionMap, isLoading, hasError, onRetry,
}: TodaySectionProps) {
  const dateLabel = format(new Date(), 'EEEE, MMMM d');
  const [activeTab, setActiveTab] = useState<'all' | 'club' | 'international'>('all');
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);

  // Filtering runs on every render otherwise — four passes over the fixture list
  // each time a pill is hovered.
  const filtered = useMemo(() => {
    let list = fixtures;

    if (activeTab === 'club') {
      list = list.filter(f => f.competition_type === 'club' || !f.competition_type);
    } else if (activeTab === 'international') {
      list = list.filter(f => f.competition_type === 'international');
    }

    if (selectedLeague !== null) {
      list = list.filter(f => f.league.id === selectedLeague);
    }

    return list;
  }, [fixtures, activeTab, selectedLeague]);

  const { clubMatches, internationalMatches } = useMemo(() => ({
    clubMatches: filtered.filter(f => f.competition_type === 'club' || !f.competition_type),
    internationalMatches: filtered.filter(f => f.competition_type === 'international'),
  }), [filtered]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="section-title">Today&apos;s Matches</h2>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            — {dateLabel}
          </span>
        </div>
        <Link
          href="/matches"
          className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Competition Type Tabs */}
      <div className="flex gap-1 border-b border-border pb-2">
        {(['all', 'club', 'international'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedLeague(null);
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-colors ',
              activeTab === tab
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* League Pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          onClick={() => setSelectedLeague(null)}
          className={cn(
            'px-3.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ',
            selectedLeague === null
              ? 'border-primary bg-primary/10 text-primary font-bold'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          )}
        >
          All Leagues
        </button>
        {LEAGUE_PILLS.map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              'px-3.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ',
              selectedLeague === league.id
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {league.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="match" />
          ))}
        </div>
      ) : hasError ? (
        // Distinct from the empty state below: the schedule is unknown, not empty.
        <ErrorState
          title="Today's matches are unavailable"
          detail="We couldn't reach the match feed. Your account is fine — please try again in a moment."
          onRetry={onRetry}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No matches scheduled matching the filters"
          description="Try another competition or league, or check back closer to kick-off."
        />
      ) : activeTab === 'all' && selectedLeague === null ? (
        <div className="space-y-6">
          {/* Club Leagues Section */}
          {clubMatches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-2 border-l-2 border-primary">Club Leagues</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clubMatches.slice(0, 6).map((f) => (
                  <MatchCard
                    key={f.fixture.id}
                    fixture={f}
                    prediction={predictionMap.get(f.fixture.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* International Section */}
          {internationalMatches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-2 border-l-2 border-hold">International Competitions</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {internationalMatches.slice(0, 6).map((f) => (
                  <MatchCard
                    key={f.fixture.id}
                    fixture={f}
                    prediction={predictionMap.get(f.fixture.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.slice(0, 9).map((f) => (
            <MatchCard
              key={f.fixture.id}
              fixture={f}
              prediction={predictionMap.get(f.fixture.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Hero skeleton ─────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-6 md:p-8 space-y-6 animate-live-pulse">
      <div className="h-3 w-36 bg-muted rounded-full" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="h-3 w-20 bg-muted rounded-full" />
          <div className="h-7 w-16 bg-muted rounded-full" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-8 bg-muted rounded-full" />
          <div className="h-6 w-24 bg-muted rounded-full" />
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="h-3 w-20 bg-muted rounded-full" />
          <div className="h-7 w-16 bg-muted rounded-full" />
        </div>
      </div>
      <div className="h-2 w-full bg-muted rounded-full" />
      <div className="flex gap-4">
        <div className="h-8 flex-1 bg-muted rounded-full" />
        <div className="h-8 w-36 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

// ── Dashboard Component ───────────────────────────────────────────────────────

export function Dashboard() {
  const [fixtures,    setFixtures]    = useState<ApiFixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [loadError,   setLoadError]   = useState(false);
  // Bumped by the retry button. Effects must not set state synchronously, so
  // the "start loading" transition belongs to the click handler and the effect
  // only reacts to the token changing.
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.allSettled([
      matchApi.byDate(getTodayString()),
      predictionApi.today(),
    ]).then(([matchRes, predRes]) => {
      if (cancelled) return;

      // No mock fallback. If the feed is down the user is told, rather than
      // shown fabricated fixtures that are indistinguishable from real ones.
      if (matchRes.status === 'fulfilled') {
        const d = matchRes.value.data;
        const list = Array.isArray(d?.response)
          ? d.response
          : [
            ...(Array.isArray(d?.club) ? d.club : []),
            ...(Array.isArray(d?.international) ? d.international : []),
          ];
        setFixtures(list);
      } else {
        logger.error("Failed to load today's fixtures", matchRes.reason);
        setFixtures([]);
        setLoadError(true);
      }

      if (predRes.status === 'fulfilled') {
        const d = predRes.value.data;
        setPredictions(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      } else {
        // Predictions failing alone is not fatal — fixtures still render, just
        // without prediction bars.
        logger.error("Failed to load today's predictions", predRes.reason);
        setPredictions([]);
      }
    }).finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [reloadToken]);

  // Prediction lookup map: fixture.id → Prediction
  const predictionMap = useMemo(
    () => new Map(predictions.map((p) => [p.fixture_id, p])),
    [predictions]
  );

  // Top prediction for hero card
  const heroPrediction = useMemo(() => pickTopPrediction(predictions), [predictions]);

  // Team logos for the hero card (sourced from the matching fixture)
  const heroLogos = useMemo(() => {
    if (!heroPrediction) return { home: undefined, away: undefined };
    const f = fixtures.find((x) => x.fixture.id === heroPrediction.fixture_id);
    return { home: f?.teams.home.logo, away: f?.teams.away.logo };
  }, [heroPrediction, fixtures]);

  // Upcoming (not-started) fixtures → passed to ticker for countdown
  const upcomingFixtures = useMemo(
    () => fixtures.filter((f) => f.fixture.status.short === 'NS'),
    [fixtures]
  );

  return (
    <>
      {/* ── 1. LIVE SCORES TICKER ── full-width, outside the content container */}
      <LiveScoresTicker upcomingFixtures={upcomingFixtures} />

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-10">

        {/* ── 2. HERO SECTION ── top prediction of the day */}
        {isLoading ? (
          <HeroSkeleton />
        ) : heroPrediction ? (
          <HeroSection
            prediction={heroPrediction}
            homeLogo={heroLogos.home}
            awayLogo={heroLogos.away}
          />
        ) : null}

        {/* ── 3. TODAY'S MATCHES ── grid with embedded prediction bars */}
        <TodayMatchesSection
          fixtures={fixtures}
          predictionMap={predictionMap}
          isLoading={isLoading}
          hasError={loadError}
          onRetry={retry}
        />

        {/* ── 4. TOP PREDICTIONS ── horizontal scrollable cards */}
        {!isLoading && predictions.length > 0 && (
          <TopPredictionsScroll predictions={predictions} />
        )}

        {/* ── 5. TODAY'S TICKETS ── compact summary grid */}
        <TicketSummarySection />

        {/* ── 6. POPULAR LEAGUES ── 2×4 grid */}
        <PopularLeaguesGrid />
      </div>
    </>
  );
}
