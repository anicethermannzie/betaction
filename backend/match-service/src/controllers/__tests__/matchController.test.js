const matchController = require('../matchController');
const apiFootballService = require('../../services/apiFootballService');
const oddsTracker = require('../../services/oddsTracker');

jest.mock('../../services/apiFootballService');
jest.mock('../../services/oddsTracker');

describe('matchController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getMatchesByDate', () => {
    test('groups matches into club and international lists', async () => {
      req.params.date = '2026-06-04';
      apiFootballService.getMatchesByDate.mockResolvedValue({
        response: [
          { fixture: { id: 101 }, league: { id: 39, name: 'Premier League' } }, // Club (39)
          { fixture: { id: 102 }, league: { id: 1, name: 'FIFA World Cup' } },   // International (1)
          { fixture: { id: 103 }, league: { id: 999, name: 'Unsupported League' } } // Unsupported
        ]
      });

      await matchController.getMatchesByDate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        club: [
          expect.objectContaining({
            fixture: { id: 101 },
            competition_type: 'club'
          })
        ],
        international: [
          expect.objectContaining({
            fixture: { id: 102 },
            competition_type: 'international'
          })
        ]
      }));
    });

    test('returns 400 for invalid date format', async () => {
      req.params.date = 'invalid-date';

      await matchController.getMatchesByDate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    });
  });

  describe('getLeagues endpoints', () => {
    test('getLeagues returns all leagues', async () => {
      await matchController.getLeagues(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        leagues: expect.any(Array)
      }));
    });
  });

  describe('getMatchEvents', () => {
    test('forwards the raw events envelope', async () => {
      req.params.id = '101';
      apiFootballService.getMatchEvents.mockResolvedValue({
        response: [{ time: { elapsed: 34 }, type: 'Goal' }],
      });

      await matchController.getMatchEvents(req, res);

      expect(apiFootballService.getMatchEvents).toHaveBeenCalledWith('101');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        response: [{ time: { elapsed: 34 }, type: 'Goal' }],
      }));
    });

    test('502s when the upstream call fails', async () => {
      apiFootballService.getMatchEvents.mockRejectedValue(new Error('upstream down'));

      await matchController.getMatchEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });
  });

  describe('getMatchMomentum', () => {
    test('combines the fixture and its events into a momentum payload', async () => {
      req.params.id = '101';
      apiFootballService.getMatchById.mockResolvedValue({
        response: [{
          fixture: { status: { elapsed: 40 } },
          teams: { home: { id: 1 }, away: { id: 2 } },
        }],
      });
      apiFootballService.getMatchEvents.mockResolvedValue({
        response: [{ time: { elapsed: 34, extra: null }, team: { id: 1 }, player: { name: 'Scorer' }, type: 'Goal', detail: 'Normal Goal' }],
      });

      await matchController.getMatchMomentum(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const [body] = res.json.mock.calls[0];
      expect(body.success).toBe(true);
      expect(body.markers).toEqual([{ minute: 34, type: 'goal', team: 'home', player: 'Scorer' }]);
      expect(body.windows.find((w) => w.minute === 34).home_score).toBe(10);
    });

    test('404s when the fixture does not exist', async () => {
      req.params.id = '999';
      apiFootballService.getMatchById.mockResolvedValue({ response: [] });
      apiFootballService.getMatchEvents.mockResolvedValue({ response: [] });

      await matchController.getMatchMomentum(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getLiveOdds', () => {
    const oddsEnvelope = (home, draw, away) => ({
      response: [{
        bookmakers: [{
          name: 'Bet365',
          bets: [{
            name: 'Match Winner',
            values: [
              { value: 'Home', odd: String(home) },
              { value: 'Draw', odd: String(draw) },
              { value: 'Away', odd: String(away) },
            ],
          }],
        }],
      }],
    });

    test('returns odds plus movement from the tracker', async () => {
      req.params.id = '101';
      apiFootballService.getMatchOdds.mockResolvedValue(oddsEnvelope(1.80, 3.40, 4.20));
      oddsTracker.trackOddsSnapshot.mockResolvedValue({ home: 'down', draw: 'up', away: 'up' });

      await matchController.getLiveOdds(req, res);

      expect(oddsTracker.trackOddsSnapshot).toHaveBeenCalledWith(
        '101', { home_odds: 1.80, draw_odds: 3.40, away_odds: 4.20, bookmaker: 'Bet365' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        home_odds: 1.80, draw_odds: 3.40, away_odds: 4.20,
        movement: { home: 'down', draw: 'up', away: 'up' },
      }));
    });

    test('404s when no bookmaker has priced the Match Winner market', async () => {
      apiFootballService.getMatchOdds.mockResolvedValue({ response: [] });

      await matchController.getLiveOdds(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(oddsTracker.trackOddsSnapshot).not.toHaveBeenCalled();
    });
  });
});
