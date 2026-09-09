// ── API-Football raw fixture shape (what match-service proxies) ──────────────

export interface ApiStatus {
  short: string;
  long: string;
  elapsed: number | null;
}

export interface ApiTeam {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}

export interface ApiLeague {
  id: number;
  name: string;
  logo: string;
  country: string;
  season: number;
  round?: string;
}

export interface ApiGoals {
  home: number | null;
  away: number | null;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: ApiStatus;
    timezone?: string;
    venue?: { name: string; city: string } | null;
  };
  league: ApiLeague;
  teams: {
    home: ApiTeam;
    away: ApiTeam;
  };
  goals: ApiGoals;
  events?: ApiEvent[];
}

export interface ApiEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

// ── match-service envelope ────────────────────────────────────────────────────

export interface MatchServiceResponse<T = ApiFixture[]> {
  success: boolean;
  results?: number;
  response: T;
}

// ── prediction-service types (snake_case — FastAPI / Pydantic defaults) ───────

export interface PredictionFactors {
  home_form_score: number;
  away_form_score: number;
  home_h2h_score: number;
  away_h2h_score: number;
  home_expected_goals: number;
  away_expected_goals: number;
  home_home_win_rate: number;
  away_away_win_rate: number;
}

export interface Prediction {
  fixture_id: number;
  home_team: string;
  away_team: string;
  home_team_id: number;
  away_team_id: number;
  league_id: number;
  season: number;
  home_win: number;
  draw: number;
  away_win: number;
  prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  confidence: 'high' | 'medium' | 'low';
  factors: PredictionFactors;
  cached: boolean;
  generated_at: string;
  markets?: any;
}

export interface PredictionResponse {
  success: boolean;
  data: Prediction;
}

export interface PredictionListResponse {
  success: boolean;
  count: number;
  data: Prediction[];
}

export interface SmartMarket { market: string; label: string; odds: number; in_target_range: boolean }
export interface SmartAnalysis { recommended_market: 'win' | 'double_chance' | 'over_15' | 'team_to_score'; recommended_market_odds: number; reasoning: string; confidence_score: number; favorite: 'home' | 'away'; consecutive_wins: number; all_markets: SmartMarket[] }
export interface TopVsBottomAnalysis { is_top_vs_bottom: boolean; top_position?: number; bottom_position?: number; position_gap?: number; has_odds_anomaly?: boolean; alert_message?: string | null; recommended_markets?: Array<Record<string, unknown>> }
export interface SmartPick { fixture_id: number; home_team: string; away_team: string; league: string; league_flag?: string; kickoff: string; smart_analysis: SmartAnalysis; top_vs_bottom?: TopVsBottomAnalysis }
export interface DeepAnalysis { odds_analysis: { anomaly_detected: boolean; anomaly_reasons: string[] }; home_form: AnalysisForm; away_form: AnalysisForm; h2h: { meetings: Array<Record<string, unknown>>; summary: Record<string, string | number> }; standings: { home: StandingContext; away: StandingContext; position_gap: number }; top_vs_bottom: TopVsBottomAnalysis; final_recommendation: { market: string | null; odds?: number; reasoning: string; confidence: number; all_markets?: SmartMarket[]; disclaimer?: string } }
export interface AnalysisForm { matches: Array<{ result: 'W' | 'D' | 'L'; score?: string; opponent?: string; goals_scored?: number; goals_conceded?: number }>; summary: { goals_scored_avg?: number; goals_conceded_avg?: number; trend?: string; form_string?: string } }
export interface StandingContext { position: number; points: number; goal_difference: number }

// ── Auth types ────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── Standings ────────────────────────────────────────────────────────────────

export interface Standing {
  rank: number;
  team: ApiTeam;
  points: number;
  goalsDiff: number;
  group?: string;
  form?: string;
  status?: string;
  description?: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

// ── Sidebar / navigation data ─────────────────────────────────────────────────

export interface PopularLeague {
  id: number;
  name: string;
  country: string;
  flag: string;
}

export const POPULAR_LEAGUES: PopularLeague[] = [
  { id: 39,  name: 'Premier League',    country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga',           country: 'Spain',   flag: '🇪🇸' },
  { id: 135, name: 'Serie A',           country: 'Italy',   flag: '🇮🇹' },
  { id: 78,  name: 'Bundesliga',        country: 'Germany', flag: '🇩🇪' },
  { id: 61,  name: 'Ligue 1',           country: 'France',  flag: '🇫🇷' },
  { id: 2,   name: 'Champions League',  country: 'Europe',  flag: '🏆' },
  { id: 253, name: 'MLS',               country: 'USA',     flag: '🇺🇸' },
];

// ── Lightweight league / team shapes (favorites + league priority system) ─────
// Deliberately looser than ApiLeague / ApiTeam — a favorite only needs enough
// to render a pill and link to a page. `flag`/`logo` are optional so callers
// can pass whatever they have on hand (fixture league, popular-league config…).

export interface League {
  id:       number;
  name:     string;
  country?: string;
  flag?:    string;
  logo?:    string;
}

export interface Team {
  id:      number;
  name:    string;
  logo?:   string;
  country?: string;
}

// ── Prediction detail page (form, H2H, stats, odds) ──────────────────────────

export interface FormResult {
  date:     string;   // 'YYYY-MM-DD'
  opponent: string;
  score:    string;   // e.g. "2-1"
  isHome:   boolean;
  result:   'W' | 'D' | 'L';
}

export interface H2HMatch {
  date:        string;
  competition: string;
  homeTeam:    string;
  awayTeam:    string;
  homeGoals:   number;
  awayGoals:   number;
}

export interface TeamStats {
  goalsScored:    number; // per-match average
  goalsConceded:  number; // per-match average
  shotsOnTarget:  number; // per-match average
  possession:     number; // 0–100 %
  cleanSheets:    number; // count (last 10 matches)
  cornersPerGame: number; // per-match average
}

export interface MatchOdds {
  homeWin:   number; // decimal odds
  draw:      number;
  awayWin:   number;
  bookmaker: string;
}

export interface PredictionDetail {
  homeForm:  FormResult[];
  awayForm:  FormResult[];
  h2h:       H2HMatch[];
  homeStats: TeamStats;
  awayStats: TeamStats;
  odds?:     MatchOdds;
}

// ── Ticket / Multi-market types ───────────────────────────────────────────────

export type TicketTierKey = 'ultra_safe' | 'safe' | 'moderate' | 'risky';

export type BetMarket =
  | 'home_win' | 'draw' | 'away_win'
  | 'over_1_5' | 'under_1_5' | 'over_2_5' | 'under_2_5' | 'over_3_5' | 'under_3_5'
  | 'btts_yes' | 'btts_no'
  | 'over_8_5' | 'under_8_5' | 'over_9_5' | 'under_9_5' | 'over_10_5' | 'under_10_5'
  | 'dc_1x' | 'dc_12' | 'dc_x2'
  | 'home_clean_sheet' | 'away_clean_sheet';

export interface TicketLeg {
  fixture_id:  number;
  match:       string;
  league:      string;
  kickoff:     string | null;
  market:      BetMarket | string;
  selection:   string;
  probability: number;
  odds:        number;
}

export interface Ticket {
  id:                        string;
  tier:                      TicketTierKey;
  name:                      string;
  emoji:                     string;
  description:               string;
  legs:                      TicketLeg[];
  combined_odds:             number;
  combined_probability:      number;
  potential_return_per_unit: number;
  confidence:                'high' | 'medium' | 'low';
  generated_at:              string;
  type?:                     'custom' | 'ai_generated';
}

export interface TicketResponse {
  success: boolean;
  count:   number;
  data:    Ticket[];
}

export interface MarketPrediction {
  over_under:    { over_1_5: number; under_1_5: number; over_2_5: number; under_2_5: number; over_3_5: number; under_3_5: number };
  btts:          { btts_yes: number; btts_no: number };
  corners:       { over_8_5: number; under_8_5: number; over_9_5: number; under_9_5: number; over_10_5: number; under_10_5: number };
  double_chance: { dc_1x: number; dc_12: number; dc_x2: number };
  clean_sheet:   { home_clean_sheet: number; away_clean_sheet: number };
}

// ── Socket.io payloads ────────────────────────────────────────────────────────

export interface LiveScorePayload {
  matchId: number;
  score: { home: number; away: number };
  minute: number;
  status: string;
}

export interface GoalPayload {
  matchId: number;
  team: string;
  scorer: string;
  minute: number;
  newScore: { home: number; away: number };
}

export interface MatchStartedPayload {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
}

// ── Bet Slip & Market Redesign Types ──────────────────────────────────────────

export type CompetitionType = 'club' | 'international';

export interface Match extends ApiFixture {
  competition_type?: CompetitionType;
}

export type MarketCategory = 'SGP' | 'Totals' | 'Corners' | 'Halftime' | 'Correct Score' | 'Spreads' | 'All';

export interface BetSelection {
  id: string; // "matchId:market:selection"
  matchId: number;
  matchName: string;
  market: string;
  selection: string;
  odds: number; // decimal odds
}

export interface BetSlip {
  selections: BetSelection[];
  betAmount: number;
  isExpanded: boolean;
}
