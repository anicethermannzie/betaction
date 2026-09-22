const apiFootballService = require('../services/apiFootballService');
const logger = require('../utils/logger');
const { calculateMomentum } = require('../services/momentumCalculator');
const { trackOddsSnapshot } = require('../services/oddsTracker');
const { CLUB_LEAGUES, INTERNATIONAL_COMPETITIONS, ALL_LEAGUES } = require('../config/leagues');

/**
 * Extract 1x2 odds from the first bookmaker that quotes the Match Winner
 * market. Mirrors frontend/src/lib/matchDetail.ts's toMatchOdds — kept as a
 * separate implementation because one runs server-side in JS and the other
 * client-side in TS, but the two must stay in sync if API-Football's odds
 * shape ever changes.
 */
function extractMatchWinnerOdds(oddsResponse) {
  for (const entry of oddsResponse || []) {
    for (const bookmaker of entry.bookmakers || []) {
      const bet = (bookmaker.bets || []).find((b) => (b.name || '').toLowerCase() === 'match winner');
      if (!bet) continue;

      const read = (label) => {
        const raw = (bet.values || []).find((v) => (v.value || '').toLowerCase() === label)?.odd;
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 1 ? parsed : null;
      };

      const home = read('home');
      const draw = read('draw');
      const away = read('away');
      if (home !== null && draw !== null && away !== null) {
        return { home_odds: home, draw_odds: draw, away_odds: away, bookmaker: bookmaker.name };
      }
    }
  }
  return null;
}

const CLUB_LEAGUE_IDS = new Set(CLUB_LEAGUES.map(l => l.id));
const INTERNATIONAL_COMPETITION_IDS = new Set(INTERNATIONAL_COMPETITIONS.map(l => l.id));

/**
 * Cache keys are declared per route in routes/matchRoutes.js and resolved by the
 * cache middleware before these handlers run. Controllers stay unaware of caching.
 */

const matchController = {
  /**
   * GET /matches/live
   */
  getLiveMatches: async (req, res) => {
    try {
      const data = await apiFootballService.getLiveMatches();
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getLiveMatches', error: err.message });
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
      logger.error('Upstream request failed', { handler: 'getMatchesByDate', error: err.message });
      return res.status(err.status || 502).json({ error: 'Failed to fetch matches for date' });
    }
  },

  /**
   * GET /matches/:id
   */
  getMatchById: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await apiFootballService.getMatchById(id);

      if (!data.response?.length) {
        return res.status(404).json({ error: 'Match not found' });
      }

      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getMatchById', error: err.message });
      return res.status(err.status || 502).json({ error: 'Failed to fetch match' });
    }
  },

  /**
   * GET /matches/:id/odds
   */
  getMatchOdds: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await apiFootballService.getMatchOdds(id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getMatchOdds', error: err.message });
      return res.status(err.status || 502).json({ error: 'Failed to fetch match odds' });
    }
  },

  /**
   * GET /matches/:id/statistics
   */
  getMatchStatistics: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await apiFootballService.getMatchStatistics(id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getMatchStatistics', error: err.message });
      return res.status(err.status || 502).json({ error: 'Failed to fetch match statistics' });
    }
  },

  /**
   * GET /matches/:id/events
   * Chronological goals/cards/substitutions/VAR log for a fixture.
   */
  getMatchEvents: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await apiFootballService.getMatchEvents(id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getMatchEvents', error: err.message });
      return res.status(err.status || 502).json({ error: 'Failed to fetch match events' });
    }
  },

  /**
   * GET /matches/:id/momentum
   * Minute-by-minute momentum built from real goal/card timestamps — see
   * services/momentumCalculator.js for why shots/corners are not included.
   */
  getMatchMomentum: async (req, res) => {
    try {
      const { id } = req.params;

      const [fixtureData, eventsData] = await Promise.all([
        apiFootballService.getMatchById(id),
        apiFootballService.getMatchEvents(id),
      ]);

      const fixture = fixtureData.response?.[0];
      if (!fixture) {
        return res.status(404).json({ error: 'Match not found' });
      }

      const currentMinute = fixture.fixture?.status?.elapsed ?? 0;
      const teams = {
        homeTeamId: fixture.teams?.home?.id,
        awayTeamId: fixture.teams?.away?.id,
      };

      const momentum = calculateMomentum(eventsData.response, null, currentMinute, teams);
      return res.status(200).json({ success: true, ...momentum });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getMatchMomentum', error: err.message });
      return res.status(err.status || 502).json({ error: 'Failed to compute match momentum' });
    }
  },

  /**
   * GET /matches/:id/odds/live
   * Current 1x2 odds plus movement since the last poll — see services/oddsTracker.js.
   */
  getLiveOdds: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await apiFootballService.getMatchOdds(id);
      const odds = extractMatchWinnerOdds(data.response);

      if (!odds) {
        return res.status(404).json({ error: 'No odds available for this match yet' });
      }

      const movement = await trackOddsSnapshot(id, odds);

      return res.status(200).json({
        success: true,
        home_odds: odds.home_odds,
        draw_odds: odds.draw_odds,
        away_odds: odds.away_odds,
        bookmaker: odds.bookmaker,
        movement,
        last_updated: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getLiveOdds', error: err.message });
      return res.status(err.status || 502).json({ error: 'Failed to fetch live odds' });
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
      const data = await apiFootballService.getStandings(leagueId, season);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getStandings', error: err.message });
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

      const data = await apiFootballService.getTeamStats(leagueId, season, teamId);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getTeamStats', error: err.message });
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
      const data = await apiFootballService.getHeadToHead(team1Id, team2Id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      logger.error('Upstream request failed', { handler: 'getHeadToHead', error: err.message });
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
      logger.error('Upstream request failed', { handler: 'getInternationalMatches', error: err.message });
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
      logger.error('Upstream request failed', { handler: 'getClubMatches', error: err.message });
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
      logger.error('Upstream request failed', { handler: 'getLeagues', error: err.message });
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
      logger.error('Upstream request failed', { handler: 'getInternationalLeagues', error: err.message });
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
      logger.error('Upstream request failed', { handler: 'getClubLeagues', error: err.message });
      return res.status(500).json({ error: 'Failed to fetch club leagues' });
    }
  },
};

module.exports = matchController;
