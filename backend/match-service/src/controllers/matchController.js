const apiFootballService = require('../services/apiFootballService');
const cacheKeys = require('../utils/cacheKeys');
const { CLUB_LEAGUES, INTERNATIONAL_COMPETITIONS, ALL_LEAGUES } = require('../config/leagues');

const CLUB_LEAGUE_IDS = new Set(CLUB_LEAGUES.map(l => l.id));
const INTERNATIONAL_COMPETITION_IDS = new Set(INTERNATIONAL_COMPETITIONS.map(l => l.id));

/**
 * Set req.cacheKey before the cache middleware writes the response.
 * Using explicit keys (rather than req.originalUrl) gives us:
 *   - Normalised h2h keys (team order-independent)
 *   - Season-aware standing/stats keys
 */

const matchController = {
  /**
   * GET /matches/live
   */
  getLiveMatches: async (req, res) => {
    try {
      req.cacheKey = cacheKeys.liveMatches();
      const data = await apiFootballService.getLiveMatches();
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getLiveMatches]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch live matches' });
    }
  },

  /**
   * GET /matches/date/:date
   * :date must be YYYY-MM-DD
   * Group response by competition type: { "club": [...], "international": [...] }
   */
  getMatchesByDate: async (req, res) => {
    try {
      const { date } = req.params;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      }

      req.cacheKey = cacheKeys.matchesByDate(date);
      const data = await apiFootballService.getMatchesByDate(date);
      
      const club = [];
      const international = [];

      if (data && data.response) {
        for (const match of data.response) {
          const leagueId = match.league?.id;
          if (CLUB_LEAGUE_IDS.has(leagueId)) {
            match.competition_type = 'club';
            club.push(match);
          } else if (INTERNATIONAL_COMPETITION_IDS.has(leagueId)) {
            match.competition_type = 'international';
            international.push(match);
          }
        }
      }

      return res.status(200).json({
        success: true,
        club,
        international
      });
    } catch (err) {
      console.error('[matchController.getMatchesByDate]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch matches for date' });
    }
  },

  /**
   * GET /matches/:id
   */
  getMatchById: async (req, res) => {
    try {
      const { id } = req.params;
      req.cacheKey = cacheKeys.matchById(id);
      const data = await apiFootballService.getMatchById(id);

      if (!data.response?.length) {
        return res.status(404).json({ error: 'Match not found' });
      }

      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getMatchById]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch match' });
    }
  },

  /**
   * GET /matches/:id/odds
   */
  getMatchOdds: async (req, res) => {
    try {
      const { id } = req.params;
      req.cacheKey = cacheKeys.matchOdds(id);
      const data = await apiFootballService.getMatchOdds(id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getMatchOdds]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch match odds' });
    }
  },

  /**
   * GET /matches/:id/statistics
   */
  getMatchStatistics: async (req, res) => {
    try {
      const { id } = req.params;
      req.cacheKey = cacheKeys.matchStatistics(id);
      const data = await apiFootballService.getMatchStatistics(id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getMatchStatistics]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch match statistics' });
    }
  },

  /**
   * GET /leagues/:leagueId/standings
   * Query param: ?season=2024  (defaults to current year)
   */
  getStandings: async (req, res) => {
    try {
      const { leagueId } = req.params;
      const season = req.query.season || new Date().getFullYear();
      req.cacheKey = cacheKeys.standings(leagueId, season);
      const data = await apiFootballService.getStandings(leagueId, season);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getStandings]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch standings' });
    }
  },

  /**
   * GET /teams/:teamId/stats
   * Query params: ?league=39&season=2024  (season defaults to current year)
   */
  getTeamStats: async (req, res) => {
    try {
      const { teamId } = req.params;
      const { league: leagueId, season = new Date().getFullYear() } = req.query;

      if (!leagueId) {
        return res.status(400).json({ error: 'Query param "league" is required' });
      }

      req.cacheKey = cacheKeys.teamStats(teamId, leagueId, season);
      const data = await apiFootballService.getTeamStats(leagueId, season, teamId);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getTeamStats]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch team stats' });
    }
  },

  /**
   * GET /matches/h2h/:team1Id/:team2Id
   */
  getHeadToHead: async (req, res) => {
    try {
      const { team1Id, team2Id } = req.params;
      // Normalised key regardless of param order
      req.cacheKey = cacheKeys.headToHead(team1Id, team2Id);
      const data = await apiFootballService.getHeadToHead(team1Id, team2Id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getHeadToHead]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch head-to-head data' });
    }
  },

  /**
   * GET /matches/international
   * GET /matches/international/:date
   */
  getInternationalMatches: async (req, res) => {
    try {
      const date = req.params.date || new Date().toISOString().split('T')[0];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      }

      const data = await apiFootballService.fetchInternationalMatches(date);
      if (data && data.response) {
        data.response.forEach(match => {
          match.competition_type = 'international';
        });
      }
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getInternationalMatches]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch international matches' });
    }
  },

  /**
   * GET /matches/clubs
   * GET /matches/clubs/:date
   */
  getClubMatches: async (req, res) => {
    try {
      const date = req.params.date || new Date().toISOString().split('T')[0];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      }

      const data = await apiFootballService.fetchMatchesByCompetitionType(date, 'club');
      if (data && data.response) {
        data.response.forEach(match => {
          match.competition_type = 'club';
        });
      }
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      console.error('[matchController.getClubMatches]', err.message);
      return res.status(err.status || 502).json({ error: 'Failed to fetch club matches' });
    }
  },

  /**
   * GET /leagues
   */
  getLeagues: async (req, res) => {
    try {
      return res.status(200).json({ success: true, leagues: ALL_LEAGUES });
    } catch (err) {
      console.error('[matchController.getLeagues]', err.message);
      return res.status(500).json({ error: 'Failed to fetch leagues' });
    }
  },

  /**
   * GET /leagues/international
   */
  getInternationalLeagues: async (req, res) => {
    try {
      return res.status(200).json({ success: true, leagues: INTERNATIONAL_COMPETITIONS });
    } catch (err) {
      console.error('[matchController.getInternationalLeagues]', err.message);
      return res.status(500).json({ error: 'Failed to fetch international leagues' });
    }
  },

  /**
   * GET /leagues/clubs
   */
  getClubLeagues: async (req, res) => {
    try {
      return res.status(200).json({ success: true, leagues: CLUB_LEAGUES });
    } catch (err) {
      console.error('[matchController.getClubLeagues]', err.message);
      return res.status(500).json({ error: 'Failed to fetch club leagues' });
    }
  },
};

module.exports = matchController;
