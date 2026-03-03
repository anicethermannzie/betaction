'use client';

import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';

import { matchApi, predictionApi } from '@/lib/api';
import { getTodayString, isMatchInProgress } from '@/lib/utils';

import { DatePicker }   from '@/components/matches/DatePicker';
import { MatchFilters } from '@/components/matches/MatchFilters';
import { MatchList }    from '@/components/matches/MatchList';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

import type { ApiFixture, Prediction } from '@/types';
import type { StatusFilter } from '@/components/matches/MatchFilters';

// ── Skeleton shown while Suspense resolves ────────────────────────────────────

function MatchesPageSkeleton() {
  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-5">
      <div className="h-7 w-32 bg-muted rounded-md animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="match" />
        ))}
      </div>
    </div>
  );
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function MatchesContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const todayStr     = getTodayString();

  // Read initial state from URL
  const initialDate   = searchParams.get('date')   ?? todayStr;
  const initialLeague = searchParams.get('league')  ? Number(searchParams.get('league')) : null;
  const initialStatus = (searchParams.get('status') ?? 'all') as StatusFilter;

  const [date,    setDate]    = useState(initialDate);
  const [league,  setLeague]  = useState<number | null>(initialLeague);
  const [status,  setStatus]  = useState<StatusFilter>(initialStatus);

  const [fixtures,    setFixtures]    = useState<ApiFixture[]>([]);
  const [predictions, setPredictions] = useState<Map<number, Prediction>>(new Map());
  const [isLoading,   setIsLoading]   = useState(true);

  // ── URL sync helper ──────────────────────────────────────────────────────────
  const updateParams = useCallback(
    (updates: { date?: string; league?: number | null; status?: StatusFilter }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.date !== undefined) {
        updates.date === todayStr ? params.delete('date') : params.set('date', updates.date);
      }
      if (updates.league !== undefined) {
        updates.league === null ? params.delete('league') : params.set('league', String(updates.league));
      }
      if (updates.status !== undefined) {
        updates.status === 'all' ? params.delete('status') : params.set('status', updates.status);
      }

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '/matches', { scroll: false });
    },
    [router, searchParams, todayStr]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDateChange = (d: string) => {
    setDate(d);
    updateParams({ date: d });
  };

  const handleLeagueChange = (id: number | null) => {
    setLeague(id);
    updateParams({ league: id });
  };

  const handleStatusChange = (s: StatusFilter) => {
    setStatus(s);
    updateParams({ status: s });
  };

  // ── Data fetch on date change ─────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);

    const isToday = date === todayStr;

    Promise.allSettled([
      matchApi.byDate(date),
      isToday ? predictionApi.today() : Promise.resolve(null),
    ]).then(([matchRes, predRes]) => {
      if (matchRes.status === 'fulfilled') {
        const d = matchRes.value.data;
        setFixtures(Array.isArray(d?.response) ? d.response : []);
      }

      if (predRes.status === 'fulfilled' && predRes.value !== null) {
        const d = predRes.value.data;
        const list: Prediction[] = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setPredictions(new Map(list.map((p) => [p.fixture_id, p])));
      } else {
        setPredictions(new Map());
      }
    }).finally(() => setIsLoading(false));
  }, [date, todayStr]);

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = fixtures;

    if (league !== null) {
      list = list.filter((f) => f.league.id === league);
    }

    if (status === 'live') {
      list = list.filter((f) => isMatchInProgress(f.fixture.status.short));
    } else if (status === 'upcoming') {
      list = list.filter((f) => f.fixture.status.short === 'NS');
    } else if (status === 'finished') {
      list = list.filter((f) => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short));
    }

    return list;
  }, [fixtures, league, status]);

  // ── Live count (for red dot in MatchFilters) ───────────────────────────────
  const liveCount = useMemo(
    () => fixtures.filter((f) => isMatchInProgress(f.fixture.status.short)).length,
    [fixtures]
  );

  // ── Context-aware empty message ────────────────────────────────────────────
  const emptyMessage = useMemo(() => {
    const dateLabel = date === todayStr ? 'today' : `on ${format(parseISO(date), 'MMMM d')}`;

    if (status === 'live') {
      return 'No live matches right now — check upcoming matches.';
    }
    if (league !== null) {
      const leagueName = filtered.length === 0 && fixtures.find((f) => f.league.id === league)?.league.name;
      return leagueName
        ? `No ${leagueName} matches ${dateLabel}.`
        : `No matches from this league ${dateLabel}.`;
    }
    return `No matches scheduled ${dateLabel}.`;
  }, [status, league, date, todayStr, filtered.length, fixtures]);

  // ── Header subtitle ────────────────────────────────────────────────────────
  const subtitle = useMemo(() => {
    const dateLabel =
      date === todayStr ? 'Today' : format(parseISO(date), 'EEE, MMM d');
    const count = isLoading ? '' : ` · ${fixtures.length} match${fixtures.length !== 1 ? 'es' : ''}`;
    return `${dateLabel}${count}`;
  }, [date, todayStr, fixtures.length, isLoading]);

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      {/* ── Page header ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {/* ── Sticky filter bar ── */}
      <div className="sticky top-14 z-40 -mx-4 px-4 md:-mx-6 md:px-6 pb-3 pt-1 bg-background/90 backdrop-blur-sm border-b border-border/40 space-y-3 mb-5">
        <DatePicker selectedDate={date} onChange={handleDateChange} />
        <MatchFilters
          selectedLeague={league}
          selectedStatus={status}
          liveCount={liveCount}
          onLeagueChange={handleLeagueChange}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* ── Match list ── */}
      <MatchList
        fixtures={filtered}
        isLoading={isLoading}
        groupByLeague
        collapsible
        emptyMessage={emptyMessage}
        predictions={predictions}
      />
    </div>
  );
}

// ── Page export (Suspense wrapper required for useSearchParams) ───────────────

export default function MatchesPage() {
  return (
    <Suspense fallback={<MatchesPageSkeleton />}>
      <MatchesContent />
    </Suspense>
  );
}
