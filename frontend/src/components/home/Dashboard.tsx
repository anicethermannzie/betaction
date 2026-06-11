'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays } from 'lucide-react';

import { matchApi, predictionApi } from '@/lib/api';
import { getTodayString, cn } from '@/lib/utils';
import { MOCK_TODAY, MOCK_PREDICTIONS } from '@/lib/mockData';

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

function TodayMatchesSection({ fixtures, predictionMap, isLoading }: TodaySectionProps) {
  const dateLabel = format(new Date(), 'EEEE, MMMM d');
  const [activeTab, setActiveTab] = useState<'all' | 'club' | 'international'>('all');
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);

  // 1. Filter by competition type
  let filtered = fixtures;
  if (activeTab === 'club') {
    filtered = fixtures.filter(f => (f as any).competition_type === 'club' || !(f as any).competition_type);
  } else if (activeTab === 'international') {
    filtered = fixtures.filter(f => (f as any).competition_type === 'international');
  }

  // 2. Filter by league pill
  if (selectedLeague !== null) {
    filtered = filtered.filter(f => f.league.id === selectedLeague);
  }

  // 3. Grouping for All Tab
  const clubMatches = filtered.filter(f => (f as any).competition_type === 'club' || !(f as any).competition_type);
  const internationalMatches = filtered.filter(f => (f as any).competition_type === 'international');

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
      <div className="flex gap-1 border-b border-slate-800 pb-2">
        {(['all', 'club', 'international'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedLeague(null);
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all active:scale-95',
              activeTab === tab
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200'
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
            'px-3.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border active:scale-95',
            selectedLeague === null
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-extrabold'
              : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:text-slate-200'
          )}
        >
          All Leagues
        </button>
        {LEAGUE_PILLS.map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              'px-3.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border active:scale-95',
              selectedLeague === league.id
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-extrabold'
                : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:text-slate-200'
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center gap-3">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No matches scheduled matching the filters.</p>
        </div>
      ) : activeTab === 'all' && selectedLeague === null ? (
        <div className="space-y-6">
          {/* Club Leagues Section */}
          {clubMatches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 pl-2 border-l-2 border-emerald-500">Club Leagues</h3>
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
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 pl-2 border-l-2 border-amber-500">International Competitions</h3>
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
    <div className="rounded-2xl border border-border/50 bg-card/50 p-6 md:p-8 space-y-6 animate-pulse">
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

  useEffect(() => {
    Promise.allSettled([
      matchApi.byDate(getTodayString()),
      predictionApi.today(),
    ]).then(([matchRes, predRes]) => {
      let list = [];
      if (matchRes.status === 'fulfilled') {
        const d = matchRes.value.data;
        if (d) {
          if (Array.isArray(d.response)) {
            list = d.response;
          } else {
            const clubList = Array.isArray(d.club) ? d.club : [];
            const intList = Array.isArray(d.international) ? d.international : [];
            list = [...clubList, ...intList];
          }
        }
      }
      setFixtures(list.length > 0 ? list : MOCK_TODAY);

      let predList = [];
      if (predRes.status === 'fulfilled') {
        const d = predRes.value.data;
        // FastAPI returns array directly; fallback to wrapped { data: [...] }
        predList = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      }
      setPredictions(predList.length > 0 ? predList : MOCK_PREDICTIONS);
    }).finally(() => setIsLoading(false));
  }, []);

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
