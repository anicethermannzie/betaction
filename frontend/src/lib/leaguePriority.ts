/**
 * League priority system — orders leagues into 5 tiers so the UI can surface
 * the competitions users actually care about first, and tuck the long tail
 * behind a "show more" toggle.
 *
 * Tier resolution is "lowest number wins": a league that appears in more than
 * one config (e.g. the Scottish Premiership is both a top league and a
 * European-clubs league) resolves to the highest-priority tier it belongs to.
 *
 *   1  TIER_1_POPULAR      — the big domestic leagues, always shown first
 *   2  TIER_2_EUROPEAN     — UEFA club competitions
 *   3  TIER_3_EURO_CLUBS   — leagues that field notable European sides
 *   4  USER_FAVORITES      — dynamic, driven by favoritesStore / localStorage
 *   5  OTHERS              — everything else
 */
import type { League } from '@/types';

// ── Config shape ─────────────────────────────────────────────────────────────

export interface PriorityLeague {
  id:      number;
  name:    string;
  country: string;
  flag:    string;
  note?:   string;
}

// ── Tier 1 — popular domestic leagues ────────────────────────────────────────

export const TIER_1_POPULAR: PriorityLeague[] = [
  { id: 39,  name: 'Premier League',       country: 'England',        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga',              country: 'Spain',          flag: '🇪🇸' },
  { id: 135, name: 'Serie A',              country: 'Italy',          flag: '🇮🇹' },
  { id: 78,  name: 'Bundesliga',           country: 'Germany',        flag: '🇩🇪' },
  { id: 61,  name: 'Ligue 1',              country: 'France',         flag: '🇫🇷' },
  { id: 94,  name: 'Liga Portugal',        country: 'Portugal',       flag: '🇵🇹' },
  { id: 88,  name: 'Eredivisie',           country: 'Netherlands',    flag: '🇳🇱' },
  { id: 144, name: 'Austrian Bundesliga',  country: 'Austria',        flag: '🇦🇹' },
  { id: 179, name: 'Scottish Premiership', country: 'Scotland',       flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { id: 197, name: 'Super League',         country: 'Greece',         flag: '🇬🇷' },
  { id: 345, name: 'Czech League',         country: 'Czech Republic', flag: '🇨🇿' },
];

// ── Tier 2 — UEFA club competitions ─────────────────────────────────────────

export const TIER_2_EUROPEAN: PriorityLeague[] = [
  { id: 2,   name: 'UEFA Champions League',  country: 'Europe', flag: '🌟' },
  { id: 3,   name: 'UEFA Europa League',     country: 'Europe', flag: '🟠' },
  { id: 848, name: 'UEFA Conference League', country: 'Europe', flag: '🔵' },
];

// ── Tier 3 — leagues with major European clubs ──────────────────────────────

export const TIER_3_EURO_CLUBS: PriorityLeague[] = [
  { id: 218, name: 'Austrian Bundesliga',  country: 'Austria',        flag: '🇦🇹', note: 'Red Bull Salzburg' },
  { id: 345, name: 'Czech Liga',           country: 'Czech Republic', flag: '🇨🇿', note: 'Slavia Prague' },
  { id: 197, name: 'Super League',         country: 'Greece',         flag: '🇬🇷', note: 'Olympiakos' },
  { id: 179, name: 'Scottish Premiership', country: 'Scotland',       flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', note: 'Rangers & Celtic' },
  { id: 113, name: 'Allsvenskan',          country: 'Sweden',         flag: '🇸🇪' },
  { id: 103, name: 'Eliteserien',          country: 'Norway',         flag: '🇳🇴' },
  { id: 144, name: 'Pro League',           country: 'Belgium',        flag: '🇧🇪' },
];

// ── Tier constants ─────────────────────────────────────────────────────────

export const LEAGUE_TIER = {
  POPULAR:    1,
  EUROPEAN:   2,
  EURO_CLUBS: 3,
  FAVORITES:  4,
  OTHERS:     5,
} as const;

// ── Fast lookups (built once at module load, priority order) ───────────────

const TIER_1_IDS = new Set(TIER_1_POPULAR.map((l) => l.id));
const TIER_2_IDS = new Set(TIER_2_EUROPEAN.map((l) => l.id));
const TIER_3_IDS = new Set(TIER_3_EURO_CLUBS.map((l) => l.id));

// id → flag, first definition wins (tier 1 → 2 → 3)
const FLAG_BY_ID = new Map<number, string>();
for (const l of [...TIER_1_POPULAR, ...TIER_2_EUROPEAN, ...TIER_3_EURO_CLUBS]) {
  if (!FLAG_BY_ID.has(l.id)) FLAG_BY_ID.set(l.id, l.flag);
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Which tier (1–5) a league belongs to. Lowest number wins on overlap.
 * `favoriteLeagueIds` is optional so the spec signature `getLeaguePriority(id)`
 * still works; pass the favorites list to enable tier-4 resolution.
 */
export function getLeaguePriority(
  leagueId: number,
  favoriteLeagueIds: number[] = [],
): number {
  if (TIER_1_IDS.has(leagueId)) return LEAGUE_TIER.POPULAR;
  if (TIER_2_IDS.has(leagueId)) return LEAGUE_TIER.EUROPEAN;
  if (TIER_3_IDS.has(leagueId)) return LEAGUE_TIER.EURO_CLUBS;
  if (favoriteLeagueIds.includes(leagueId)) return LEAGUE_TIER.FAVORITES;
  return LEAGUE_TIER.OTHERS;
}

/** Sort leagues by priority tier, then alphabetically within a tier. */
export function sortLeagues<T extends League>(
  leagues: T[],
  favoriteLeagueIds: number[] = [],
): T[] {
  return [...leagues].sort((a, b) => {
    const pa = getLeaguePriority(a.id, favoriteLeagueIds);
    const pb = getLeaguePriority(b.id, favoriteLeagueIds);
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });
}

/** Human label for a tier separator. */
export function getLeagueTierLabel(tier: number): string {
  switch (tier) {
    case LEAGUE_TIER.POPULAR:    return 'Top Leagues';
    case LEAGUE_TIER.EUROPEAN:   return 'European Competitions';
    case LEAGUE_TIER.EURO_CLUBS: return 'European Clubs';
    case LEAGUE_TIER.FAVORITES:  return 'Your Favorites';
    default:                     return 'More Leagues';
  }
}

/** Label with the emoji the matches page uses in front of tier separators. */
export function getLeagueTierHeading(tier: number): string {
  switch (tier) {
    case LEAGUE_TIER.POPULAR:    return '🏆 Top Leagues';
    case LEAGUE_TIER.EUROPEAN:   return '⭐ European Competitions';
    case LEAGUE_TIER.EURO_CLUBS: return '🌍 European Clubs';
    case LEAGUE_TIER.FAVORITES:  return '❤️ Your Favorites';
    default:                     return 'More Leagues';
  }
}

/** True when the league is one of the tier-1 popular domestic leagues. */
export function isPopularLeague(leagueId: number): boolean {
  return TIER_1_IDS.has(leagueId);
}

/** Best-known flag emoji for a league id, or a neutral ⚽ fallback. */
export function getLeagueFlag(leagueId: number): string {
  return FLAG_BY_ID.get(leagueId) ?? '⚽';
}
