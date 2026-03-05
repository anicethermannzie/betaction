'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays } from 'lucide-react';

import { matchApi, predictionApi } from '@/lib/api';
import { getTodayString } from '@/lib/utils';

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

function TodayMatchesSection({ fixtures, predictionMap, isLoading }: TodaySectionProps) {
  const dateLabel = format(new Date(), 'EEEE, MMMM d');
  // Show max 9 in the grid (3 complete rows on desktop); link to /matches for the rest
  const gridFixtures = fixtures.slice(0, 9);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
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

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="match" />
          ))}
        </div>
      ) : gridFixtures.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center gap-3">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No matches scheduled for today.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gridFixtures.map((f) => (
              <MatchCard
                key={f.fixture.id}
                fixture={f}
                prediction={predictionMap.get(f.fixture.id)}
              />
            ))}
          </div>

          {fixtures.length > 9 && (
            <div className="mt-4 text-center">
              <Link
                href="/matches"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                +{fixtures.length - 9} more matches today
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [fixtures,    setFixtures]    = useState<ApiFixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      matchApi.byDate(getTodayString()),
      predictionApi.today(),
    ]).then(([matchRes, predRes]) => {
      if (matchRes.status === 'fulfilled') {
        const d = matchRes.value.data;
        setFixtures(Array.isArray(d?.response) ? d.response : []);
      }
      if (predRes.status === 'fulfilled') {
        const d = predRes.value.data;
        // FastAPI returns array directly; fallback to wrapped { data: [...] }
        setPredictions(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      }
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
