'use client';

import { useEffect, useState } from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { MatchList } from '@/components/matches/MatchList';
import { MatchCard } from '@/components/matches/MatchCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useLiveLeagueScores } from '@/hooks/useLiveScores';
import { matchApi, predictionApi } from '@/lib/api';
import { getTodayString } from '@/lib/utils';
import type { ApiFixture, Prediction } from '@/types';

function LiveSection() {
  const [liveMatches, setLiveMatches] = useState<ApiFixture[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to all live score updates
  useLiveLeagueScores(0);

  useEffect(() => {
    matchApi.getLive()
      .then(({ data }) => setLiveMatches((data as { response: ApiFixture[] }).response ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton variant="match" />;
  if (liveMatches.length === 0) return (
    <p className="text-sm text-muted-foreground px-1">No live matches right now.</p>
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {liveMatches.slice(0, 6).map((f) => (
        <MatchCard key={f.fixture.id} fixture={f} />
      ))}
    </div>
  );
}

function TodaySection() {
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    matchApi.getByDate(getTodayString())
      .then(({ data }) => setFixtures((data as { response: ApiFixture[] }).response ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <MatchList
      fixtures={fixtures}
      isLoading={loading}
      groupByLeague
    />
  );
}

function FeaturedPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    predictionApi.getToday()
      .then(({ data }) => setPredictions((data as Prediction[]).slice(0, 4)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return <p className="text-sm text-muted-foreground px-1">No predictions available today.</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {predictions.map((p) => (
        <div
          key={p.fixture_id}
          className="rounded-xl border border-border bg-card p-4 hover-glow transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground truncate">
              {p.home_team} vs {p.away_team}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center text-xs">
            {[
              { label: p.home_team, value: p.home_win, color: 'text-emerald-500' },
              { label: 'Draw',      value: p.draw,     color: 'text-muted-foreground' },
              { label: p.away_team, value: p.away_win,  color: 'text-amber-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className={`font-bold ${color}`}>{Math.round(value * 100)}%</span>
                <span className="text-muted-foreground truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
      {/* Live matches */}
      <section>
        <h2 className="section-title flex items-center gap-2 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          Live Now
        </h2>
        <LiveSection />
      </section>

      {/* Featured predictions */}
      <section>
        <h2 className="section-title flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          Today&apos;s Predictions
        </h2>
        <FeaturedPredictions />
      </section>

      {/* Today's matches */}
      <section>
        <h2 className="section-title flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-primary" />
          Today&apos;s Matches
        </h2>
        <TodaySection />
      </section>
    </div>
  );
}
