/**
 * Centralized cache key generators.
 * Keys mirror the route paths so req.originalUrl can be used directly
 * by the cache middleware, but these helpers are also available for
 * manual cache invalidation (e.g. from cron jobs or admin scripts).
 *
 * Convention: all keys are prefixed with "cache:" to namespace them
 * cleanly inside Redis alongside any future non-cache keys.
 */

const cacheKeys = {
  /** Live matches — refreshed by cron every 30s */
  liveMatches: () => 'cache:/matches/live',

  /** All fixtures for a given date (YYYY-MM-DD) */
  matchesByDate: (date) => `cache:/matches/date/${date}`,

  /** Single fixture details */
  matchById: (id) => `cache:/matches/${id}`,

  /** Pre-match odds for a fixture */
  matchOdds: (id) => `cache:/matches/${id}/odds`,

  /** In-match or post-match statistics */
  matchStatistics: (id) => `cache:/matches/${id}/statistics`,

  /** League standings — key includes season so they don't collide year-on-year */
  standings: (leagueId, season) => `cache:/leagues/${leagueId}/standings/${season}`,

  /** Team statistics within a league season */
  teamStats: (teamId, leagueId, season) => `cache:/teams/${teamId}/stats/${leagueId}/${season}`,

  /**
   * Head-to-head history.
   * Team IDs are sorted so h2h(33,34) === h2h(34,33).
   */
  headToHead: (team1Id, team2Id) => {
    const [a, b] = [Number(team1Id), Number(team2Id)].sort((x, y) => x - y);
    return `cache:/matches/h2h/${a}/${b}`;
  },
};

module.exports = cacheKeys;
