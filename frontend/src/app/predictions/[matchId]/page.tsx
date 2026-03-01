'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Info } from 'lucide-react';
import Link from 'next/link';
import { usePrediction } from '@/hooks/usePrediction';
import { useLiveScores } from '@/hooks/useLiveScores';
import { matchApi } from '@/lib/api';
import { ScoreDisplay } from '@/components/matches/ScoreDisplay';
import { PredictionChart } from '@/components/predictions/PredictionChart';
import { PredictionBadge } from '@/components/predictions/PredictionBadge';
import { ConfidenceMeter } from '@/components/predictions/ConfidenceMeter';
import { StatsComparison } from '@/components/predictions/StatsComparison';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatFullDate } from '@/lib/utils';
import type { ApiFixture } from '@/types';

export default function PredictionPage() {
  const { matchId }  = useParams<{ matchId: string }>();
  const fixtureId    = parseInt(matchId, 10);

  const { prediction, loading: predLoading, error } = usePrediction(fixtureId);

  const [fixture, setFixture]   = useState<ApiFixture | null>(null);
  const [fixLoading, setFixLoad] = useState(true);

  useLiveScores(fixtureId);

  useEffect(() => {
    matchApi.getById(fixtureId)
      .then(({ data }) => {
        const res = (data as { response: ApiFixture[] }).response;
        if (res?.[0]) setFixture(res[0]);
      })
      .catch(console.error)
      .finally(() => setFixLoad(false));
  }, [fixtureId]);

  const isLoading = predLoading || fixLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <LoadingSkeleton variant="prediction" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (error && !prediction) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Info className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/matches">Back to matches</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/matches" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>
      </Button>

      {/* Score card */}
      {fixture && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatFullDate(fixture.fixture.date)}
              <span className="mx-1">·</span>
              {fixture.league.name}
            </div>
          </CardHeader>
          <CardContent>
            <ScoreDisplay fixture={fixture} size="md" />
          </CardContent>
        </Card>
      )}

      {prediction && (
        <>
          {/* Prediction card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Prediction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <PredictionBadge
                  prediction={prediction.prediction}
                  homeTeam={prediction.home_team}
                  awayTeam={prediction.away_team}
                />
              </div>

              <PredictionChart prediction={prediction} />
              <ConfidenceMeter confidence={prediction.confidence} />
            </CardContent>
          </Card>

          {/* Stats comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsComparison prediction={prediction} />
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="text-[11px] text-muted-foreground text-center px-4">
            Predictions are for informational purposes only and do not constitute betting advice.
          </p>
        </>
      )}
    </div>
  );
}
