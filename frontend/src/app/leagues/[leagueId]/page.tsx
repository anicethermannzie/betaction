'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { matchApi } from '@/lib/api';
import { StandingsTable } from '@/components/leagues/StandingsTable';
import { MatchList } from '@/components/matches/MatchList';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { POPULAR_LEAGUES, type Standing, type ApiFixture } from '@/types';
import { getTodayString } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { EmptyState, ErrorState } from '@/components/common/StateMessage';

const CURRENT_SEASON = new Date().getFullYear();

export default function LeaguePage() {
  const { leagueId }    = useParams<{ leagueId: string }>();
  const id              = parseInt(leagueId, 10);
  const league          = POPULAR_LEAGUES.find((l) => l.id === id);

  const [standings, setStandings]   = useState<Standing[]>([]);
  const [fixtures, setFixtures]     = useState<ApiFixture[]>([]);
  const [standLoad, setStandLoad]   = useState(true);
  const [fixLoad, setFixLoad]       = useState(true);
  const [standError, setStandError] = useState(false);
  const [fixError, setFixError]     = useState(false);
  // Retry tokens: effects must not set state synchronously, so each retry
  // handler owns its loading transition and the effect reacts to the token.
  const [standToken, setStandToken] = useState(0);
  const [fixToken, setFixToken]     = useState(0);

  const retryStandings = useCallback(() => {
    setStandLoad(true);
    setStandError(false);
    setStandToken((n) => n + 1);
  }, []);

  const retryFixtures = useCallback(() => {
    setFixLoad(true);
    setFixError(false);
    setFixToken((n) => n + 1);
  }, []);

  // Each tab loads independently: standings failing should not blank the match
  // list, and vice versa. Both used to swallow their error into console.error
  // and render as an empty table.
  useEffect(() => {
    let cancelled = false;

    void matchApi.standings(id, CURRENT_SEASON)
      .then(({ data }) => {
        if (cancelled) return;
        const res = (data as { response: { league: { standings: Standing[][] } }[] }).response;
        setStandings(res?.[0]?.league?.standings?.[0] ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.error('Failed to load standings', err, { leagueId: id });
        setStandings([]);
        setStandError(true);
      })
      .finally(() => { if (!cancelled) setStandLoad(false); });

    return () => { cancelled = true; };
  }, [id, standToken]);

  useEffect(() => {
    let cancelled = false;

    void matchApi.byDate(getTodayString())
      .then(({ data }) => {
        if (cancelled) return;
        const d = data as { response?: ApiFixture[]; club?: ApiFixture[]; international?: ApiFixture[] };
        const all = Array.isArray(d?.response)
          ? d.response
          : [...(d?.club ?? []), ...(d?.international ?? [])];
        setFixtures(all.filter((f) => f.league.id === id));
      })
      .catch((err) => {
        if (cancelled) return;
        logger.error('Failed to load league fixtures', err, { leagueId: id });
        setFixtures([]);
        setFixError(true);
      })
      .finally(() => { if (!cancelled) setFixLoad(false); });

    return () => { cancelled = true; };
  }, [id, fixToken]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        {league && (
          <span className="text-3xl" role="img" aria-label={league.country}>
            {league.flag}
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold">{league?.name ?? `League ${id}`}</h1>
          <p className="text-sm text-muted-foreground">{league?.country}</p>
        </div>
      </div>

      <Tabs defaultValue="standings">
        <TabsList>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="mt-4">
          {standLoad ? (
            <LoadingSkeleton variant="standings" />
          ) : standError ? (
            <ErrorState
              title="Standings are unavailable"
              detail="We couldn't reach the league data feed. Please try again in a moment."
              onRetry={retryStandings}
            />
          ) : standings.length === 0 ? (
            <EmptyState
              title="No standings published for this season yet"
              description="Tables appear once the competition has started."
            />
          ) : (
            <StandingsTable standings={standings} />
          )}
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          {fixError ? (
            <ErrorState
              title="Match list unavailable"
              detail="We couldn't reach the match feed. Please try again in a moment."
              onRetry={retryFixtures}
            />
          ) : (
            <MatchList fixtures={fixtures} isLoading={fixLoad} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
