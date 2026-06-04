const apiFootball = require('../../config/apiFootball');
const apiFootballService = require('../apiFootballService');

jest.mock('../../config/apiFootball', () => {
  return {
    get: jest.fn()
  };
});

describe('apiFootballService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse = {
    data: {
      response: [
        { fixture: { id: 101 }, league: { id: 39, name: 'Premier League' } }, // Club (39)
        { fixture: { id: 102 }, league: { id: 1, name: 'FIFA World Cup' } },   // International (1)
        { fixture: { id: 103 }, league: { id: 999, name: 'Unsupported League' } } // Unsupported
      ]
    }
  };

  test('fetchTodayMatches filters only supported club + international leagues', async () => {
    apiFootball.get.mockResolvedValue(mockResponse);

    const result = await apiFootballService.fetchTodayMatches();

    expect(apiFootball.get).toHaveBeenCalledWith('/fixtures', expect.objectContaining({
      params: { date: expect.any(String) }
    }));
    expect(result.response).toHaveLength(2);
    expect(result.response[0].fixture.id).toBe(101);
    expect(result.response[1].fixture.id).toBe(102);
    expect(result.results).toBe(2);
  });

  test('fetchInternationalMatches filters only international competitions', async () => {
    apiFootball.get.mockResolvedValue(mockResponse);

    const result = await apiFootballService.fetchInternationalMatches('2026-06-04');

    expect(apiFootball.get).toHaveBeenCalledWith('/fixtures', {
      params: { date: '2026-06-04' }
    });
    expect(result.response).toHaveLength(1);
    expect(result.response[0].fixture.id).toBe(102);
    expect(result.results).toBe(1);
  });

  test('fetchMatchesByCompetitionType filters correctly for club', async () => {
    apiFootball.get.mockResolvedValue(mockResponse);

    const result = await apiFootballService.fetchMatchesByCompetitionType('2026-06-04', 'club');

    expect(result.response).toHaveLength(1);
    expect(result.response[0].fixture.id).toBe(101);
    expect(result.results).toBe(1);
  });
});
