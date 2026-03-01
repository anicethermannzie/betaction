'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { predictionApi } from '@/lib/api';
import { PredictionBadge } from '@/components/predictions/PredictionBadge';
import { ConfidenceMeter } from '@/components/predictions/ConfidenceMeter';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { LeagueSelector } from '@/components/leagues/LeagueSelector';
import { Card, CardContent } from '@/components/ui/card';
import { formatProbability } from '@/lib/utils';
import type { Prediction } from '@/types';

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [confidence, setConfidence]   = useState<'all' | Prediction['confidence']>('all');

  useEffect(() => {
    predictionApi.today()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setPredictions(list as Prediction[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (confidence === 'all') return predictions;
    return predictions.filter((p) => p.confidence === confidence);
  }, [predictions, confidence]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Today&apos;s Predictions</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} matches</span>
      </div>

      {/* Confidence filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setConfidence(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              confidence === c
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {c === 'all' ? 'All' : `${c.charAt(0).toUpperCase() + c.slice(1)} confidence`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Link key={p.fixture_id} href={`/predictions/${p.fixture_id}`}>
              <Card className="hover-glow cursor-pointer transition-all hover:border-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {p.home_team} <span className="text-muted-foreground">vs</span> {p.away_team}
                      </p>
                      <div className="mt-1">
                        <ConfidenceMeter confidence={p.confidence} />
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <PredictionBadge
                        prediction={p.prediction}
                        homeTeam={p.home_team}
                        awayTeam={p.away_team}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatProbability(
                          p.prediction === 'HOME_WIN' ? p.home_win
                          : p.prediction === 'AWAY_WIN' ? p.away_win
                          : p.draw
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No predictions match the selected filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
