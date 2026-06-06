/**
 * Mock data for development / UI preview.
 * Mirrors the exact shapes returned by the match-service and prediction-service.
 *
 * Dates are centred around 2026-03-03 (today in dev):
 *   - 2026-03-02  →  7 finished matches (yesterday)
 *   - 2026-03-03  →  3 live + 10 upcoming  (today)
 *   - 2026-03-04  →  5 upcoming  (tomorrow)
 */
import type { PredictionDetail, Ticket } from '@/types';

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

// International leagues
const FRIENDLIES: ApiLeague = { id: 10,  name: 'International Friendlies', logo: ll(10), country: 'World', season: 2026 };
const WC_QUAL_SA: ApiLeague = { id: 33,  name: 'World Cup Qualifiers - South America', logo: ll(33), country: 'South America', season: 2026 };
const UNL:        ApiLeague = { id: 5,   name: 'UEFA Nations League', logo: ll(5), country: 'Europe', season: 2026 };
const CONCACAF_NL:ApiLeague = { id: 481, name: 'CONCACAF Nations League', logo: ll(481), country: 'North America', season: 2026 };
const WC_QUAL_AF: ApiLeague = { id: 34,  name: 'World Cup Qualifiers - Africa', logo: ll(34), country: 'Africa', season: 2026 };

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

  // National teams
  panama:     { id: 1100, name: 'Panama',                logo: tl(1100) },
  domRep:     { id: 1101, name: 'Dominican Republic',    logo: tl(1101) },
  brazil:     { id: 1102, name: 'Brazil',                logo: tl(1102) },
  argentina:  { id: 1103, name: 'Argentina',             logo: tl(1103) },
  france:     { id: 1104, name: 'France',                logo: tl(1104) },
  germany:    { id: 1105, name: 'Germany',               logo: tl(1105) },
  usa:        { id: 1106, name: 'USA',                   logo: tl(1106) },
  mexico:     { id: 1107, name: 'Mexico',                logo: tl(1107) },
  nigeria:    { id: 1108, name: 'Nigeria',               logo: tl(1108) },
  ghana:      { id: 1109, name: 'Ghana',                 logo: tl(1109) },
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
): ApiFixture & { competition_type?: 'club' | 'international' } {
  return {
    fixture: {
      id,
      date:   `${date}:00+00:00`,
      status: { short: statusShort, long: statusShort, elapsed },
    },
    league,
    teams: { home, away },
    goals: { home: homeGoals, away: awayGoals },
    competition_type: [1, 4, 9, 6, 7, 5, 8, 32, 33, 34, 35, 36, 481, 10].includes(league.id) ? 'international' : 'club',
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
// TODAY  (2026-03-03) — 3 live + 15 upcoming
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TODAY: ApiFixture[] = [
  // ── Live ──────────────────────────────────────────────────────────────────
  fx(100301, '2026-03-03 15:00', EPL,    T.arsenal,    T.chelsea,    1, 1, '1H', 67),
  fx(100302, '2026-03-03 15:00', LALIGA, T.barcelona,  T.realMadrid, 2, 1, '2H', 75),
  fx(100303, '2026-03-03 15:00', BUNDES, T.bayernMun,  T.dortmund,   0, 1, 'HT', 45),

  // ── Upcoming Club ─────────────────────────────────────────────────────────
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

  // ── Upcoming International ────────────────────────────────────────────────
  fx(100314, '2026-03-03 16:00', FRIENDLIES, T.panama,  T.domRep,    null, null, 'NS'),
  fx(100315, '2026-03-03 18:00', WC_QUAL_SA, T.brazil,  T.argentina, null, null, 'NS'),
  fx(100316, '2026-03-03 20:00', UNL,         T.france,  T.germany,   null, null, 'NS'),
  fx(100317, '2026-03-03 21:00', CONCACAF_NL, T.usa,     T.mexico,    null, null, 'NS'),
  fx(100318, '2026-03-03 19:30', WC_QUAL_AF, T.nigeria, T.ghana,     null, null, 'NS'),
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

  // Today upcoming international
  pred(100314, 'Panama',             'Dominican Republic', 10,  1100, 1101, 0.65, 0.22, 0.13, 'HOME_WIN',  'high'),
  pred(100315, 'Brazil',             'Argentina',          33,  1102, 1103, 0.42, 0.30, 0.28, 'HOME_WIN',  'low'),
  pred(100316, 'France',             'Germany',            5,   1104, 1105, 0.48, 0.27, 0.25, 'HOME_WIN',  'medium'),
  pred(100317, 'USA',                'Mexico',             481, 1106, 1107, 0.45, 0.28, 0.27, 'HOME_WIN',  'medium'),
  pred(100318, 'Nigeria',            'Ghana',              34,  1108, 1109, 0.50, 0.28, 0.22, 'HOME_WIN',  'medium'),
];

// ── Convenience: prediction map keyed by fixture_id ──────────────────────────

export const MOCK_PREDICTION_MAP = new Map(
  MOCK_PREDICTIONS.map((p) => [p.fixture_id, p])
);

// ─────────────────────────────────────────────────────────────────────────────
// Rich detail data for the prediction detail page
// Keys match fixture IDs: 100301, 100302, 100303 (the three live matches)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_DETAIL: Record<number, PredictionDetail> = {
  // ── 100301: Arsenal vs Chelsea ───────────────────────────────────────────
  100301: {
    homeForm: [
      { date: '2026-02-28', opponent: 'Man United',  score: '2-0', isHome: true,  result: 'W' },
      { date: '2026-02-22', opponent: 'Wolves',      score: '1-0', isHome: false, result: 'W' },
      { date: '2026-02-15', opponent: 'Brentford',   score: '2-2', isHome: true,  result: 'D' },
      { date: '2026-02-08', opponent: 'Everton',     score: '3-1', isHome: false, result: 'W' },
      { date: '2026-02-01', opponent: 'Newcastle',   score: '0-1', isHome: true,  result: 'L' },
    ],
    awayForm: [
      { date: '2026-02-28', opponent: 'Man City',    score: '0-2', isHome: false, result: 'L' },
      { date: '2026-02-22', opponent: 'Leicester',   score: '3-1', isHome: true,  result: 'W' },
      { date: '2026-02-15', opponent: 'Crystal Pal', score: '1-0', isHome: false, result: 'W' },
      { date: '2026-02-08', opponent: 'Tottenham',   score: '2-2', isHome: true,  result: 'D' },
      { date: '2026-02-01', opponent: 'Brighton',    score: '1-3', isHome: false, result: 'L' },
    ],
    h2h: [
      { date: '2025-12-26', competition: 'Premier League', homeTeam: 'Chelsea',  awayTeam: 'Arsenal',  homeGoals: 1, awayGoals: 2 },
      { date: '2025-08-25', competition: 'Premier League', homeTeam: 'Arsenal',  awayTeam: 'Chelsea',  homeGoals: 1, awayGoals: 1 },
      { date: '2025-04-20', competition: 'FA Cup',         homeTeam: 'Arsenal',  awayTeam: 'Chelsea',  homeGoals: 3, awayGoals: 2 },
      { date: '2025-01-14', competition: 'Premier League', homeTeam: 'Chelsea',  awayTeam: 'Arsenal',  homeGoals: 0, awayGoals: 1 },
      { date: '2024-10-06', competition: 'Premier League', homeTeam: 'Arsenal',  awayTeam: 'Chelsea',  homeGoals: 2, awayGoals: 0 },
    ],
    homeStats: { goalsScored: 2.3, goalsConceded: 0.9, shotsOnTarget: 5.8, possession: 57, cleanSheets: 4, cornersPerGame: 6.2 },
    awayStats: { goalsScored: 1.8, goalsConceded: 1.3, shotsOnTarget: 4.6, possession: 52, cleanSheets: 2, cornersPerGame: 5.1 },
    odds: { homeWin: 2.10, draw: 3.50, awayWin: 3.60, bookmaker: 'Bet365' },
  },

  // ── 100302: Barcelona vs Real Madrid ─────────────────────────────────────
  100302: {
    homeForm: [
      { date: '2026-02-28', opponent: 'Villarreal',  score: '3-0', isHome: true,  result: 'W' },
      { date: '2026-02-22', opponent: 'Mallorca',    score: '4-1', isHome: false, result: 'W' },
      { date: '2026-02-15', opponent: 'Athletic',    score: '2-1', isHome: true,  result: 'W' },
      { date: '2026-02-08', opponent: 'Getafe',      score: '5-0', isHome: false, result: 'W' },
      { date: '2026-02-01', opponent: 'Betis',       score: '1-1', isHome: true,  result: 'D' },
    ],
    awayForm: [
      { date: '2026-02-28', opponent: 'Osasuna',     score: '2-0', isHome: true,  result: 'W' },
      { date: '2026-02-22', opponent: 'Rayo',        score: '3-1', isHome: false, result: 'W' },
      { date: '2026-02-15', opponent: 'Celta Vigo',  score: '0-1', isHome: true,  result: 'L' },
      { date: '2026-02-08', opponent: 'Valencia',    score: '2-0', isHome: false, result: 'W' },
      { date: '2026-02-01', opponent: 'Girona',      score: '1-1', isHome: true,  result: 'D' },
    ],
    h2h: [
      { date: '2025-10-26', competition: 'La Liga',    homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeGoals: 1, awayGoals: 4 },
      { date: '2025-04-12', competition: 'La Liga',    homeTeam: 'Barcelona',   awayTeam: 'Real Madrid', homeGoals: 3, awayGoals: 2 },
      { date: '2025-02-09', competition: 'Supercopa',  homeTeam: 'Barcelona',   awayTeam: 'Real Madrid', homeGoals: 5, awayGoals: 2 },
      { date: '2024-10-26', competition: 'La Liga',    homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeGoals: 0, awayGoals: 1 },
      { date: '2024-04-21', competition: 'La Liga',    homeTeam: 'Barcelona',   awayTeam: 'Real Madrid', homeGoals: 3, awayGoals: 2 },
    ],
    homeStats: { goalsScored: 3.1, goalsConceded: 0.7, shotsOnTarget: 7.4, possession: 63, cleanSheets: 6, cornersPerGame: 7.8 },
    awayStats: { goalsScored: 2.4, goalsConceded: 0.9, shotsOnTarget: 6.1, possession: 58, cleanSheets: 5, cornersPerGame: 6.5 },
    odds: { homeWin: 2.25, draw: 3.60, awayWin: 3.20, bookmaker: 'Bet365' },
  },

  // ── 100303: Bayern Munich vs Borussia Dortmund ───────────────────────────
  100303: {
    homeForm: [
      { date: '2026-02-28', opponent: 'Stuttgart',   score: '4-0', isHome: true,  result: 'W' },
      { date: '2026-02-22', opponent: 'Mainz',       score: '3-1', isHome: false, result: 'W' },
      { date: '2026-02-15', opponent: 'Augsburg',    score: '2-0', isHome: true,  result: 'W' },
      { date: '2026-02-08', opponent: 'Freiburg',    score: '1-1', isHome: false, result: 'D' },
      { date: '2026-02-01', opponent: 'Wolfsburg',   score: '2-0', isHome: true,  result: 'W' },
    ],
    awayForm: [
      { date: '2026-02-28', opponent: 'Bochum',      score: '3-0', isHome: true,  result: 'W' },
      { date: '2026-02-22', opponent: 'Köln',        score: '2-1', isHome: false, result: 'W' },
      { date: '2026-02-15', opponent: 'Hertha BSC',  score: '4-2', isHome: true,  result: 'W' },
      { date: '2026-02-08', opponent: 'Hoffenheim',  score: '0-1', isHome: false, result: 'L' },
      { date: '2026-02-01', opponent: 'Schalke',     score: '3-1', isHome: true,  result: 'W' },
    ],
    h2h: [
      { date: '2025-11-08', competition: 'Bundesliga', homeTeam: 'Borussia Dortmund', awayTeam: 'Bayern Munich',       homeGoals: 1, awayGoals: 3 },
      { date: '2025-04-05', competition: 'Bundesliga', homeTeam: 'Bayern Munich',       awayTeam: 'Borussia Dortmund', homeGoals: 4, awayGoals: 0 },
      { date: '2025-02-22', competition: 'DFB Pokal',  homeTeam: 'Bayern Munich',       awayTeam: 'Borussia Dortmund', homeGoals: 2, awayGoals: 1 },
      { date: '2024-11-09', competition: 'Bundesliga', homeTeam: 'Borussia Dortmund', awayTeam: 'Bayern Munich',       homeGoals: 2, awayGoals: 0 },
      { date: '2024-04-06', competition: 'Bundesliga', homeTeam: 'Bayern Munich',       awayTeam: 'Borussia Dortmund', homeGoals: 2, awayGoals: 2 },
    ],
    homeStats: { goalsScored: 2.8, goalsConceded: 0.8, shotsOnTarget: 7.1, possession: 62, cleanSheets: 5, cornersPerGame: 7.3 },
    awayStats: { goalsScored: 2.2, goalsConceded: 1.1, shotsOnTarget: 5.5, possession: 52, cleanSheets: 3, cornersPerGame: 5.8 },
    odds: { homeWin: 1.62, draw: 4.00, awayWin: 5.50, bookmaker: 'Bet365' },
  },
};

// ── Mock Tickets (4 tiers) ────────────────────────────────────────────────────

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'mock-ticket-ultra-safe',
    tier: 'ultra_safe',
    name: 'Ultra Safe',
    emoji: '🟢',
    description: 'Very high probability, low risk',
    legs: [
      { fixture_id: 100301, match: 'Manchester City vs Burnley',   league: 'Premier League', kickoff: '2026-03-05T15:00:00Z', market: 'home_win',   selection: 'Manchester City to Win',       probability: 0.88, odds: 1.20 },
      { fixture_id: 100302, match: 'PSG vs Lens',                  league: 'Ligue 1',        kickoff: '2026-03-05T20:00:00Z', market: 'over_1_5',   selection: 'Over 1.5 Goals',               probability: 0.85, odds: 1.25 },
      { fixture_id: 100303, match: 'Bayern Munich vs Augsburg',    league: 'Bundesliga',     kickoff: '2026-03-05T17:30:00Z', market: 'dc_1x',      selection: 'Bayern Munich or Draw (1X)',   probability: 0.92, odds: 1.10 },
    ],
    combined_odds: 1.65,
    combined_probability: 0.69,
    potential_return_per_unit: 1.65,
    confidence: 'high',
    generated_at: '2026-03-05T09:00:00Z',
  },
  {
    id: 'mock-ticket-safe',
    tier: 'safe',
    name: 'Safe',
    emoji: '🔵',
    description: 'Good probability with decent returns',
    legs: [
      { fixture_id: 100304, match: 'Juventus vs Inter Milan',      league: 'Serie A',        kickoff: '2026-03-05T19:45:00Z', market: 'over_2_5',  selection: 'Over 2.5 Goals',                probability: 0.72, odds: 1.45 },
      { fixture_id: 100305, match: 'Liverpool vs Arsenal',         league: 'Premier League', kickoff: '2026-03-05T12:30:00Z', market: 'btts_yes',  selection: 'Both Teams to Score - Yes',     probability: 0.70, odds: 1.55 },
      { fixture_id: 100306, match: 'Real Madrid vs Atlético',      league: 'La Liga',        kickoff: '2026-03-05T21:00:00Z', market: 'home_win',  selection: 'Real Madrid to Win',            probability: 0.68, odds: 1.60 },
      { fixture_id: 100307, match: 'Dortmund vs RB Leipzig',       league: 'Bundesliga',     kickoff: '2026-03-05T17:30:00Z', market: 'over_8_5',  selection: 'Over 8.5 Corners',              probability: 0.71, odds: 1.50 },
    ],
    combined_odds: 5.42,
    combined_probability: 0.24,
    potential_return_per_unit: 5.42,
    confidence: 'medium',
    generated_at: '2026-03-05T09:00:00Z',
  },
  {
    id: 'mock-ticket-moderate',
    tier: 'moderate',
    name: 'Moderate',
    emoji: '🟡',
    description: 'Balanced risk and reward',
    legs: [
      { fixture_id: 100308, match: 'Barcelona vs Sevilla',         league: 'La Liga',        kickoff: '2026-03-05T18:30:00Z', market: 'home_win',  selection: 'Barcelona to Win',              probability: 0.65, odds: 1.70 },
      { fixture_id: 100309, match: 'Chelsea vs Tottenham',         league: 'Premier League', kickoff: '2026-03-05T16:00:00Z', market: 'btts_yes',  selection: 'Both Teams to Score - Yes',     probability: 0.63, odds: 1.75 },
      { fixture_id: 100310, match: 'AC Milan vs Roma',             league: 'Serie A',        kickoff: '2026-03-05T19:45:00Z', market: 'over_2_5',  selection: 'Over 2.5 Goals',                probability: 0.60, odds: 1.85 },
      { fixture_id: 100311, match: 'PSG vs Monaco',                league: 'Ligue 1',        kickoff: '2026-03-05T20:00:00Z', market: 'home_win',  selection: 'PSG to Win',                    probability: 0.62, odds: 1.77 },
      { fixture_id: 100312, match: 'Atlético vs Valencia',         league: 'La Liga',        kickoff: '2026-03-05T20:00:00Z', market: 'under_2_5', selection: 'Under 2.5 Goals',               probability: 0.58, odds: 1.92 },
      { fixture_id: 100313, match: 'Ajax vs PSV',                  league: 'Eredivisie',     kickoff: '2026-03-05T17:00:00Z', market: 'over_9_5',  selection: 'Over 9.5 Corners',              probability: 0.57, odds: 1.95 },
    ],
    combined_odds: 36.7,
    combined_probability: 0.05,
    potential_return_per_unit: 36.7,
    confidence: 'low',
    generated_at: '2026-03-05T09:00:00Z',
  },
  {
    id: 'mock-ticket-risky',
    tier: 'risky',
    name: 'Risky',
    emoji: '🔴',
    description: 'High risk, high reward',
    legs: [
      { fixture_id: 100314, match: 'Porto vs Benfica',             league: 'Primeira Liga',  kickoff: '2026-03-05T20:15:00Z', market: 'btts_yes',           selection: 'Both Teams to Score - Yes',     probability: 0.55, odds: 2.00 },
      { fixture_id: 100315, match: 'Man Utd vs Everton',           league: 'Premier League', kickoff: '2026-03-05T15:00:00Z', market: 'home_win',           selection: 'Man Utd to Win',                probability: 0.50, odds: 2.22 },
      { fixture_id: 100316, match: 'Napoli vs Fiorentina',         league: 'Serie A',        kickoff: '2026-03-05T19:45:00Z', market: 'over_2_5',           selection: 'Over 2.5 Goals',                probability: 0.48, odds: 2.31 },
      { fixture_id: 100317, match: 'Leverkusen vs Wolfsburg',      league: 'Bundesliga',     kickoff: '2026-03-05T17:30:00Z', market: 'home_win',           selection: 'Leverkusen to Win',             probability: 0.52, odds: 2.13 },
      { fixture_id: 100318, match: 'Inter vs Bologna',             league: 'Serie A',        kickoff: '2026-03-05T19:45:00Z', market: 'home_clean_sheet',   selection: 'Inter Clean Sheet',             probability: 0.45, odds: 2.46 },
      { fixture_id: 100319, match: 'Lyon vs Nice',                 league: 'Ligue 1',        kickoff: '2026-03-05T19:00:00Z', market: 'over_9_5',           selection: 'Over 9.5 Corners',              probability: 0.49, odds: 2.26 },
      { fixture_id: 100320, match: 'Villarreal vs Real Betis',     league: 'La Liga',        kickoff: '2026-03-05T19:00:00Z', market: 'dc_1x',              selection: 'Villarreal or Draw (1X)',       probability: 0.47, odds: 2.36 },
      { fixture_id: 100321, match: 'Newcastle vs West Ham',        league: 'Premier League', kickoff: '2026-03-05T15:00:00Z', market: 'btts_yes',           selection: 'Both Teams to Score - Yes',     probability: 0.52, odds: 2.13 },
    ],
    combined_odds: 128.4,
    combined_probability: 0.008,
    potential_return_per_unit: 128.4,
    confidence: 'low',
    generated_at: '2026-03-05T09:00:00Z',
  },
];

export const MOCK_BETSLIP_SELECTIONS = [
  {
    id: '100301:match_result_1x2',
    matchId: 100301,
    matchName: 'Arsenal vs Chelsea',
    market: 'Match Result (1X2)',
    selection: 'Arsenal',
    odds: 2.10
  },
  {
    id: '100302:both_teams_to_score',
    matchId: 100302,
    matchName: 'Barcelona vs Real Madrid',
    market: 'Both Teams to Score',
    selection: 'Yes',
    odds: 2.05
  }
];

export interface MarketOption {
  name: string;
  odds: string;
  decimalOdds: number;
}

export interface Market {
  id: string;
  name: string;
  category: MarketCategory;
  sgpBadge: boolean;
  options: MarketOption[];
}

import type { MarketCategory } from '@/types';

export function generateMarketsForMatch(matchId: number, homeTeam: string, awayTeam: string, apiMarkets?: any): Market[] {
  const seed = matchId;
  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  const formatOdds = (decimal: number) => {
    if (decimal >= 2.0) {
      return `+${Math.round((decimal - 1) * 100)}`;
    } else {
      return `${Math.round(-100 / (decimal - 1))}`;
    }
  };

  const BOOKMAKER_MARGIN = 0.05;
  const probToOdds = (prob: number | undefined | null) => {
    if (prob === undefined || prob === null || prob <= 0) return 99.0;
    const margined = prob * (1.0 - BOOKMAKER_MARGIN);
    if (margined <= 0) return 99.0;
    const val = Number((1.0 / margined).toFixed(2));
    return val > 99.0 ? 99.0 : val;
  };

  const baseHome = 1.3 + pseudoRandom(1) * 3.5;
  const baseAway = 1.3 + pseudoRandom(2) * 3.5;
  const baseDraw = 2.5 + pseudoRandom(3) * 2.0;

  const sum = (1/baseHome) + (1/baseAway) + (1/baseDraw);
  let homeOdds = Number(((1 / (baseHome / sum)) * 1.05).toFixed(2));
  let awayOdds = Number(((1 / (baseAway / sum)) * 1.05).toFixed(2));
  let drawOdds = Number(((1 / (baseDraw / sum)) * 1.05).toFixed(2));

  if (apiMarkets && apiMarkets['1x2']) {
    homeOdds = probToOdds(apiMarkets['1x2'].home_win);
    drawOdds = probToOdds(apiMarkets['1x2'].draw);
    awayOdds = probToOdds(apiMarkets['1x2'].away_win);
  }

  // HT Result
  let htHomeOdds = Number((homeOdds * 1.5).toFixed(2));
  let htDrawOdds = Number((drawOdds * 0.7).toFixed(2));
  let htAwayOdds = Number((awayOdds * 1.5).toFixed(2));
  if (apiMarkets && apiMarkets['halftime_result']) {
    htHomeOdds = probToOdds(apiMarkets['halftime_result'].home_win_ht);
    htDrawOdds = probToOdds(apiMarkets['halftime_result'].draw_ht);
    htAwayOdds = probToOdds(apiMarkets['halftime_result'].away_win_ht);
  }

  // Double Chance
  let dc1x = Number((1 / (1 - 1/awayOdds)).toFixed(2));
  let dc12 = Number((1 / (1 - 1/drawOdds)).toFixed(2));
  let dcx2 = Number((1 / (1 - 1/homeOdds)).toFixed(2));
  if (apiMarkets && apiMarkets['double_chance']) {
    dc1x = probToOdds(apiMarkets['double_chance'].dc_1x);
    dc12 = probToOdds(apiMarkets['double_chance'].dc_12);
    dcx2 = probToOdds(apiMarkets['double_chance'].dc_x2);
  }

  // BTTS
  let bttsYes = 2.05;
  let bttsNo = 1.74;
  if (apiMarkets && apiMarkets['btts']) {
    bttsYes = probToOdds(apiMarkets['btts'].btts_yes);
    bttsNo = probToOdds(apiMarkets['btts'].btts_no);
  }

  // BTTS Result
  let mrbttsHomeYes = Number((homeOdds * 2.1).toFixed(2));
  let mrbttsHomeNo = Number((homeOdds * 1.8).toFixed(2));
  let mrbttsDrawYes = Number((drawOdds * 1.8).toFixed(2));
  let mrbttsDrawNo = Number((drawOdds * 2.2).toFixed(2));
  let mrbttsAwayYes = Number((awayOdds * 2.1).toFixed(2));
  let mrbttsAwayNo = Number((awayOdds * 1.8).toFixed(2));
  if (apiMarkets && apiMarkets['btts_result']) {
    mrbttsHomeYes = probToOdds(apiMarkets['btts_result'].btts_yes_home);
    mrbttsHomeNo = probToOdds(apiMarkets['btts_result'].btts_no_home);
    mrbttsDrawYes = probToOdds(apiMarkets['btts_result'].btts_yes_draw);
    mrbttsDrawNo = probToOdds(apiMarkets['btts_result'].btts_no_draw);
    mrbttsAwayYes = probToOdds(apiMarkets['btts_result'].btts_yes_away);
    mrbttsAwayNo = probToOdds(apiMarkets['btts_result'].btts_no_away);
  }

  // BTTS Total Goals Combos
  let btts25_yy = 2.40, btts25_yn = 10.00, btts25_ny = 8.50, btts25_nn = 2.20;
  let btts35_yy = 4.20, btts35_yn = 2.85, btts35_ny = 6.00, btts35_nn = 1.54;
  let btts45_yy = 7.50, btts45_yn = 2.10, btts45_ny = 11.00, btts45_nn = 1.22;
  let btts55_yy = 13.00, btts55_yn = 1.91, btts55_ny = 19.00, btts55_nn = 1.08;

  if (apiMarkets && apiMarkets['btts_total_goals']) {
    const btg = apiMarkets['btts_total_goals'];
    btts25_yy = probToOdds(btg.btts_yes_over_2_5);
    btts25_yn = probToOdds(btg.btts_yes_under_2_5);
    btts25_ny = probToOdds(btg.btts_no_over_2_5);
    btts25_nn = probToOdds(btg.btts_no_under_2_5);

    btts35_yy = probToOdds(btg.btts_yes_over_3_5);
    btts35_yn = probToOdds(btg.btts_yes_under_3_5);
    btts35_ny = probToOdds(btg.btts_no_over_3_5);
    btts35_nn = probToOdds(btg.btts_no_under_3_5);

    btts45_yy = probToOdds(btg.btts_yes_over_4_5);
    btts45_yn = probToOdds(btg.btts_yes_under_4_5);
    btts45_ny = probToOdds(btg.btts_no_over_4_5);
    btts45_nn = probToOdds(btg.btts_no_under_4_5);

    btts55_yy = probToOdds(btg.btts_yes_over_5_5);
    btts55_yn = probToOdds(btg.btts_yes_under_5_5);
    btts55_ny = probToOdds(btg.btts_no_over_5_5);
    btts55_nn = probToOdds(btg.btts_no_under_5_5);
  }

  // To Win BTTS Combo
  let twbttsHomeYes = Number((homeOdds * 2.2).toFixed(2));
  let twbttsHomeNo = Number((homeOdds * 1.9).toFixed(2));
  let twbttsAwayYes = Number((awayOdds * 2.2).toFixed(2));
  let twbttsAwayNo = Number((awayOdds * 1.9).toFixed(2));
  if (apiMarkets && apiMarkets['btts_result']) {
    twbttsHomeYes = probToOdds(apiMarkets['btts_result'].btts_yes_home);
    twbttsHomeNo = probToOdds(apiMarkets['btts_result'].btts_no_home);
    twbttsAwayYes = probToOdds(apiMarkets['btts_result'].btts_yes_away);
    twbttsAwayNo = probToOdds(apiMarkets['btts_result'].btts_no_away);
  }

  // Win Both Halves
  let wbhHome = 4.00, wbhAway = 8.50;
  if (apiMarkets && apiMarkets['win_both_halves']) {
    wbhHome = probToOdds(apiMarkets['win_both_halves'].home_win_both);
    wbhAway = probToOdds(apiMarkets['win_both_halves'].away_win_both);
  }

  // Match Over/Under Goals
  let tgO15 = 1.22, tgU15 = 4.20;
  let tgO25 = 1.80, tgU25 = 1.95;
  let tgO35 = 3.10, tgU35 = 1.36;
  if (apiMarkets && apiMarkets['over_under']) {
    tgO15 = probToOdds(apiMarkets['over_under'].over_1_5);
    tgU15 = probToOdds(apiMarkets['over_under'].under_1_5);
    tgO25 = probToOdds(apiMarkets['over_under'].over_2_5);
    tgU25 = probToOdds(apiMarkets['over_under'].under_2_5);
    tgO35 = probToOdds(apiMarkets['over_under'].over_3_5);
    tgU35 = probToOdds(apiMarkets['over_under'].under_3_5);
  }

  // Home Team Goals
  let tgHomeO05 = 1.18, tgHomeU05 = 4.60;
  let tgHomeO15 = 2.20, tgHomeU15 = 1.65;
  let tgHomeO25 = 4.80, tgHomeU25 = 1.18;
  if (apiMarkets && apiMarkets['team_total_goals']) {
    tgHomeO05 = probToOdds(apiMarkets['team_total_goals'].home_over_0_5);
    tgHomeU05 = probToOdds(apiMarkets['team_total_goals'].home_under_0_5);
    tgHomeO15 = probToOdds(apiMarkets['team_total_goals'].home_over_1_5);
    tgHomeU15 = probToOdds(apiMarkets['team_total_goals'].home_under_1_5);
    tgHomeO25 = probToOdds(apiMarkets['team_total_goals'].home_over_2_5);
    tgHomeU25 = probToOdds(apiMarkets['team_total_goals'].home_under_2_5);
  }

  // Away Team Goals
  let tgAwayO05 = 1.22, tgAwayU05 = 4.00;
  let tgAwayO15 = 2.85, tgAwayU15 = 1.40;
  let tgAwayO25 = 7.00, tgAwayU25 = 1.10;
  if (apiMarkets && apiMarkets['team_total_goals']) {
    tgAwayO05 = probToOdds(apiMarkets['team_total_goals'].away_over_0_5);
    tgAwayU05 = probToOdds(apiMarkets['team_total_goals'].away_under_0_5);
    tgAwayO15 = probToOdds(apiMarkets['team_total_goals'].away_over_1_5);
    tgAwayU15 = probToOdds(apiMarkets['team_total_goals'].away_under_1_5);
    tgAwayO25 = probToOdds(apiMarkets['team_total_goals'].away_over_2_5);
    tgAwayU25 = probToOdds(apiMarkets['team_total_goals'].away_under_2_5);
  }

  // Corners
  let cornO85 = 1.48, cornU85 = 2.65;
  let cornO95 = 1.83, cornU95 = 1.91;
  let cornO105 = 2.40, cornU105 = 1.56;
  if (apiMarkets && apiMarkets['corners']) {
    cornO85 = probToOdds(apiMarkets['corners'].over_8_5);
    cornU85 = probToOdds(apiMarkets['corners'].under_8_5);
    cornO95 = probToOdds(apiMarkets['corners'].over_9_5);
    cornU95 = probToOdds(apiMarkets['corners'].under_9_5);
    cornO105 = probToOdds(apiMarkets['corners'].over_10_5);
    cornU105 = probToOdds(apiMarkets['corners'].under_10_5);
  }

  // Halftime / Fulltime
  let htftHH = 3.10, htftHD = 15.00, htftHA = 29.00;
  let htftDH = 4.60, htftDD = 5.75, htftDA = 8.50;
  let htftAH = 23.00, htftAD = 15.00, htftAA = 5.50;
  if (apiMarkets && apiMarkets['halftime_fulltime']) {
    const hf = apiMarkets['halftime_fulltime'];
    htftHH = probToOdds(hf.home_home);
    htftHD = probToOdds(hf.home_draw);
    htftHA = probToOdds(hf.home_away);
    htftDH = probToOdds(hf.draw_home);
    htftDD = probToOdds(hf.draw_draw);
    htftDA = probToOdds(hf.draw_away);
    htftAH = probToOdds(hf.away_home);
    htftAD = probToOdds(hf.away_draw);
    htftAA = probToOdds(hf.away_away);
  }

  // Spreads
  let spH1 = 2.75, spT1 = 3.60, spA1 = 1.40;
  let spH2 = 5.00, spT2 = 4.30, spA2 = 1.17;
  let spH3 = 10.00, spT3 = 6.50, spA3 = 1.07;
  if (apiMarkets && apiMarkets['handicap']) {
    const hc = apiMarkets['handicap'];
    spH1 = probToOdds(hc.home_minus_1);
    spT1 = probToOdds(hc.tie_minus_1);
    spA1 = probToOdds(hc.away_plus_1);
    spH2 = probToOdds(hc.home_minus_2);
    spT2 = probToOdds(hc.tie_minus_2);
    spA2 = probToOdds(hc.away_plus_2);
    spH3 = probToOdds(hc.home_minus_3);
    spT3 = probToOdds(hc.tie_minus_3);
    spA3 = probToOdds(hc.away_plus_3);
  }

  // Correct Score
  let cs10 = 7.50, cs20 = 9.50, cs21 = 9.00, cs30 = 19.00, cs31 = 17.00;
  let cs00 = 10.00, cs11 = 7.00, cs22 = 15.00;
  let cs01 = 11.00, cs02 = 19.00, cs12 = 13.00, cs03 = 46.00, cs13 = 36.00;
  let csOther = 6.00;
  if (apiMarkets && apiMarkets['correct_score']) {
    const cs = apiMarkets['correct_score'];
    cs10 = probToOdds(cs['1-0']);
    cs20 = probToOdds(cs['2-0']);
    cs21 = probToOdds(cs['2-1']);
    cs30 = probToOdds(cs['3-0']);
    cs31 = probToOdds(cs['3-1']);
    cs00 = probToOdds(cs['0-0']);
    cs11 = probToOdds(cs['1-1']);
    cs22 = probToOdds(cs['2-2']);
    cs01 = probToOdds(cs['0-1']);
    cs02 = probToOdds(cs['0-2']);
    cs12 = probToOdds(cs['1-2']);
    cs03 = probToOdds(cs['0-3']);
    cs13 = probToOdds(cs['1-3']);

    const knownSum = (cs['1-0'] || 0) + (cs['2-0'] || 0) + (cs['2-1'] || 0) + (cs['3-0'] || 0) + (cs['3-1'] || 0) +
                      (cs['0-0'] || 0) + (cs['1-1'] || 0) + (cs['2-2'] || 0) +
                      (cs['0-1'] || 0) + (cs['0-2'] || 0) + (cs['1-2'] || 0) + (cs['0-3'] || 0) + (cs['1-3'] || 0);
    const otherProb = Math.max(0, 1 - knownSum);
    csOther = probToOdds(otherProb);
  }

  // Draw No Bet
  let dnbHome = Number((homeOdds * 0.7).toFixed(2));
  let dnbAway = Number((awayOdds * 0.7).toFixed(2));
  if (apiMarkets && apiMarkets['draw_no_bet']) {
    dnbHome = probToOdds(apiMarkets['draw_no_bet'].home_dnb);
    dnbAway = probToOdds(apiMarkets['draw_no_bet'].away_dnb);
  }

  // Win From Behind
  let wfbHome = 10.00, wfbAway = 15.00;
  if (apiMarkets && apiMarkets['win_from_behind']) {
    wfbHome = probToOdds(apiMarkets['win_from_behind'].home_comeback);
    wfbAway = probToOdds(apiMarkets['win_from_behind'].away_comeback);
  }

  // Win Either Half
  let wehHome = 1.53, wehAway = 2.40;
  if (apiMarkets && apiMarkets['win_either_half']) {
    wehHome = probToOdds(apiMarkets['win_either_half'].home_win_either);
    wehAway = probToOdds(apiMarkets['win_either_half'].away_win_either);
  }

  // Clean Sheets
  let csHomeYes = 2.75, csHomeNo = 1.44;
  let csAwayYes = 4.20, csAwayNo = 1.22;
  if (apiMarkets && apiMarkets['clean_sheet']) {
    const cs = apiMarkets['clean_sheet'];
    csHomeYes = probToOdds(cs.home_clean_sheet);
    csHomeNo = probToOdds(1.0 - cs.home_clean_sheet);
    csAwayYes = probToOdds(cs.away_clean_sheet);
    csAwayNo = probToOdds(1.0 - cs.away_clean_sheet);
  }

  // Lead At Anytime
  let laaHome = 1.74, laaAway = 2.50;
  if (apiMarkets && apiMarkets['lead_at_anytime']) {
    laaHome = probToOdds(apiMarkets['lead_at_anytime'].home_lead_anytime);
    laaAway = probToOdds(apiMarkets['lead_at_anytime'].away_lead_anytime);
  }

  return [
    {
      id: 'match_result_1x2',
      name: 'Match Result (1X2)',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: homeTeam, odds: formatOdds(homeOdds), decimalOdds: homeOdds },
        { name: 'Tie', odds: formatOdds(drawOdds), decimalOdds: drawOdds },
        { name: awayTeam, odds: formatOdds(awayOdds), decimalOdds: awayOdds }
      ]
    },
    {
      id: 'match_result_1st_half',
      name: '1st Half Result',
      category: 'Halftime',
      sgpBadge: true,
      options: [
        { name: homeTeam, odds: formatOdds(htHomeOdds), decimalOdds: htHomeOdds },
        { name: 'Tie', odds: formatOdds(htDrawOdds), decimalOdds: htDrawOdds },
        { name: awayTeam, odds: formatOdds(htAwayOdds), decimalOdds: htAwayOdds }
      ]
    },
    {
      id: 'match_result_2nd_half',
      name: '2nd Half Result',
      category: 'Halftime',
      sgpBadge: true,
      options: [
        { name: homeTeam, odds: formatOdds(homeOdds * 1.4), decimalOdds: Number((homeOdds * 1.4).toFixed(2)) },
        { name: 'Tie', odds: formatOdds(drawOdds * 0.8), decimalOdds: Number((drawOdds * 0.8).toFixed(2)) },
        { name: awayTeam, odds: formatOdds(awayOdds * 1.4), decimalOdds: Number((awayOdds * 1.4).toFixed(2)) }
      ]
    },
    {
      id: 'pre_built_sgps',
      name: 'Pre-Built SGPs',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: `${homeTeam} Win & Over 2.5 Goals`, odds: formatOdds(homeOdds * 1.5), decimalOdds: Number((homeOdds * 1.5).toFixed(2)) },
        { name: `${awayTeam} Win & Over 2.5 Goals`, odds: formatOdds(awayOdds * 1.5), decimalOdds: Number((awayOdds * 1.5).toFixed(2)) },
        { name: `Draw & Under 2.5 Goals`, odds: formatOdds(drawOdds * 1.2), decimalOdds: Number((drawOdds * 1.2).toFixed(2)) },
        { name: `${homeTeam} Win & BTTS`, odds: formatOdds(homeOdds * 1.8), decimalOdds: Number((homeOdds * 1.8).toFixed(2)) }
      ]
    },
    {
      id: 'double_chance',
      name: 'Double Chance',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: `${homeTeam} or Tie (1X)`, odds: formatOdds(dc1x), decimalOdds: dc1x },
        { name: `${homeTeam} or ${awayTeam} (12)`, odds: formatOdds(dc12), decimalOdds: dc12 },
        { name: `Tie or ${awayTeam} (X2)`, odds: formatOdds(dcx2), decimalOdds: dcx2 }
      ]
    },
    {
      id: 'both_teams_to_score',
      name: 'Both Teams to Score',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: 'Yes', odds: formatOdds(bttsYes), decimalOdds: bttsYes },
        { name: 'No', odds: formatOdds(bttsNo), decimalOdds: bttsNo }
      ]
    },
    {
      id: 'match_result_btts',
      name: 'Match Result and Both Teams to Score',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: `${homeTeam} & Yes`, odds: formatOdds(mrbttsHomeYes), decimalOdds: mrbttsHomeYes },
        { name: `${homeTeam} & No`, odds: formatOdds(mrbttsHomeNo), decimalOdds: mrbttsHomeNo },
        { name: `Draw & Yes`, odds: formatOdds(mrbttsDrawYes), decimalOdds: mrbttsDrawYes },
        { name: `Draw & No`, odds: formatOdds(mrbttsDrawNo), decimalOdds: mrbttsDrawNo },
        { name: `${awayTeam} & Yes`, odds: formatOdds(mrbttsAwayYes), decimalOdds: mrbttsAwayYes },
        { name: `${awayTeam} & No`, odds: formatOdds(mrbttsAwayNo), decimalOdds: mrbttsAwayNo }
      ]
    },
    {
      id: 'btts_either_win',
      name: 'Both Teams to Score & Either Team to Win',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: 'Yes', odds: '+160', decimalOdds: 2.60 },
        { name: 'No', odds: '-210', decimalOdds: 1.48 }
      ]
    },
    {
      id: 'btts_both_halves',
      name: 'Both Teams to Score Both Halves',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: 'Yes', odds: '+1100', decimalOdds: 12.00 },
        { name: 'No', odds: '-3000', decimalOdds: 1.03 }
      ]
    },
    {
      id: 'btts_total_2_5',
      name: 'Both Teams to Score and Total Goals 2.5',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: 'Yes & Over 2.5', odds: formatOdds(btts25_yy), decimalOdds: btts25_yy },
        { name: 'Yes & Under 2.5', odds: formatOdds(btts25_yn), decimalOdds: btts25_yn },
        { name: 'No & Over 2.5', odds: formatOdds(btts25_ny), decimalOdds: btts25_ny },
        { name: 'No & Under 2.5', odds: formatOdds(btts25_nn), decimalOdds: btts25_nn }
      ]
    },
    {
      id: 'btts_total_3_5',
      name: 'Both Teams to Score and Total Goals 3.5',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: 'Yes & Over 3.5', odds: formatOdds(btts35_yy), decimalOdds: btts35_yy },
        { name: 'Yes & Under 3.5', odds: formatOdds(btts35_yn), decimalOdds: btts35_yn },
        { name: 'No & Over 3.5', odds: formatOdds(btts35_ny), decimalOdds: btts35_ny },
        { name: 'No & Under 3.5', odds: formatOdds(btts35_nn), decimalOdds: btts35_nn }
      ]
    },
    {
      id: 'btts_total_4_5',
      name: 'Both Teams to Score and Total Goals 4.5',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: 'Yes & Over 4.5', odds: formatOdds(btts45_yy), decimalOdds: btts45_yy },
        { name: 'Yes & Under 4.5', odds: formatOdds(btts45_yn), decimalOdds: btts45_yn },
        { name: 'No & Over 4.5', odds: formatOdds(btts45_ny), decimalOdds: btts45_ny },
        { name: 'No & Under 4.5', odds: formatOdds(btts45_nn), decimalOdds: btts45_nn }
      ]
    },
    {
      id: 'btts_total_5_5',
      name: 'Both Teams to Score and Total Goals 5.5',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: 'Yes & Over 5.5', odds: formatOdds(btts55_yy), decimalOdds: btts55_yy },
        { name: 'Yes & Under 5.5', odds: formatOdds(btts55_yn), decimalOdds: btts55_yn },
        { name: 'No & Over 5.5', odds: formatOdds(btts55_ny), decimalOdds: btts55_ny },
        { name: 'No & Under 5.5', odds: formatOdds(btts55_nn), decimalOdds: btts55_nn }
      ]
    },
    {
      id: 'to_win_btts',
      name: 'To Win and Both Teams to Score',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: `${homeTeam} & Yes`, odds: formatOdds(twbttsHomeYes), decimalOdds: twbttsHomeYes },
        { name: `${homeTeam} & No`, odds: formatOdds(twbttsHomeNo), decimalOdds: twbttsHomeNo },
        { name: `${awayTeam} & Yes`, odds: formatOdds(twbttsAwayYes), decimalOdds: twbttsAwayYes },
        { name: `${awayTeam} & No`, odds: formatOdds(twbttsAwayNo), decimalOdds: twbttsAwayNo }
      ]
    },
    {
      id: 'win_both_halves',
      name: 'Win Both Halves',
      category: 'SGP',
      sgpBadge: true,
      options: [
        { name: homeTeam, odds: formatOdds(wbhHome), decimalOdds: wbhHome },
        { name: awayTeam, odds: formatOdds(wbhAway), decimalOdds: wbhAway }
      ]
    },
    {
      id: 'total_goals_match',
      name: 'Total Goals (Over/Under)',
      category: 'Totals',
      sgpBadge: false,
      options: [
        { name: 'Over 0.5', odds: '-1500', decimalOdds: 1.07 },
        { name: 'Under 0.5', odds: '+800', decimalOdds: 9.00 },
        { name: 'Over 1.5', odds: formatOdds(tgO15), decimalOdds: tgO15 },
        { name: 'Under 1.5', odds: formatOdds(tgU15), decimalOdds: tgU15 },
        { name: 'Over 2.5', odds: formatOdds(tgO25), decimalOdds: tgO25 },
        { name: 'Under 2.5', odds: formatOdds(tgU25), decimalOdds: tgU25 },
        { name: 'Over 3.5', odds: formatOdds(tgO35), decimalOdds: tgO35 },
        { name: 'Under 3.5', odds: formatOdds(tgU35), decimalOdds: tgU35 },
        { name: 'Over 4.5', odds: '+475', decimalOdds: 5.75 },
        { name: 'Under 4.5', odds: '-700', decimalOdds: 1.14 },
        { name: 'Over 5.5', odds: '+950', decimalOdds: 10.50 },
        { name: 'Under 5.5', odds: '-2000', decimalOdds: 1.05 }
      ]
    },
    {
      id: 'total_goals_home',
      name: `Home Team Goals (${homeTeam})`,
      category: 'Totals',
      sgpBadge: false,
      options: [
        { name: 'Over 0.5', odds: formatOdds(tgHomeO05), decimalOdds: tgHomeO05 },
        { name: 'Under 0.5', odds: formatOdds(tgHomeU05), decimalOdds: tgHomeU05 },
        { name: 'Over 1.5', odds: formatOdds(tgHomeO15), decimalOdds: tgHomeO15 },
        { name: 'Under 1.5', odds: formatOdds(tgHomeU15), decimalOdds: tgHomeU15 },
        { name: 'Over 2.5', odds: formatOdds(tgHomeO25), decimalOdds: tgHomeO25 },
        { name: 'Under 2.5', odds: formatOdds(tgHomeU25), decimalOdds: tgHomeU25 }
      ]
    },
    {
      id: 'total_goals_away',
      name: `Away Team Goals (${awayTeam})`,
      category: 'Totals',
      sgpBadge: false,
      options: [
        { name: 'Over 0.5', odds: formatOdds(tgAwayO05), decimalOdds: tgAwayO05 },
        { name: 'Under 0.5', odds: formatOdds(tgAwayU05), decimalOdds: tgAwayU05 },
        { name: 'Over 1.5', odds: formatOdds(tgAwayO15), decimalOdds: tgAwayO15 },
        { name: 'Under 1.5', odds: formatOdds(tgAwayU15), decimalOdds: tgAwayU15 },
        { name: 'Over 2.5', odds: formatOdds(tgAwayO25), decimalOdds: tgAwayO25 },
        { name: 'Under 2.5', odds: formatOdds(tgAwayU25), decimalOdds: tgAwayU25 }
      ]
    },
    {
      id: 'total_corners',
      name: 'Total Corners (Over/Under)',
      category: 'Corners',
      sgpBadge: false,
      options: [
        { name: 'Over 7.5', odds: '-350', decimalOdds: 1.29 },
        { name: 'Under 7.5', odds: '+250', decimalOdds: 3.50 },
        { name: 'Over 8.5', odds: formatOdds(cornO85), decimalOdds: cornO85 },
        { name: 'Under 8.5', odds: formatOdds(cornU85), decimalOdds: cornU85 },
        { name: 'Over 9.5', odds: formatOdds(cornO95), decimalOdds: cornO95 },
        { name: 'Under 9.5', odds: formatOdds(cornU95), decimalOdds: cornU95 },
        { name: 'Over 10.5', odds: formatOdds(cornO105), decimalOdds: cornO105 },
        { name: 'Under 10.5', odds: formatOdds(cornU105), decimalOdds: cornU105 },
        { name: 'Over 11.5', odds: '+225', decimalOdds: 3.25 },
        { name: 'Under 11.5', odds: '-300', decimalOdds: 1.33 }
      ]
    },
    {
      id: 'halftime_result_1x2',
      name: 'Halftime Result',
      category: 'Halftime',
      sgpBadge: false,
      options: [
        { name: homeTeam, odds: formatOdds(htHomeOdds), decimalOdds: htHomeOdds },
        { name: 'Tie', odds: formatOdds(htDrawOdds), decimalOdds: htDrawOdds },
        { name: awayTeam, odds: formatOdds(htAwayOdds), decimalOdds: htAwayOdds }
      ]
    },
    {
      id: 'halftime_fulltime',
      name: 'Halftime / Fulltime',
      category: 'Halftime',
      sgpBadge: false,
      options: [
        { name: 'Home / Home', odds: formatOdds(htftHH), decimalOdds: htftHH },
        { name: 'Home / Draw', odds: formatOdds(htftHD), decimalOdds: htftHD },
        { name: 'Home / Away', odds: formatOdds(htftHA), decimalOdds: htftHA },
        { name: 'Draw / Home', odds: formatOdds(htftDH), decimalOdds: htftDH },
        { name: 'Draw / Draw', odds: formatOdds(htftDD), decimalOdds: htftDD },
        { name: 'Draw / Away', odds: formatOdds(htftDA), decimalOdds: htftDA },
        { name: 'Away / Home', odds: formatOdds(htftAH), decimalOdds: htftAH },
        { name: 'Away / Draw', odds: formatOdds(htftAD), decimalOdds: htftAD },
        { name: 'Away / Away', odds: formatOdds(htftAA), decimalOdds: htftAA }
      ]
    },
    {
      id: 'halftime_or_fulltime',
      name: 'Halftime or Fulltime',
      category: 'Halftime',
      sgpBadge: false,
      options: [
        { name: homeTeam, odds: '-190', decimalOdds: 1.53 },
        { name: 'Draw', odds: '-135', decimalOdds: 1.74 },
        { name: awayTeam, odds: '+140', decimalOdds: 2.40 }
      ]
    },
    {
      id: 'spreads',
      name: '3-Way Spread',
      category: 'Spreads',
      sgpBadge: false,
      options: [
        { name: `${homeTeam} (-1)`, odds: formatOdds(spH1), decimalOdds: spH1 },
        { name: `Tie (-1)`, odds: formatOdds(spT1), decimalOdds: spT1 },
        { name: `${awayTeam} (+1)`, odds: formatOdds(spA1), decimalOdds: spA1 },
        { name: `${homeTeam} (-2)`, odds: formatOdds(spH2), decimalOdds: spH2 },
        { name: `Tie (-2)`, odds: formatOdds(spT2), decimalOdds: spT2 },
        { name: `${awayTeam} (+2)`, odds: formatOdds(spA2), decimalOdds: spA2 },
        { name: `${homeTeam} (-3)`, odds: formatOdds(spH3), decimalOdds: spH3 },
        { name: `Tie (-3)`, odds: formatOdds(spT3), decimalOdds: spT3 },
        { name: `${awayTeam} (+3)`, odds: formatOdds(spA3), decimalOdds: spA3 }
      ]
    },
    {
      id: 'spreads_1st_half',
      name: '3-Way Spread 1st Half',
      category: 'Spreads',
      sgpBadge: false,
      options: [
        { name: `${homeTeam} (-1) 1H`, odds: '+425', decimalOdds: 5.25 },
        { name: `Tie (-1) 1H`, odds: '+220', decimalOdds: 3.20 },
        { name: `${awayTeam} (+1) 1H`, odds: '-700', decimalOdds: 1.14 },
        { name: `${homeTeam} (-2) 1H`, odds: '+1400', decimalOdds: 15.00 },
        { name: `Tie (-2) 1H`, odds: '+500', decimalOdds: 6.00 },
        { name: `${awayTeam} (+2) 1H`, odds: '-3000', decimalOdds: 1.03 }
      ]
    },
    {
      id: 'correct_score',
      name: 'Correct Score',
      category: 'Correct Score',
      sgpBadge: false,
      options: [
        { name: '1-0', odds: formatOdds(cs10), decimalOdds: cs10 },
        { name: '2-0', odds: formatOdds(cs20), decimalOdds: cs20 },
        { name: '2-1', odds: formatOdds(cs21), decimalOdds: cs21 },
        { name: '3-0', odds: formatOdds(cs30), decimalOdds: cs30 },
        { name: '3-1', odds: formatOdds(cs31), decimalOdds: cs31 },
        { name: '0-0', odds: formatOdds(cs00), decimalOdds: cs00 },
        { name: '1-1', odds: formatOdds(cs11), decimalOdds: cs11 },
        { name: '2-2', odds: formatOdds(cs22), decimalOdds: cs22 },
        { name: '0-1', odds: formatOdds(cs01), decimalOdds: cs01 },
        { name: '0-2', odds: formatOdds(cs02), decimalOdds: cs02 },
        { name: '1-2', odds: formatOdds(cs12), decimalOdds: cs12 },
        { name: '0-3', odds: formatOdds(cs03), decimalOdds: cs03 },
        { name: '1-3', odds: formatOdds(cs13), decimalOdds: cs13 },
        { name: 'Other', odds: formatOdds(csOther), decimalOdds: csOther }
      ]
    },
    {
      id: 'draw_no_bet',
      name: 'Draw No Bet',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: homeTeam, odds: formatOdds(dnbHome), decimalOdds: dnbHome },
        { name: awayTeam, odds: formatOdds(dnbAway), decimalOdds: dnbAway }
      ]
    },
    {
      id: 'home_no_bet',
      name: 'Home No Bet / Away No Bet',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: `Draw (${awayTeam} No Bet)`, odds: '+150', decimalOdds: 2.50 },
        { name: `${homeTeam} (${awayTeam} No Bet)`, odds: '-190', decimalOdds: 1.53 },
        { name: `${awayTeam} (${homeTeam} No Bet)`, odds: '+170', decimalOdds: 2.70 },
        { name: `Draw (${homeTeam} No Bet)`, odds: '-220', decimalOdds: 1.45 }
      ]
    },
    {
      id: 'home_to_win_and_btts',
      name: 'Home/Away to Win & Both Teams to Score',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: `${homeTeam} & Yes`, odds: '+350', decimalOdds: 4.50 },
        { name: `${awayTeam} & Yes`, odds: '+650', decimalOdds: 7.50 }
      ]
    },
    {
      id: 'double_chance_and_btts',
      name: 'Double Chance & Both Teams to Score',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: '1X & Yes', odds: '+135', decimalOdds: 2.35 },
        { name: 'X2 & Yes', odds: '+190', decimalOdds: 2.90 },
        { name: '12 & Yes', odds: '+140', decimalOdds: 2.40 }
      ]
    },
    {
      id: 'home_to_score',
      name: 'Home to Score / Away to Score',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: `${homeTeam} to Score`, odds: '-450', decimalOdds: 1.22 },
        { name: `${awayTeam} to Score`, odds: '-250', decimalOdds: 1.40 }
      ]
    },
    {
      id: 'win_from_behind',
      name: 'Win from Behind',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: homeTeam, odds: formatOdds(wfbHome), decimalOdds: wfbHome },
        { name: awayTeam, odds: formatOdds(wfbAway), decimalOdds: wfbAway }
      ]
    },
    {
      id: 'any_team_from_behind',
      name: 'Any Team to Come from Behind and Win',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: 'Yes', odds: '+550', decimalOdds: 6.50 },
        { name: 'No', odds: '-900', decimalOdds: 1.11 }
      ]
    },
    {
      id: 'win_either_half',
      name: 'Win Either Half',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: homeTeam, odds: formatOdds(wehHome), decimalOdds: wehHome },
        { name: awayTeam, odds: formatOdds(wehAway), decimalOdds: wehAway }
      ]
    },
    {
      id: 'clean_sheet',
      name: 'Home Clean Sheet / Away Clean Sheet',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: `${homeTeam} Clean Sheet - Yes`, odds: formatOdds(csHomeYes), decimalOdds: csHomeYes },
        { name: `${homeTeam} Clean Sheet - No`, odds: formatOdds(csHomeNo), decimalOdds: csHomeNo },
        { name: `${awayTeam} Clean Sheet - Yes`, odds: formatOdds(csAwayYes), decimalOdds: csAwayYes },
        { name: `${awayTeam} Clean Sheet - No`, odds: formatOdds(csAwayNo), decimalOdds: csAwayNo }
      ]
    },
    {
      id: 'lead_at_anytime',
      name: 'Home/Away to Lead at Anytime',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: homeTeam, odds: formatOdds(laaHome), decimalOdds: laaHome },
        { name: awayTeam, odds: formatOdds(laaAway), decimalOdds: laaAway }
      ]
    },
    {
      id: 'run_of_play',
      name: 'Run of Play',
      category: 'All',
      sgpBadge: false,
      options: [
        { name: `${homeTeam} first to lead`, odds: '-110', decimalOdds: 1.91 },
        { name: `No lead change`, odds: '+145', decimalOdds: 2.45 },
        { name: `${awayTeam} first to lead`, odds: '+175', decimalOdds: 2.75 }
      ]
    }
  ];
}
