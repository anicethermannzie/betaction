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
  /**
   * Tagged by match-service when it groups a day's fixtures (see
   * matchController.getMatchesByDate). Optional because single-fixture endpoints
   * do not set it. Declared here so callers stop casting through `any`.
   */
  competition_type?: CompetitionType;
}

export interface ApiEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
  comments?: string | null;
}

// ── Match momentum ─────────────────────────────────────────────────────────

/**
 * Built only from real, timestamped match events (goals, cards) — see
 * backend/match-service/src/services/momentumCalculator.js's file header for
 * why shots/corners/dangerous-attacks are not part of this, unlike
 * SofaScore's proprietary shot-tracking feed.
 */
export interface MomentumWindow {
  minute: number;
  home_score: number;
  away_score: number;
}

export interface MomentumMarker {
  minute: number;
  type: 'goal' | 'red_card';
  team: 'home' | 'away';
  player: string | null;
}

export interface MatchMomentum {
  windows: MomentumWindow[];
  markers: MomentumMarker[];
}

// ── Live odds ────────────────────────────────────────────────────────────────

export type OddsMovementDirection = 'up' | 'down' | 'stable';

export interface OddsMovement {
  home: OddsMovementDirection;
  draw: OddsMovementDirection;
  away: OddsMovementDirection;
}

export interface LiveOdds {
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  bookmaker?: string;
  movement: OddsMovement;
  last_updated: string;
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

/**
 * Secondary markets returned by prediction-service.
 *
 * Every field is optional for two reasons: the algorithm omits a market it has
 * no data for, and the server withholds VIP-only markets from free callers
 * (see backend/prediction-service/src/services/entitlements.py). Code that reads
 * these must treat "absent" as "do not display", never as "substitute a value".
 */
export interface PredictionMarkets {
  '1x2'?:              { home_win: number; draw: number; away_win: number };
  over_under?:         { over_1_5: number; under_1_5: number; over_2_5: number; under_2_5: number; over_3_5: number; under_3_5: number };
  btts?:               { btts_yes: number; btts_no: number };
  corners?:            { over_8_5: number; under_8_5: number; over_9_5: number; under_9_5: number; over_10_5: number; under_10_5: number };
  double_chance?:      { dc_1x: number; dc_12: number; dc_x2: number };
  clean_sheet?:        { home_clean_sheet: number; away_clean_sheet: number };
  correct_score?:      Record<string, number>;
  halftime_fulltime?:  { home_home: number; draw_home: number; away_home: number; home_draw: number; draw_draw: number; away_draw: number; home_away: number; draw_away: number; away_away: number };
  halftime_result?:    { home_win_ht: number; draw_ht: number; away_win_ht: number };
  team_total_goals?:   { home_over_0_5: number; home_over_1_5: number; home_over_2_5: number; away_over_0_5: number; away_over_1_5: number; away_over_2_5: number; home_under_0_5: number; home_under_1_5: number; home_under_2_5: number; away_under_0_5: number; away_under_1_5: number; away_under_2_5: number };
  win_both_halves?:    { home_win_both: number; away_win_both: number };
  win_either_half?:    { home_win_either: number; away_win_either: number };
  win_from_behind?:    { home_comeback: number; away_comeback: number; any_comeback: number };
  draw_no_bet?:        { home_dnb: number; away_dnb: number };
  handicap?:           { home_minus_1: number; tie_minus_1: number; away_plus_1: number; home_minus_2: number; tie_minus_2: number; away_plus_2: number; home_minus_3: number; tie_minus_3: number; away_plus_3: number };
  btts_result?:        { btts_yes_home: number; btts_yes_draw: number; btts_yes_away: number; btts_no_home: number; btts_no_draw: number; btts_no_away: number };
  btts_total_goals?:   Record<string, number>;
  lead_at_anytime?:    { home_lead_anytime: number; away_lead_anytime: number };
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
  /** Withheld from free callers — the breakdown is a VIP entitlement. */
  factors?: PredictionFactors | null;
  cached: boolean;
  generated_at: string;
  markets?: PredictionMarkets;
}

/** Plan context the API attaches to every prediction response. */
export interface EntitlementMeta {
  /** Plan the server applied when shaping this response. */
  plan?: 'free' | 'vip';
  /** True when content was withheld because of that plan. */
  limited?: boolean;
}

export interface PredictionResponse extends EntitlementMeta {
  success: boolean;
  data: Prediction;
}

export interface PredictionListResponse extends EntitlementMeta {
  success: boolean;
  count: number;
  data: Prediction[];
}

// ── Deep analysis (AI Insights tab) ───────────────────────────────────────────

/**
 * Every field below is optional because the backend genuinely omits it for a
 * free caller (see backend/prediction-service/src/services/entitlements.py's
 * limit_deep_analysis) — this is the server-shaped response itself, not a
 * client-side guess at what to hide. `{}` from the API becomes `undefined`
 * here consistently: components should treat "missing" as "not entitled or
 * not available", never fill in a placeholder.
 */
export interface FinalRecommendation {
  market: string | null;
  odds?: number;
  confidence: number;
  /** VIP only. */
  reasoning?: string;
  /** VIP only. */
  all_markets?: Array<{ market: string; label: string; odds: number; in_target_range: boolean }>;
  warning?: string | null;
  never_guaranteed: boolean;
  disclaimer?: string;
}

export interface OddsAnomalySummary {
  anomaly_detected: boolean;
  insufficient_data: boolean;
  /** VIP only. */
  favorite?: string | null;
  /** VIP only. */
  favorite_odds?: number;
  /** VIP only. */
  favorite_implied_probability?: number;
  /** VIP only. */
  anomaly_reasons?: string[];
  /** VIP only. */
  is_high_value_match?: boolean;
}

export interface TopVsBottomSummary {
  is_top_vs_bottom?: boolean;
  top_team?: 'home' | 'away';
  bottom_team?: 'home' | 'away';
  top_position?: number;
  bottom_position?: number;
  position_gap?: number;
  has_odds_anomaly?: boolean;
  alert_message?: string | null;
  recommended_markets?: Array<{ market: string; selection: string; reasoning: string; priority: number }>;
}

export interface SmartFilterSummary {
  is_interesting?: boolean;
  recommended_market?: string | null;
  recommended_market_odds?: number;
  reasoning?: string;
  confidence_score?: number;
  all_markets?: Array<{ market: string; label: string; odds: number; in_target_range: boolean }>;
}

export interface DeepAnalysisData {
  odds_analysis: OddsAnomalySummary;
  home_form?: Record<string, unknown>;
  away_form?: Record<string, unknown>;
  h2h?: Record<string, unknown>;
  standings?: Record<string, unknown>;
  top_vs_bottom: TopVsBottomSummary;
  smart_filter: SmartFilterSummary;
  final_recommendation: FinalRecommendation;
}

export interface DeepAnalysisResponse extends EntitlementMeta {
  success: boolean;
  fixture_id: number;
  data: DeepAnalysisData;
  disclaimer: string;
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  /** Subscription plan. Authoritative copy lives in the JWT/database — this
   * is a display convenience only, refreshed on login/token-refresh. */
  plan?: 'free' | 'vip';
  /** ISO timestamp; null once the account has never had or has used its trial. */
  trialEndsAt?: string | null;
}

// ── Billing ────────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface SubscriptionDetail {
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * GET /api/auth/billing/status response. Deliberately client-agnostic — no
 * Stripe ids, no web-specific fields — so a future mobile client can call the
 * exact same endpoint read-only. See backend/auth-service/src/controllers/
 * billingController.js for the server-side reasoning.
 */
export interface BillingStatus {
  plan: 'free' | 'vip';
  trialEndsAt: string | null;
  subscription: SubscriptionDetail | null;
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
