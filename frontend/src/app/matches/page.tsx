'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MatchList } from '@/components/matches/MatchList';
import { LeagueSelector } from '@/components/leagues/LeagueSelector';
import { SearchBar } from '@/components/common/SearchBar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { matchApi } from '@/lib/api';
import { getTodayString } from '@/lib/utils';
import type { ApiFixture } from '@/types';

export default function MatchesPage() {
  const [date, setDate]           = useState(getTodayString());
  const [fixtures, setFixtures]   = useState<ApiFixture[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [leagueId, setLeagueId]   = useState<number | undefined>(undefined);
  const [query, setQuery]         = useState('');

  useEffect(() => {
    setLoading(true);
    matchApi.byDate(date)
      .then(({ data }) => setFixtures((data as { response: ApiFixture[] }).response ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  const filtered = useMemo(() => {
    let list = fixtures;
    if (leagueId) list = list.filter((f) => f.league.id === leagueId);
    if (statusFilter === 'live')     list = list.filter((f) => ['1H','2H','HT','ET','P'].includes(f.fixture.status.short));
    if (statusFilter === 'finished') list = list.filter((f) => ['FT','AET','PEN'].includes(f.fixture.status.short));
    if (statusFilter === 'upcoming') list = list.filter((f) => f.fixture.status.short === 'NS');
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) => f.teams.home.name.toLowerCase().includes(q) || f.teams.away.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [fixtures, leagueId, statusFilter, query]);

  const prevDay  = useCallback(() => setDate((d) => format(subDays(parseISO(d), 1), 'yyyy-MM-dd')), []);
  const nextDay  = useCallback(() => setDate((d) => format(addDays(parseISO(d), 1), 'yyyy-MM-dd')), []);
  const today    = getTodayString();
  const dateLabel = date === today ? 'Today' : format(parseISO(date), 'EEE, MMM d');

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Matches</h1>

        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevDay} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={date === today ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDate(today)}
            className="min-w-[100px]"
          >
            {dateLabel}
          </Button>
          <Button variant="outline" size="icon" onClick={nextDay} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Status tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatus(v as typeof statusFilter)}>
          <TabsList className="h-8">
            <TabsTrigger value="all"      className="text-xs px-3">All</TabsTrigger>
            <TabsTrigger value="live"     className="text-xs px-3">Live</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs px-3">Upcoming</TabsTrigger>
            <TabsTrigger value="finished" className="text-xs px-3">Finished</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* League filter */}
        <LeagueSelector selectedId={leagueId} onChange={setLeagueId} />

        {/* Search */}
        <SearchBar onSearch={setQuery} placeholder="Search team…" />
      </div>

      <MatchList fixtures={filtered} isLoading={loading} groupByLeague />
    </div>
  );
}
