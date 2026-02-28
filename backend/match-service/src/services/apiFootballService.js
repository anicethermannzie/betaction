const apiFootball = require('../config/apiFootball');

/**
 * All API-Football v3 calls are centralised here.
 * Controllers never import the axios instance directly.
 *
 * Every method returns the full parsed response body from API-Football
 * (including `response`, `results`, `paging` fields) so controllers can
 * forward it as-is or reshape it as needed.
 */

const apiFootballService = {
  /**
   * GET /fixtures?live=all
   * Returns all currently live fixtures across all leagues.
   */
  getLiveMatches: async () => {
    const { data } = await apiFootball.get('/fixtures', {
      params: { live: 'all' },
    });
    return data;
  },

  /**
   * GET /fixtures?date=YYYY-MM-DD
   * Returns all fixtures scheduled for a given date.
   * @param {string} date - Format: YYYY-MM-DD
   */
  getMatchesByDate: async (date) => {
    const { data } = await apiFootball.get('/fixtures', {
      params: { date },
    });
    return data;
  },

  /**
   * GET /fixtures?id={fixtureId}
   * Returns details for a single fixture.
   * @param {string|number} fixtureId
   */
  getMatchById: async (fixtureId) => {
    const { data } = await apiFootball.get('/fixtures', {
      params: { id: fixtureId },
    });
    return data;
  },

  /**
   * GET /standings?league={leagueId}&season={season}
   * Returns the full standings table for a league season.
   * @param {string|number} leagueId
   * @param {string|number} season - 4-digit year, e.g. 2024
   */
  getStandings: async (leagueId, season) => {
    const { data } = await apiFootball.get('/standings', {
      params: { league: leagueId, season },
    });
    return data;
  },

  /**
   * GET /teams/statistics?league={leagueId}&season={season}&team={teamId}
   * Returns aggregated statistics for a team within a league season.
   * @param {string|number} leagueId
   * @param {string|number} season
   * @param {string|number} teamId
   */
  getTeamStats: async (leagueId, season, teamId) => {
    const { data } = await apiFootball.get('/teams/statistics', {
      params: { league: leagueId, season, team: teamId },
    });
    return data;
  },

  /**
   * GET /fixtures/headtohead?h2h={team1Id}-{team2Id}
   * Returns the historical head-to-head fixture list between two teams.
   * @param {string|number} team1Id
   * @param {string|number} team2Id
   */
  getHeadToHead: async (team1Id, team2Id) => {
    const { data } = await apiFootball.get('/fixtures/headtohead', {
      params: { h2h: `${team1Id}-${team2Id}` },
    });
    return data;
  },

  /**
   * GET /odds?fixture={fixtureId}
   * Returns bookmaker odds for a fixture.
   * @param {string|number} fixtureId
   */
  getMatchOdds: async (fixtureId) => {
    const { data } = await apiFootball.get('/odds', {
      params: { fixture: fixtureId },
    });
    return data;
  },

  /**
   * GET /fixtures/statistics?fixture={fixtureId}
   * Returns detailed in-match statistics (shots, possession, passes, etc.).
   * @param {string|number} fixtureId
   */
  getMatchStatistics: async (fixtureId) => {
    const { data } = await apiFootball.get('/fixtures/statistics', {
      params: { fixture: fixtureId },
    });
    return data;
  },
};

module.exports = apiFootballService;
