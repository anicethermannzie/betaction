import { describe, expect, it } from 'vitest';
import { buildMarkets } from './markets';
import { toH2HMatches, toMatchOdds } from './matchDetail';
import type { ApiFixture, PredictionMarkets } from '@/types';

/**
 * These tests exist because of the worst defect found in the production
 * readiness audit: the previous market builder seeded prices from
 * `Math.sin(fixtureId)` and only overwrote them where the API happened to
 * supply a probability. Markets the model never prices kept the invented
 * numbers all the way into the bet slip.
 *
 * The invariant they protect: **every displayed price traces back to a
 * probability the model produced.** No input, however sparse, may produce a
 * price out of nothing.
 */

const HOME = 'Arsenal';
const AWAY = 'Chelsea';

describe('buildMarkets', () => {
  it('returns nothing when there are no markets at all', () => {
    expect(buildMarkets(undefined, HOME, AWAY)).toEqual([]);
    expect(buildMarkets({}, HOME, AWAY)).toEqual([]);
  });

  it('builds only the markets the model priced', () => {
    const markets: PredictionMarkets = {
      '1x2': { home_win: 0.5, draw: 0.3, away_win: 0.2 },
      btts: { btts_yes: 0.6, btts_no: 0.4 },
    };

    const ids = buildMarkets(markets, HOME, AWAY).map((m) => m.id);

    expect(ids).toContain('match_result_1x2');
    expect(ids).toContain('both_teams_to_score');
    // Not supplied → not invented.
    expect(ids).not.toContain('total_goals_match');
    expect(ids).not.toContain('total_corners');
    expect(ids).not.toContain('spreads');
    expect(ids).toHaveLength(2);
  });

  it('never emits a market for a second-half result', () => {
    // The old builder produced one by multiplying the full-time price by 1.4.
    const everything: PredictionMarkets = {
      '1x2': { home_win: 0.5, draw: 0.3, away_win: 0.2 },
      halftime_result: { home_win_ht: 0.4, draw_ht: 0.4, away_win_ht: 0.2 },
    };

    const ids = buildMarkets(everything, HOME, AWAY).map((m) => m.id);
    expect(ids).not.toContain('match_result_2nd_half');
    expect(ids).toContain('match_result_1st_half');
  });

  it('is deterministic — the same probabilities always give the same prices', () => {
    const markets: PredictionMarkets = { '1x2': { home_win: 0.5, draw: 0.3, away_win: 0.2 } };

    const first = buildMarkets(markets, HOME, AWAY);
    const second = buildMarkets(markets, HOME, AWAY);

    expect(first).toEqual(second);
  });

  it('prices from the probability, not from the fixture', () => {
    // The old builder keyed its pseudo-random seed on fixture id, so identical
    // probabilities produced different prices per match.
    const markets: PredictionMarkets = { '1x2': { home_win: 0.5, draw: 0.3, away_win: 0.2 } };

    const [result] = buildMarkets(markets, HOME, AWAY);
    const homeOption = result.options.find((o) => o.name === HOME);

    // 1 / (0.5 * 0.95) = 2.105... → 2.11
    expect(homeOption?.decimalOdds).toBe(2.11);
  });

  it('drops individual options whose probability is missing or nonsensical', () => {
    const markets = {
      '1x2': { home_win: 0.5, draw: 0, away_win: undefined },
    } as unknown as PredictionMarkets;

    const [result] = buildMarkets(markets, HOME, AWAY);

    expect(result.options.map((o) => o.name)).toEqual([HOME]);
  });

  it('omits a market entirely when none of its options can be priced', () => {
    const markets = { btts: { btts_yes: 0, btts_no: 0 } } as unknown as PredictionMarkets;
    expect(buildMarkets(markets, HOME, AWAY)).toEqual([]);
  });

  it('caps implausible prices instead of emitting Infinity', () => {
    const markets: PredictionMarkets = { btts: { btts_yes: 1e-9, btts_no: 0.99 } };

    const [result] = buildMarkets(markets, HOME, AWAY);
    for (const option of result.options) {
      expect(Number.isFinite(option.decimalOdds)).toBe(true);
      expect(option.decimalOdds).toBeLessThanOrEqual(99);
      expect(option.decimalOdds).toBeGreaterThan(1);
    }
  });

  it('labels options with the real team names', () => {
    const markets: PredictionMarkets = { '1x2': { home_win: 0.5, draw: 0.3, away_win: 0.2 } };
    const [result] = buildMarkets(markets, HOME, AWAY);

    expect(result.options.map((o) => o.name)).toEqual([HOME, 'Tie', AWAY]);
  });
});

// ── Detail mappers ───────────────────────────────────────────────────────────

function fixture(id: number, date: string, home: number | null, away: number | null): ApiFixture {
  return {
    fixture: { id, date, status: { short: 'FT', long: 'Match Finished', elapsed: 90 } },
    league: { id: 39, name: 'Premier League', logo: '', country: 'England', season: 2026 },
    teams: {
      home: { id: 1, name: HOME, logo: '' },
      away: { id: 2, name: AWAY, logo: '' },
    },
    goals: { home, away },
  };
}

describe('toH2HMatches', () => {
  it('returns an empty list for missing or malformed input', () => {
    expect(toH2HMatches(undefined)).toEqual([]);
    expect(toH2HMatches([])).toEqual([]);
  });

  it('skips fixtures that have not been played', () => {
    const result = toH2HMatches([
      fixture(1, '2026-01-01T15:00:00+00:00', 2, 1),
      fixture(2, '2026-02-01T15:00:00+00:00', null, null),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].homeGoals).toBe(2);
  });

  it('orders newest first and trims the date', () => {
    const result = toH2HMatches([
      fixture(1, '2025-01-01T15:00:00+00:00', 1, 0),
      fixture(2, '2026-01-01T15:00:00+00:00', 3, 3),
    ]);

    expect(result.map((m) => m.date)).toEqual(['2026-01-01', '2025-01-01']);
  });
});

describe('toMatchOdds', () => {
  const entry = (values: { value: string; odd: string }[]) => [
    { bookmakers: [{ name: 'Bet365', bets: [{ name: 'Match Winner', values }] }] },
  ];

  it('reads the 1x2 market from the first bookmaker quoting it', () => {
    const odds = toMatchOdds(entry([
      { value: 'Home', odd: '1.85' },
      { value: 'Draw', odd: '3.60' },
      { value: 'Away', odd: '4.20' },
    ]));

    expect(odds).toEqual({ homeWin: 1.85, draw: 3.6, awayWin: 4.2, bookmaker: 'Bet365' });
  });

  it('returns null when the market is incomplete', () => {
    // A partial market would make the implied-probability comparison wrong.
    expect(toMatchOdds(entry([
      { value: 'Home', odd: '1.85' },
      { value: 'Draw', odd: '3.60' },
    ]))).toBeNull();
  });

  it('returns null when nobody has priced the match', () => {
    expect(toMatchOdds(undefined)).toBeNull();
    expect(toMatchOdds([])).toBeNull();
    expect(toMatchOdds([{ bookmakers: [] }])).toBeNull();
  });
});
