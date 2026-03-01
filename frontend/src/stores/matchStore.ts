import { create } from 'zustand';
import type { ApiFixture } from '@/types';

interface MatchFilters {
  date: string | null;
  leagueId: number | null;
  status: 'all' | 'live' | 'finished' | 'upcoming';
}

interface MatchState {
  matches:     ApiFixture[];
  liveMatches: ApiFixture[];
  filters:     MatchFilters;
  isLoading:   boolean;
  error:       string | null;

  setMatches:       (matches: ApiFixture[]) => void;
  setLiveMatches:   (matches: ApiFixture[]) => void;
  updateLiveScore:  (fixtureId: number, home: number | null, away: number | null, elapsed: number | null, status: string) => void;
  setFilters:       (filters: Partial<MatchFilters>) => void;
  setLoading:       (loading: boolean) => void;
  setError:         (error: string | null) => void;
  clearMatches:     () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches:     [],
  liveMatches: [],
  filters: {
    date:     null,
    leagueId: null,
    status:   'all',
  },
  isLoading: false,
  error:     null,

  setMatches: (matches) => set({ matches }),
  setLiveMatches: (matches) => set({ liveMatches: matches }),

  updateLiveScore: (fixtureId, home, away, elapsed, status) =>
    set((state) => ({
      liveMatches: state.liveMatches.map((m) =>
        m.fixture.id === fixtureId
          ? {
              ...m,
              goals:   { home, away },
              fixture: { ...m.fixture, status: { ...m.fixture.status, elapsed, short: status } },
            }
          : m
      ),
      matches: state.matches.map((m) =>
        m.fixture.id === fixtureId
          ? {
              ...m,
              goals:   { home, away },
              fixture: { ...m.fixture, status: { ...m.fixture.status, elapsed, short: status } },
            }
          : m
      ),
    })),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setLoading: (isLoading) => set({ isLoading }),
  setError:   (error) => set({ error }),
  clearMatches: () => set({ matches: [], liveMatches: [] }),
}));
