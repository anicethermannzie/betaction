const matchController = require('../matchController');
const apiFootballService = require('../../services/apiFootballService');

jest.mock('../../services/apiFootballService');

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
});
