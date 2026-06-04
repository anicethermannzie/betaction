"""
Main prediction engine.

Orchestrates all analysis modules, applies configurable weights,
converts raw composite scores to probabilities via softmax,
and returns a structured prediction result.
"""

import numpy as np

from src.algorithm import weights
from src.algorithm.form_analyzer import analyze_form
from src.algorithm.h2h_analyzer import analyze_h2h
from src.algorithm.home_away_analyzer import analyze_home_performance, analyze_away_performance
from src.algorithm.goals_analyzer import calculate_expected_goals, xg_to_scores
from src.algorithm.over_under_analyzer import analyze_over_under
from src.algorithm.btts_analyzer import analyze_btts
from src.algorithm.corners_analyzer import analyze_corners
from src.algorithm.double_chance_analyzer import analyze_double_chance
from src.algorithm.clean_sheet_analyzer import analyze_clean_sheet
from src.algorithm.correct_score_analyzer import analyze_correct_score
from src.algorithm.halftime_fulltime_analyzer import analyze_halftime_fulltime
from src.algorithm.halftime_result_analyzer import analyze_halftime_result
from src.algorithm.team_total_goals_analyzer import analyze_team_total_goals
from src.algorithm.win_both_halves_analyzer import analyze_win_both_halves
from src.algorithm.win_either_half_analyzer import analyze_win_either_half
from src.algorithm.win_from_behind_analyzer import analyze_win_from_behind
from src.algorithm.draw_no_bet_analyzer import analyze_draw_no_bet
from src.algorithm.handicap_analyzer import analyze_handicap
from src.algorithm.btts_result_combo_analyzer import analyze_btts_result_combo
from src.algorithm.btts_total_goals_combo_analyzer import analyze_btts_total_goals_combo
from src.algorithm.lead_at_anytime_analyzer import analyze_lead_at_anytime
from src.config.settings import settings
from src.models.prediction import (
    PredictionFactors,
    PredictionResult,
    FullPredictionResult,
    MarketsResult,
    MatchWinnerPrediction,
)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _softmax(x: np.ndarray) -> np.ndarray:
    """Numerically stable softmax."""
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()


def _parse_odds(odds_response: list[dict]) -> tuple[float, float, float]:
    """
    Convert bookmaker odds to implied probabilities (margin-removed).

    Returns:
        (home_prob, draw_prob, away_prob) normalised to sum to 1.
        Falls back to (1/3, 1/3, 1/3) when odds are unavailable.
    """
    neutral = (1 / 3, 1 / 3, 1 / 3)

    try:
        if not odds_response:
            return neutral

        # Use first bookmaker's "Match Winner" market
        bookmakers = odds_response[0].get("bookmakers", odds_response[0:1])
        if not bookmakers:
            return neutral

        bets = bookmakers[0].get("bets", [])
        match_winner = next(
            (b for b in bets if b.get("name") == "Match Winner"), None
        )
        if not match_winner:
            return neutral

        values = {v["value"]: float(v["odd"]) for v in match_winner.get("values", [])}
        home_odd = values.get("Home", 2.0)
        draw_odd = values.get("Draw", 3.0)
        away_odd = values.get("Away", 2.0)

        # Convert decimal odds to raw probabilities (1 / odd)
        home_p, draw_p, away_p = 1 / home_odd, 1 / draw_odd, 1 / away_odd
        total = home_p + draw_p + away_p  # > 1.0 due to bookmaker margin

        return home_p / total, draw_p / total, away_p / total

    except Exception:
        return neutral


def _confidence(max_prob: float) -> str:
    if max_prob > weights.HIGH_CONFIDENCE_THRESHOLD:
        return "high"
    if max_prob > weights.MEDIUM_CONFIDENCE_THRESHOLD:
        return "medium"
    return "low"


def _prediction_label(home_win: float, draw: float, away_win: float) -> str:
    if home_win >= draw and home_win >= away_win:
        return "HOME_WIN"
    if away_win >= draw and away_win >= home_win:
        return "AWAY_WIN"
    return "DRAW"


# ── Public API ────────────────────────────────────────────────────────────────

def predict(
    fixture_id: int,
    home_team_id: int,
    away_team_id: int,
    home_team_name: str,
    away_team_name: str,
    league_id: int,
    season: int,
    home_team_stats: dict,
    away_team_stats: dict,
    h2h_fixtures: list[dict],
    odds_response: list[dict],
) -> PredictionResult:
    """
    Compute win/draw/loss probabilities using weighted multi-factor analysis.

    Args:
        fixture_id:        API-Football fixture ID.
        home_team_id:      Home team's API-Football ID.
        away_team_id:      Away team's API-Football ID.
        home_team_name:    Home team display name.
        away_team_name:    Away team display name.
        league_id:         League ID.
        season:            Season year.
        home_team_stats:   `response` dict from /teams/statistics for home team.
        away_team_stats:   `response` dict from /teams/statistics for away team.
        h2h_fixtures:      `response` list from /fixtures/headtohead.
        odds_response:     `response` list from /odds.

    Returns:
        PredictionResult — fully populated prediction model.
    """

    # ── 1. Form (recent 5 matches) ────────────────────────────────────────────
    home_form = analyze_form(home_team_stats.get("form"))
    away_form = analyze_form(away_team_stats.get("form"))

    # ── 2. Head-to-head ───────────────────────────────────────────────────────
    home_h2h = analyze_h2h(h2h_fixtures, home_team_id)
    away_h2h = analyze_h2h(h2h_fixtures, away_team_id)

    # ── 3. Home / Away venue performance ─────────────────────────────────────
    home_home_wr = analyze_home_performance(home_team_stats)
    away_away_wr = analyze_away_performance(away_team_stats)

    # ── 4. Expected goals → normalised goal scores ────────────────────────────
    home_xg, away_xg = calculate_expected_goals(home_team_stats, away_team_stats)
    home_goals_score, away_goals_score = xg_to_scores(home_xg, away_xg)

    # ── 5. Odds-implied probabilities ─────────────────────────────────────────
    home_odds_p, draw_odds_p, away_odds_p = _parse_odds(odds_response)

    # ── 6. Weighted composite scores ──────────────────────────────────────────
    home_composite = (
        weights.FORM_WEIGHT      * home_form      +
        weights.H2H_WEIGHT       * home_h2h       +
        weights.HOME_AWAY_WEIGHT * home_home_wr   +
        weights.GOALS_WEIGHT     * home_goals_score +
        weights.ODDS_WEIGHT      * home_odds_p
    )

    away_composite = (
        weights.FORM_WEIGHT      * away_form      +
        weights.H2H_WEIGHT       * away_h2h       +
        weights.HOME_AWAY_WEIGHT * away_away_wr   +
        weights.GOALS_WEIGHT     * away_goals_score +
        weights.ODDS_WEIGHT      * away_odds_p
    )

    # Draw score: teams that are closely matched → higher draw probability.
    # Blend team proximity with the odds-implied draw probability.
    proximity = 1.0 - abs(home_composite - away_composite)  # [0, 1]
    draw_composite = (proximity * 0.5 + draw_odds_p * weights.ODDS_WEIGHT)

    # ── 7. Softmax → probabilities ────────────────────────────────────────────
    raw = np.array([home_composite, draw_composite, away_composite], dtype=np.float64)
    probs = _softmax(raw)

    home_win = round(float(probs[0]), 4)
    draw     = round(float(probs[1]), 4)
    away_win = round(float(probs[2]), 4)

    max_prob = max(home_win, draw, away_win)

    return PredictionResult(
        fixture_id=fixture_id,
        home_team=home_team_name,
        away_team=away_team_name,
        home_team_id=home_team_id,
        away_team_id=away_team_id,
        league_id=league_id,
        season=season,
        home_win=home_win,
        draw=draw,
        away_win=away_win,
        prediction=_prediction_label(home_win, draw, away_win),
        confidence=_confidence(max_prob),
        factors=PredictionFactors(
            home_form_score=round(home_form, 4),
            away_form_score=round(away_form, 4),
            home_h2h_score=round(home_h2h, 4),
            away_h2h_score=round(away_h2h, 4),
            home_expected_goals=round(home_xg, 2),
            away_expected_goals=round(away_xg, 2),
            home_home_win_rate=round(home_home_wr, 4),
            away_away_win_rate=round(away_away_wr, 4),
        ),
    )


# ── Extended prediction with all markets ─────────────────────────────────────

def predict_with_markets(
    fixture_id: int,
    home_team_id: int,
    away_team_id: int,
    home_team_name: str,
    away_team_name: str,
    league_id: int,
    league_name: str,
    season: int,
    home_team_stats: dict,
    away_team_stats: dict,
    h2h_fixtures: list[dict],
    odds_response: list[dict],
    kickoff=None,
) -> FullPredictionResult:
    """
    Compute 1x2 probabilities plus all secondary market predictions.

    Calls predict() for the core 1x2 result, then runs 5 additional
    market analyzers using the same underlying data.

    Returns:
        FullPredictionResult — base prediction + markets + fixture metadata.
    """
    # ── 1. Core 1x2 prediction ────────────────────────────────────────────────
    base = predict(
        fixture_id=fixture_id,
        home_team_id=home_team_id,
        away_team_id=away_team_id,
        home_team_name=home_team_name,
        away_team_name=away_team_name,
        league_id=league_id,
        season=season,
        home_team_stats=home_team_stats,
        away_team_stats=away_team_stats,
        h2h_fixtures=h2h_fixtures,
        odds_response=odds_response,
    )

    # ── 2. Re-derive xG for market analyzers ─────────────────────────────────
    home_xg, away_xg = calculate_expected_goals(home_team_stats, away_team_stats)

    # ── 3. Run market analyzers ───────────────────────────────────────────────
    ou = analyze_over_under(home_xg, away_xg, h2h_fixtures)
    btts_pred = analyze_btts(home_xg, away_xg, h2h_fixtures)
    w_behind = analyze_win_from_behind(
        home_xg, away_xg, home_team_stats, away_team_stats, base.home_win, base.away_win
    )

    markets = MarketsResult(
        one_x_two=MatchWinnerPrediction(
            home_win=base.home_win, draw=base.draw, away_win=base.away_win
        ),
        over_under=ou,
        btts=btts_pred,
        corners=analyze_corners(home_xg, away_xg, settings.league_avg_goals),
        double_chance=analyze_double_chance(base.home_win, base.draw, base.away_win),
        clean_sheet=analyze_clean_sheet(home_xg, away_xg),
        correct_score=analyze_correct_score(home_xg, away_xg),
        halftime_fulltime=analyze_halftime_fulltime(
            home_xg, away_xg, home_team_stats, away_team_stats, base.home_win, base.draw, base.away_win
        ),
        halftime_result=analyze_halftime_result(
            home_xg, away_xg, home_team_stats, away_team_stats
        ),
        team_total_goals=analyze_team_total_goals(home_xg, away_xg),
        win_both_halves=analyze_win_both_halves(
            home_xg, away_xg, home_team_stats, away_team_stats
        ),
        win_either_half=analyze_win_either_half(
            home_xg, away_xg, home_team_stats, away_team_stats
        ),
        win_from_behind=w_behind,
        draw_no_bet=analyze_draw_no_bet(base.home_win, base.away_win),
        handicap=analyze_handicap(home_xg, away_xg),
        btts_result=analyze_btts_result_combo(
            home_xg, away_xg, base.home_win, base.draw, base.away_win, btts_pred.btts_yes, btts_pred.btts_no
        ),
        btts_total_goals=analyze_btts_total_goals_combo(
            home_xg, away_xg, btts_pred.btts_yes, btts_pred.btts_no
        ),
        lead_at_anytime=analyze_lead_at_anytime(
            base.home_win, base.draw, base.away_win, home_xg, away_xg, w_behind.home_comeback, w_behind.away_comeback
        ),
    )

    return FullPredictionResult(
        **base.model_dump(),
        markets=markets,
        league_name=league_name,
        kickoff=kickoff,
    )
