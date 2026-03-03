/**
 * Mock data for development / UI preview.
 * Mirrors the exact shapes returned by the match-service and prediction-service.
 *
 * Dates are centred around 2026-03-03 (today in dev):
 *   - 2026-03-02  →  7 finished matches (yesterday)
 *   - 2026-03-03  →  3 live + 10 upcoming  (today)
 *   - 2026-03-04  →  5 upcoming  (tomorrow)
 */

import type { ApiFixture, ApiLeague, ApiTeam, Prediction } from '@/types';

// ── URL helpers ───────────────────────────────────────────────────────────────

const tl  = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;
const ll  = (id: number) => `https://media.api-sports.io/football/leagues/${id}.png`;

// ── League definitions ────────────────────────────────────────────────────────

const EPL:    ApiLeague = { id: 39,  name: 'Premier League',   logo: ll(39),  country: 'England', season: 2025 };
const LALIGA: ApiLeague = { id: 140, name: 'La Liga',          logo: ll(140), country: 'Spain',   season: 2025 };
const SERIEA: ApiLeague = { id: 135, name: 'Serie A',          logo: ll(135), country: 'Italy',   season: 2025 };
const BUNDES: ApiLeague = { id: 78,  name: 'Bundesliga',       logo: ll(78),  country: 'Germany', season: 2025 };
const LIGUE1: ApiLeague = { id: 61,  name: 'Ligue 1',          logo: ll(61),  country: 'France',  season: 2025 };
const UCL:    ApiLeague = { id: 2,   name: 'Champions League', logo: ll(2),   country: 'Europe',  season: 2025 };

// ── Team definitions ──────────────────────────────────────────────────────────

const T: Record<string, ApiTeam> = {
  arsenal:    { id: 42,  name: 'Arsenal',                logo: tl(42)  },
  chelsea:    { id: 49,  name: 'Chelsea',                logo: tl(49)  },
  liverpool:  { id: 40,  name: 'Liverpool',              logo: tl(40)  },
  manCity:    { id: 50,  name: 'Manchester City',        logo: tl(50)  },
  manUtd:     { id: 33,  name: 'Manchester United',      logo: tl(33)  },
  tottenham:  { id: 47,  name: 'Tottenham',              logo: tl(47)  },
  newcastle:  { id: 34,  name: 'Newcastle',              logo: tl(34)  },
  barcelona:  { id: 529, name: 'Barcelona',              logo: tl(529) },
  realMadrid: { id: 541, name: 'Real Madrid',            logo: tl(541) },
  atletico:   { id: 530, name: 'Atlético Madrid',        logo: tl(530) },
  sevilla:    { id: 536, name: 'Sevilla',                logo: tl(536) },
  inter:      { id: 505, name: 'Inter',                  logo: tl(505) },
  juventus:   { id: 496, name: 'Juventus',               logo: tl(496) },
  acMilan:    { id: 489, name: 'AC Milan',               logo: tl(489) },
  napoli:     { id: 492, name: 'Napoli',                 logo: tl(492) },
  bayernMun:  { id: 157, name: 'Bayern Munich',          logo: tl(157) },
  dortmund:   { id: 165, name: 'Borussia Dortmund',      logo: tl(165) },
  rbLeipzig:  { id: 173, name: 'RB Leipzig',             logo: tl(173) },
  leverkusen: { id: 168, name: 'Bayer Leverkusen',       logo: tl(168) },
  psg:        { id: 85,  name: 'Paris Saint-Germain',    logo: tl(85)  },
  marseille:  { id: 81,  name: 'Marseille',              logo: tl(81)  },
  monaco:     { id: 91,  name: 'Monaco',                 logo: tl(91)  },
  lyon:       { id: 80,  name: 'Lyon',                   logo: tl(80)  },
};

// ── Fixture factory ───────────────────────────────────────────────────────────

function fx(
  id:        number,
  date:      string,          // 'YYYY-MM-DD HH:mm' local
  league:    ApiLeague,
  home:      ApiTeam,
  away:      ApiTeam,
  homeGoals: number | null,
  awayGoals: number | null,
  statusShort: string,
  elapsed:   number | null = null,
): ApiFixture {
  return {
    fixture: {
      id,
      date:   `${date}:00+00:00`,
      status: { short: statusShort, long: statusShort, elapsed },
    },
    league,
    teams: { home, away },
    goals: { home: homeGoals, away: awayGoals },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// YESTERDAY  (2026-03-02) — 7 finished
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_YESTERDAY: ApiFixture[] = [
  fx(100201, '2026-03-02 16:00', EPL,    T.tottenham,  T.arsenal,    2, 3, 'FT'),
  fx(100202, '2026-03-02 18:30', EPL,    T.liverpool,  T.chelsea,    1, 1, 'FT'),
  fx(100203, '2026-03-02 21:00', LALIGA, T.realMadrid, T.atletico,   2, 0, 'FT'),
  fx(100204, '2026-03-02 20:45', SERIEA, T.acMilan,    T.inter,      1, 1, 'FT'),
  fx(100205, '2026-03-02 20:30', BUNDES, T.dortmund,   T.rbLeipzig,  3, 1, 'FT'),
  fx(100206, '2026-03-02 21:00', LIGUE1, T.marseille,  T.monaco,     2, 1, 'FT'),
  fx(100207, '2026-03-02 21:00', UCL,    T.barcelona,  T.psg,        3, 2, 'FT'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TODAY  (2026-03-03) — 3 live + 10 upcoming
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TODAY: ApiFixture[] = [
  // ── Live ──────────────────────────────────────────────────────────────────
  fx(100301, '2026-03-03 15:00', EPL,    T.arsenal,    T.chelsea,    1, 1, '1H', 67),
  fx(100302, '2026-03-03 15:00', LALIGA, T.barcelona,  T.realMadrid, 2, 1, '2H', 75),
  fx(100303, '2026-03-03 15:00', BUNDES, T.bayernMun,  T.dortmund,   0, 1, 'HT', 45),

  // ── Upcoming ──────────────────────────────────────────────────────────────
  fx(100304, '2026-03-03 17:30', EPL,    T.tottenham,  T.newcastle,  null, null, 'NS'),
  fx(100305, '2026-03-03 18:00', LALIGA, T.atletico,   T.sevilla,    null, null, 'NS'),
  fx(100306, '2026-03-03 19:00', LIGUE1, T.monaco,     T.lyon,       null, null, 'NS'),
  fx(100307, '2026-03-03 19:30', EPL,    T.manUtd,     T.newcastle,  null, null, 'NS'),
  fx(100308, '2026-03-03 20:00', EPL,    T.liverpool,  T.manCity,    null, null, 'NS'),
  fx(100309, '2026-03-03 20:45', SERIEA, T.inter,      T.juventus,   null, null, 'NS'),
  fx(100310, '2026-03-03 20:45', SERIEA, T.napoli,     T.acMilan,    null, null, 'NS'),
  fx(100311, '2026-03-03 20:30', BUNDES, T.rbLeipzig,  T.leverkusen, null, null, 'NS'),
  fx(100312, '2026-03-03 21:00', LIGUE1, T.psg,        T.marseille,  null, null, 'NS'),
  fx(100313, '2026-03-03 21:00', UCL,    T.chelsea,    T.bayernMun,  null, null, 'NS'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TOMORROW  (2026-03-04) — 5 upcoming
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TOMORROW: ApiFixture[] = [
  fx(100401, '2026-03-04 16:00', EPL,    T.manCity,   T.arsenal,    null, null, 'NS'),
  fx(100402, '2026-03-04 18:30', LALIGA, T.realMadrid,T.sevilla,    null, null, 'NS'),
  fx(100403, '2026-03-04 20:45', SERIEA, T.juventus,  T.napoli,     null, null, 'NS'),
  fx(100404, '2026-03-04 21:00', LIGUE1, T.psg,       T.monaco,     null, null, 'NS'),
  fx(100405, '2026-03-04 20:30', BUNDES, T.bayernMun, T.rbLeipzig,  null, null, 'NS'),
];

// ─────────────────────────────────────────────────────────────────────────────
// All fixtures indexed by date string
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_FIXTURES_BY_DATE: Record<string, ApiFixture[]> = {
  '2026-03-02': MOCK_YESTERDAY,
  '2026-03-03': MOCK_TODAY,
  '2026-03-04': MOCK_TOMORROW,
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock predictions  (today only — prediction-service only covers today)
// fixture_id matches the IDs in MOCK_TODAY
// ─────────────────────────────────────────────────────────────────────────────

function pred(
  fixtureId:  number,
  homeTeam:   string,
  awayTeam:   string,
  leagueId:   number,
  homeTId:    number,
  awayTId:    number,
  homeWin:    number,
  draw:       number,
  awayWin:    number,
  outcome:    Prediction['prediction'],
  confidence: Prediction['confidence'],
): Prediction {
  return {
    fixture_id:   fixtureId,
    home_team:    homeTeam,
    away_team:    awayTeam,
    home_team_id: homeTId,
    away_team_id: awayTId,
    league_id:    leagueId,
    season:       2025,
    home_win:     homeWin,
    draw,
    away_win:     awayWin,
    prediction:   outcome,
    confidence,
    cached:       true,
    generated_at: '2026-03-03T06:00:00Z',
    factors: {
      home_form_score:     0.65,
      away_form_score:     0.55,
      home_h2h_score:      0.60,
      away_h2h_score:      0.40,
      home_expected_goals: 1.8,
      away_expected_goals: 1.2,
      home_home_win_rate:  0.58,
      away_away_win_rate:  0.38,
    },
  };
}

export const MOCK_PREDICTIONS: Prediction[] = [
  // Today live
  pred(100301, 'Arsenal',            'Chelsea',          39,  42,  49,  0.52, 0.25, 0.23, 'HOME_WIN',  'medium'),
  pred(100302, 'Barcelona',          'Real Madrid',      140, 529, 541, 0.45, 0.28, 0.27, 'HOME_WIN',  'low'),
  pred(100303, 'Bayern Munich',      'Borussia Dortmund',78,  157, 165, 0.61, 0.20, 0.19, 'HOME_WIN',  'high'),
  // Today upcoming
  pred(100304, 'Tottenham',          'Newcastle',        39,  47,  34,  0.44, 0.28, 0.28, 'HOME_WIN',  'low'),
  pred(100305, 'Atlético Madrid',    'Sevilla',          140, 530, 536, 0.55, 0.24, 0.21, 'HOME_WIN',  'medium'),
  pred(100306, 'Monaco',             'Lyon',             61,  91,  80,  0.42, 0.30, 0.28, 'HOME_WIN',  'low'),
  pred(100307, 'Manchester United',  'Newcastle',        39,  33,  34,  0.47, 0.27, 0.26, 'HOME_WIN',  'low'),
  pred(100308, 'Liverpool',          'Manchester City',  39,  40,  50,  0.38, 0.26, 0.36, 'AWAY_WIN',  'medium'),
  pred(100309, 'Inter',              'Juventus',         135, 505, 496, 0.43, 0.29, 0.28, 'HOME_WIN',  'low'),
  pred(100310, 'Napoli',             'AC Milan',         135, 492, 489, 0.40, 0.27, 0.33, 'AWAY_WIN',  'medium'),
  pred(100311, 'RB Leipzig',         'Bayer Leverkusen', 78,  173, 168, 0.35, 0.25, 0.40, 'AWAY_WIN',  'high'),
  pred(100312, 'Paris Saint-Germain','Marseille',        61,  85,  81,  0.68, 0.18, 0.14, 'HOME_WIN',  'high'),
  pred(100313, 'Chelsea',            'Bayern Munich',    2,   49,  157, 0.29, 0.24, 0.47, 'AWAY_WIN',  'high'),
];

// ── Convenience: prediction map keyed by fixture_id ──────────────────────────

export const MOCK_PREDICTION_MAP = new Map(
  MOCK_PREDICTIONS.map((p) => [p.fixture_id, p])
);
