import type { MarketCategory, PredictionMarkets } from '@/types';

/**
 * Builds the betting-market grid from prediction-service output.
 *
 * This replaces `generateMarketsForMatch` in the old lib/mockData.ts, which
 * seeded prices from `Math.sin(fixtureId)` and only overwrote them where the API
 * happened to supply a probability. Markets the API never returns — the
 * btts/total-goals combinations, 2nd-half result, "pre-built SGPs" — kept the
 * invented numbers all the way to the bet slip. Users could stake real money on
 * a sine wave.
 *
 * The rule here: **every price traces back to a probability the model produced.**
 * A market with no probability is not rendered. Fewer markets is the correct
 * outcome; an invented one is not.
 *
 * The prices are model-implied, not bookmaker quotes: probability is converted
 * with a fixed margin so the figures are comparable to a book's. They are an
 * estimate of fair value, which is what the product is selling.
 */

export interface MarketOption {
  name: string;
  odds: string;          // American format, for display
  decimalOdds: number;   // Decimal, used for payout maths
}

export interface Market {
  id: string;
  name: string;
  category: MarketCategory;
  sgpBadge: boolean;
  options: MarketOption[];
}

/** Margin applied when turning a model probability into a displayed price. */
const MODEL_MARGIN = 0.05;

/** Longest price shown; beyond this the estimate is not meaningful. */
const MAX_ODDS = 99.0;

function toDecimal(probability: number | undefined | null): number | null {
  if (probability === undefined || probability === null) return null;
  if (!Number.isFinite(probability) || probability <= 0) return null;

  const margined = probability * (1 - MODEL_MARGIN);
  if (margined <= 0) return null;

  const decimal = Number((1 / margined).toFixed(2));
  if (decimal <= 1) return null;
  return Math.min(decimal, MAX_ODDS);
}

function toAmerican(decimal: number): string {
  return decimal >= 2
    ? `+${Math.round((decimal - 1) * 100)}`
    : `${Math.round(-100 / (decimal - 1))}`;
}

/** Build one option, or null when the probability behind it is missing. */
function option(name: string, probability: number | undefined | null): MarketOption | null {
  const decimal = toDecimal(probability);
  if (decimal === null) return null;
  return { name, odds: toAmerican(decimal), decimalOdds: decimal };
}

/**
 * Assemble a market from its options, dropping any that lack data.
 * Returns null if nothing priceable is left — the market is then not displayed.
 */
function market(
  id: string,
  name: string,
  category: MarketCategory,
  sgpBadge: boolean,
  options: (MarketOption | null)[],
): Market | null {
  const priced = options.filter((o): o is MarketOption => o !== null);
  if (priced.length === 0) return null;
  return { id, name, category, sgpBadge, options: priced };
}

/**
 * Convert prediction-service markets into the display model.
 *
 * @param markets  `prediction.markets` — undefined when the prediction failed to
 *                 load or when the caller's plan does not include markets.
 * @returns        Only the markets backed by real probabilities. Possibly empty.
 */
export function buildMarkets(
  markets: PredictionMarkets | undefined,
  homeTeam: string,
  awayTeam: string,
): Market[] {
  if (!markets) return [];

  const built: (Market | null)[] = [];

  // ── Match result ──────────────────────────────────────────────────────────
  const oneXTwo = markets['1x2'];
  if (oneXTwo) {
    built.push(market('match_result_1x2', 'Match Result (1X2)', 'SGP', true, [
      option(homeTeam, oneXTwo.home_win),
      option('Tie', oneXTwo.draw),
      option(awayTeam, oneXTwo.away_win),
    ]));
  }

  // ── Halftime ──────────────────────────────────────────────────────────────
  const ht = markets.halftime_result;
  if (ht) {
    built.push(market('match_result_1st_half', '1st Half Result', 'Halftime', true, [
      option(homeTeam, ht.home_win_ht),
      option('Tie', ht.draw_ht),
      option(awayTeam, ht.away_win_ht),
    ]));
  }

  // NOTE: there is deliberately no 'match_result_2nd_half'. The algorithm does
  // not model second-half-only results; the old code faked it by multiplying the
  // full-time price by 1.4.

  const htft = markets.halftime_fulltime;
  if (htft) {
    built.push(market('halftime_fulltime', 'Halftime / Fulltime', 'Halftime', false, [
      option(`${homeTeam} / ${homeTeam}`, htft.home_home),
      option(`Tie / ${homeTeam}`, htft.draw_home),
      option(`${awayTeam} / ${homeTeam}`, htft.away_home),
      option(`${homeTeam} / Tie`, htft.home_draw),
      option('Tie / Tie', htft.draw_draw),
      option(`${awayTeam} / Tie`, htft.away_draw),
      option(`${homeTeam} / ${awayTeam}`, htft.home_away),
      option(`Tie / ${awayTeam}`, htft.draw_away),
      option(`${awayTeam} / ${awayTeam}`, htft.away_away),
    ]));
  }

  const wbh = markets.win_both_halves;
  if (wbh) {
    built.push(market('win_both_halves', 'To Win Both Halves', 'SGP', true, [
      option(homeTeam, wbh.home_win_both),
      option(awayTeam, wbh.away_win_both),
    ]));
  }

  const weh = markets.win_either_half;
  if (weh) {
    built.push(market('win_either_half', 'To Win Either Half', 'All', false, [
      option(homeTeam, weh.home_win_either),
      option(awayTeam, weh.away_win_either),
    ]));
  }

  // ── Double chance ─────────────────────────────────────────────────────────
  const dc = markets.double_chance;
  if (dc) {
    built.push(market('double_chance', 'Double Chance', 'SGP', true, [
      option(`${homeTeam} or Tie (1X)`, dc.dc_1x),
      option(`${homeTeam} or ${awayTeam} (12)`, dc.dc_12),
      option(`Tie or ${awayTeam} (X2)`, dc.dc_x2),
    ]));
  }

  // ── Both teams to score ───────────────────────────────────────────────────
  const btts = markets.btts;
  if (btts) {
    built.push(market('both_teams_to_score', 'Both Teams to Score', 'SGP', true, [
      option('Yes', btts.btts_yes),
      option('No', btts.btts_no),
    ]));
  }

  const bttsResult = markets.btts_result;
  if (bttsResult) {
    built.push(market('match_result_btts', 'Match Result and Both Teams to Score', 'SGP', true, [
      option(`${homeTeam} & Yes`, bttsResult.btts_yes_home),
      option(`${homeTeam} & No`, bttsResult.btts_no_home),
      option('Draw & Yes', bttsResult.btts_yes_draw),
      option('Draw & No', bttsResult.btts_no_draw),
      option(`${awayTeam} & Yes`, bttsResult.btts_yes_away),
      option(`${awayTeam} & No`, bttsResult.btts_no_away),
    ]));
  }

  // BTTS + total goals combinations, one market per line.
  const bttsTotals = markets.btts_total_goals;
  if (bttsTotals) {
    for (const line of ['2_5', '3_5', '4_5', '5_5']) {
      const label = line.replace('_', '.');
      built.push(market(`btts_total_${line}`, `BTTS & Total Goals ${label}`, 'SGP', true, [
        option(`Yes & Over ${label}`, bttsTotals[`btts_yes_over_${line}`]),
        option(`Yes & Under ${label}`, bttsTotals[`btts_yes_under_${line}`]),
        option(`No & Over ${label}`, bttsTotals[`btts_no_over_${line}`]),
        option(`No & Under ${label}`, bttsTotals[`btts_no_under_${line}`]),
      ]));
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const ou = markets.over_under;
  if (ou) {
    built.push(market('total_goals_match', 'Total Goals', 'Totals', false, [
      option('Over 1.5', ou.over_1_5),
      option('Under 1.5', ou.under_1_5),
      option('Over 2.5', ou.over_2_5),
      option('Under 2.5', ou.under_2_5),
      option('Over 3.5', ou.over_3_5),
      option('Under 3.5', ou.under_3_5),
    ]));
  }

  const ttg = markets.team_total_goals;
  if (ttg) {
    built.push(market('total_goals_home', `${homeTeam} Total Goals`, 'Totals', false, [
      option('Over 0.5', ttg.home_over_0_5),
      option('Under 0.5', ttg.home_under_0_5),
      option('Over 1.5', ttg.home_over_1_5),
      option('Under 1.5', ttg.home_under_1_5),
      option('Over 2.5', ttg.home_over_2_5),
      option('Under 2.5', ttg.home_under_2_5),
    ]));

    built.push(market('total_goals_away', `${awayTeam} Total Goals`, 'Totals', false, [
      option('Over 0.5', ttg.away_over_0_5),
      option('Under 0.5', ttg.away_under_0_5),
      option('Over 1.5', ttg.away_over_1_5),
      option('Under 1.5', ttg.away_under_1_5),
      option('Over 2.5', ttg.away_over_2_5),
      option('Under 2.5', ttg.away_under_2_5),
    ]));
  }

  // ── Corners ───────────────────────────────────────────────────────────────
  const corners = markets.corners;
  if (corners) {
    built.push(market('total_corners', 'Total Corners', 'Corners', false, [
      option('Over 8.5', corners.over_8_5),
      option('Under 8.5', corners.under_8_5),
      option('Over 9.5', corners.over_9_5),
      option('Under 9.5', corners.under_9_5),
      option('Over 10.5', corners.over_10_5),
      option('Under 10.5', corners.under_10_5),
    ]));
  }

  // ── Spreads ───────────────────────────────────────────────────────────────
  const handicap = markets.handicap;
  if (handicap) {
    built.push(market('spreads', 'Spreads (Handicap)', 'Spreads', false, [
      option(`${homeTeam} (-1)`, handicap.home_minus_1),
      option('Tie (-1)', handicap.tie_minus_1),
      option(`${awayTeam} (+1)`, handicap.away_plus_1),
      option(`${homeTeam} (-2)`, handicap.home_minus_2),
      option('Tie (-2)', handicap.tie_minus_2),
      option(`${awayTeam} (+2)`, handicap.away_plus_2),
      option(`${homeTeam} (-3)`, handicap.home_minus_3),
      option('Tie (-3)', handicap.tie_minus_3),
      option(`${awayTeam} (+3)`, handicap.away_plus_3),
    ]));
  }

  const dnb = markets.draw_no_bet;
  if (dnb) {
    built.push(market('draw_no_bet', 'Draw No Bet', 'All', false, [
      option(homeTeam, dnb.home_dnb),
      option(awayTeam, dnb.away_dnb),
    ]));
  }

  // ── Correct score ─────────────────────────────────────────────────────────
  const correctScore = markets.correct_score;
  if (correctScore) {
    built.push(market(
      'correct_score',
      'Correct Score',
      'Correct Score',
      false,
      Object.entries(correctScore)
        .sort(([, a], [, b]) => b - a)
        .map(([score, probability]) => option(score.replace('_', '-'), probability)),
    ));
  }

  // ── Clean sheet ───────────────────────────────────────────────────────────
  const cs = markets.clean_sheet;
  if (cs) {
    built.push(market('clean_sheet', 'Clean Sheet', 'All', false, [
      option(`${homeTeam} Yes`, cs.home_clean_sheet),
      option(`${homeTeam} No`, 1 - cs.home_clean_sheet),
      option(`${awayTeam} Yes`, cs.away_clean_sheet),
      option(`${awayTeam} No`, 1 - cs.away_clean_sheet),
    ]));
  }

  // ── Comebacks & leads ─────────────────────────────────────────────────────
  const wfb = markets.win_from_behind;
  if (wfb) {
    built.push(market('win_from_behind', 'To Win From Behind', 'All', false, [
      option(homeTeam, wfb.home_comeback),
      option(awayTeam, wfb.away_comeback),
      option('Either team', wfb.any_comeback),
    ]));
  }

  const laa = markets.lead_at_anytime;
  if (laa) {
    built.push(market('lead_at_anytime', 'To Lead At Any Time', 'All', false, [
      option(homeTeam, laa.home_lead_anytime),
      option(awayTeam, laa.away_lead_anytime),
    ]));
  }

  return built.filter((m): m is Market => m !== null);
}
