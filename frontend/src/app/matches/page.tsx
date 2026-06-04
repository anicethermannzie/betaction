'use client';

import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';

import { matchApi, predictionApi } from '@/lib/api';
import { getTodayString, isMatchInProgress, cn } from '@/lib/utils';

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
  const initialCompType = (searchParams.get('competition_type') ?? 'all') as 'all' | 'club' | 'international';

  const [date,    setDate]    = useState(initialDate);
  const [league,  setLeague]  = useState<number | null>(initialLeague);
  const [status,  setStatus]  = useState<StatusFilter>(initialStatus);
  const [compType, setCompType] = useState<'all' | 'club' | 'international'>(initialCompType);

  const [fixtures,    setFixtures]    = useState<ApiFixture[]>([]);
  const [predictions, setPredictions] = useState<Map<number, Prediction>>(new Map());
  const [isLoading,   setIsLoading]   = useState(true);

  // ── URL sync helper ──────────────────────────────────────────────────────────
  const updateParams = useCallback(
    (updates: { date?: string; league?: number | null; status?: StatusFilter; competition_type?: 'all' | 'club' | 'international' }) => {
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
      if (updates.competition_type !== undefined) {
        updates.competition_type === 'all' ? params.delete('competition_type') : params.set('competition_type', updates.competition_type);
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
        let list = [];
        if (d) {
          if (Array.isArray(d.response)) {
            list = d.response;
          } else {
            const clubList = Array.isArray(d.club) ? d.club : [];
            const intList = Array.isArray(d.international) ? d.international : [];
            list = [...clubList, ...intList];
          }
        }
        setFixtures(list);
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

    if (compType === 'club') {
      list = list.filter((f) => (f as any).competition_type === 'club' || !(f as any).competition_type);
    } else if (compType === 'international') {
      list = list.filter((f) => (f as any).competition_type === 'international');
    }

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
  }, [fixtures, compType, league, status]);

  // Dynamically compute the leagues present in today's fixtures
  const leagueOptions = useMemo(() => {
    const leaguesMap = new Map<number, { id: number; name: string; flag: string }>();
    fixtures.forEach((f) => {
      const isClub = (f as any).competition_type === 'club' || !(f as any).competition_type;
      const isInt = (f as any).competition_type === 'international';
      if (compType === 'club' && !isClub) return;
      if (compType === 'international' && !isInt) return;

      if (!leaguesMap.has(f.league.id)) {
        let flag = '⚽';
        if (f.league.id === 39) flag = '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
        else if (f.league.id === 140) flag = '🇪🇸';
        else if (f.league.id === 135) flag = '🇮🇹';
        else if (f.league.id === 78) flag = '🇩🇪';
        else if (f.league.id === 61) flag = '🇫🇷';
        else if (f.league.id === 2) flag = '🏆';
        else if (f.league.id === 3) flag = '🇪🇺';
        else if (f.league.id === 253) flag = '🇺🇸';
        else if (f.league.id === 88) flag = '🇳🇱';
        else if (f.league.id === 94) flag = '🇵🇹';
        else if (f.league.id === 71) flag = '🇧🇷';
        else if (f.league.id === 1) flag = '🌍';
        else if (f.league.id === 4) flag = '🇪🇺';
        else if (f.league.id === 9) flag = '🌎';
        else if (f.league.id === 6) flag = '🌍';
        else if (f.league.id === 7) flag = '🌎';
        else if (f.league.id === 10) flag = '🤝';
        else if ([32, 33, 34, 35, 36, 481].includes(f.league.id)) flag = '🏳️';
        
        leaguesMap.set(f.league.id, {
          id: f.league.id,
          name: f.league.name,
          flag,
        });
      }
    });

    return [
      { id: null as number | null, name: 'All Leagues', flag: '🌍' },
      ...Array.from(leaguesMap.values()),
    ];
  }, [fixtures, compType]);

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
        
        {/* Competition Type Tabs */}
        <div className="flex gap-1 border-b border-slate-800 pb-2">
          {(['all', 'club', 'international'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setCompType(tab);
                setLeague(null);
                updateParams({ league: null, competition_type: tab });
              }}
              className={cn(
                'px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all active:scale-95',
                compType === tab
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <MatchFilters
          selectedLeague={league}
          selectedStatus={status}
          liveCount={liveCount}
          onLeagueChange={handleLeagueChange}
          onStatusChange={handleStatusChange}
          leagueOptions={leagueOptions}
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
