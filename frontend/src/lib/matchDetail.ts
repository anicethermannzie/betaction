import type { ApiFixture, H2HMatch, MatchOdds } from '@/types';

/**
 * Mappers from match-service (API-Football) payloads to the shapes the
 * prediction detail components expect.
 *
 * These replace lib/mockData.ts's MOCK_DETAIL, which was keyed by three demo
 * fixture IDs (100301-100303). For every real fixture the lookup missed and the
 * "deep analysis" sections silently vanished, so the feature the product
 * advertises effectively did not exist in production.
 *
 * What is NOT here, and why: recent-form lists and per-team shot/possession/
 * corner averages. match-service exposes no endpoint that returns them —
 * /teams/{id}/stats carries season aggregates and a "WDLWW" string, not the
 * opponents, scores and dates FormDisplay needs, and shots/possession live on
 * per-fixture statistics. Those sections were dropped rather than filled with
 * plausible-looking numbers. They can return once match-service exposes a
 * recent-fixtures endpoint.
 */

/** API-Football head-to-head fixtures → H2HMatch[], newest first. */
export function toH2HMatches(fixtures: ApiFixture[] | undefined, limit = 10): H2HMatch[] {
  if (!Array.isArray(fixtures)) return [];

  return fixtures
    .filter((f) => f?.goals?.home !== null && f?.goals?.away !== null)
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
    .slice(0, limit)
    .map((f) => ({
      date: f.fixture.date.slice(0, 10),
      competition: f.league?.name ?? 'Unknown',
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeGoals: f.goals.home as number,
      awayGoals: f.goals.away as number,
    }));
}

// ── Odds ─────────────────────────────────────────────────────────────────────

interface OddsValue { value: string; odd: string }
interface OddsBet { id?: number; name: string; values: OddsValue[] }
interface OddsBookmaker { id?: number; name: string; bets: OddsBet[] }
interface OddsEntry { bookmakers?: OddsBookmaker[] }

/** API-Football names the 1x2 market "Match Winner". */
const MATCH_WINNER_BET = 'match winner';

/**
 * Extract 1x2 odds from the first bookmaker that quotes them.
 *
 * Returns null when no bookmaker has priced the match — common for fixtures far
 * out or in minor competitions. The caller hides the section rather than
 * inventing a price.
 */
export function toMatchOdds(oddsResponse: OddsEntry[] | undefined): MatchOdds | null {
  if (!Array.isArray(oddsResponse)) return null;

  for (const entry of oddsResponse) {
    for (const bookmaker of entry.bookmakers ?? []) {
      const bet = bookmaker.bets?.find((b) => b.name?.toLowerCase() === MATCH_WINNER_BET);
      if (!bet) continue;

      const read = (label: string): number | null => {
        const raw = bet.values?.find((v) => v.value?.toLowerCase() === label)?.odd;
        const parsed = raw === undefined ? NaN : Number.parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 1 ? parsed : null;
      };

      const homeWin = read('home');
      const draw = read('draw');
      const awayWin = read('away');

      // All three are required: a partial market would make the implied-
      // probability comparison misleading.
      if (homeWin !== null && draw !== null && awayWin !== null) {
        return { homeWin, draw, awayWin, bookmaker: bookmaker.name };
      }
    }
  }

  return null;
}
