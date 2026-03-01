'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { matchApi } from '@/lib/api';
import { StandingsTable } from '@/components/leagues/StandingsTable';
import { MatchList } from '@/components/matches/MatchList';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { POPULAR_LEAGUES, type Standing, type ApiFixture } from '@/types';
import { getTodayString } from '@/lib/utils';

const CURRENT_SEASON = new Date().getFullYear();

export default function LeaguePage() {
  const { leagueId }    = useParams<{ leagueId: string }>();
  const id              = parseInt(leagueId, 10);
  const league          = POPULAR_LEAGUES.find((l) => l.id === id);

  const [standings, setStandings]   = useState<Standing[]>([]);
  const [fixtures, setFixtures]     = useState<ApiFixture[]>([]);
  const [standLoad, setStandLoad]   = useState(true);
  const [fixLoad, setFixLoad]       = useState(true);

  useEffect(() => {
    matchApi.standings(id, CURRENT_SEASON)
      .then(({ data }) => {
        const res = (data as { response: { league: { standings: Standing[][] } }[] }).response;
        setStandings(res?.[0]?.league?.standings?.[0] ?? []);
      })
      .catch(console.error)
      .finally(() => setStandLoad(false));

    matchApi.byDate(getTodayString())
      .then(({ data }) => {
        const all = (data as { response: ApiFixture[] }).response ?? [];
        setFixtures(all.filter((f) => f.league.id === id));
      })
      .catch(console.error)
      .finally(() => setFixLoad(false));
  }, [id]);

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
          ) : (
            <StandingsTable standings={standings} />
          )}
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <MatchList fixtures={fixtures} isLoading={fixLoad} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
