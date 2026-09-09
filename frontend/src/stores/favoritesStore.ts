import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { League, Team } from '@/types';
import { MOCK_FAVORITE_LEAGUES } from '@/lib/mockData';

// ── State shape ───────────────────────────────────────────────────────────────

interface FavoritesState {
  favoriteLeagues:       number[];   // league IDs (source of truth for lookups)
  favoriteTeams:         number[];   // team IDs
  favoriteLeagueDetails: League[];   // full objects, for rendering pills/cards
  favoriteTeamDetails:   Team[];

  // ── Leagues ──
  addFavoriteLeague:    (leagueId: number, league: League) => void;
  removeFavoriteLeague: (leagueId: number) => void;
  toggleFavoriteLeague: (leagueId: number, league: League) => void;
  isLeagueFavorite:     (leagueId: number) => boolean;

  // ── Teams ──
  addFavoriteTeam:    (teamId: number, team: Team) => void;
  removeFavoriteTeam: (teamId: number) => void;
  toggleFavoriteTeam: (teamId: number, team: Team) => void;
  isTeamFavorite:     (teamId: number) => boolean;

  clearAllFavorites: () => void;
}

// ── Demo seed ─────────────────────────────────────────────────────────────────
// Pre-favorited leagues so the favorites UI is visible on a fresh browser.
// Once localStorage has been written once, the persisted value takes over.
// Remove these defaults in production — demo only.
const SEED_LEAGUES: League[] = MOCK_FAVORITE_LEAGUES;

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteLeagues:       SEED_LEAGUES.map((l) => l.id),
      favoriteTeams:         [],
      favoriteLeagueDetails: SEED_LEAGUES,
      favoriteTeamDetails:   [],

      // ── Leagues ──────────────────────────────────────────────────────────
      addFavoriteLeague: (leagueId, league) =>
        set((state) => {
          if (state.favoriteLeagues.includes(leagueId)) return state;
          return {
            favoriteLeagues:       [...state.favoriteLeagues, leagueId],
            favoriteLeagueDetails: [...state.favoriteLeagueDetails, { ...league, id: leagueId }],
          };
        }),

      removeFavoriteLeague: (leagueId) =>
        set((state) => ({
          favoriteLeagues:       state.favoriteLeagues.filter((id) => id !== leagueId),
          favoriteLeagueDetails: state.favoriteLeagueDetails.filter((l) => l.id !== leagueId),
        })),

      toggleFavoriteLeague: (leagueId, league) =>
        get().isLeagueFavorite(leagueId)
          ? get().removeFavoriteLeague(leagueId)
          : get().addFavoriteLeague(leagueId, league),

      isLeagueFavorite: (leagueId) => get().favoriteLeagues.includes(leagueId),

      // ── Teams ────────────────────────────────────────────────────────────
      addFavoriteTeam: (teamId, team) =>
        set((state) => {
          if (state.favoriteTeams.includes(teamId)) return state;
          return {
            favoriteTeams:       [...state.favoriteTeams, teamId],
            favoriteTeamDetails: [...state.favoriteTeamDetails, { ...team, id: teamId }],
          };
        }),

      removeFavoriteTeam: (teamId) =>
        set((state) => ({
          favoriteTeams:       state.favoriteTeams.filter((id) => id !== teamId),
          favoriteTeamDetails: state.favoriteTeamDetails.filter((t) => t.id !== teamId),
        })),

      toggleFavoriteTeam: (teamId, team) =>
        get().isTeamFavorite(teamId)
          ? get().removeFavoriteTeam(teamId)
          : get().addFavoriteTeam(teamId, team),

      isTeamFavorite: (teamId) => get().favoriteTeams.includes(teamId),

      clearAllFavorites: () =>
        set({
          favoriteLeagues:       [],
          favoriteTeams:         [],
          favoriteLeagueDetails: [],
          favoriteTeamDetails:   [],
        }),
    }),
    {
      name: 'betaction_favorites',
      partialize: (state) => ({
        favoriteLeagues:       state.favoriteLeagues,
        favoriteTeams:         state.favoriteTeams,
        favoriteLeagueDetails: state.favoriteLeagueDetails,
        favoriteTeamDetails:   state.favoriteTeamDetails,
      }),
    },
  ),
);
