"""
Both Teams To Score (BTTS) analyzer.

Method:
  Using Poisson distribution:
    P(team scores ≥ 1) = 1 − e^(−xg)   [i.e. 1 − P(goals = 0)]

  btts_yes = P(home ≥ 1) × P(away ≥ 1)

  Blends the xG-derived probability (70%) with the observed BTTS rate
  from recent head-to-head matches (30%) for improved accuracy.
"""

import math

from src.algorithm.weights import H2H_MAX_MATCHES
from src.models.prediction import BttsPrediction


# ── Helpers ───────────────────────────────────────────────────────────────────

def _p_score_at_least_one(xg: float) -> float:
    """P(goals >= 1) = 1 - e^(-xg)."""
    xg = max(0.0, xg)
    return 1.0 - math.exp(-xg)


def _h2h_btts_rate(h2h_fixtures: list[dict]) -> float | None:
    """
    Calculate BTTS rate from the most recent H2H_MAX_MATCHES fixtures.
    Returns None if no usable fixtures exist.
    """
    recent = [
        fx for fx in h2h_fixtures[:H2H_MAX_MATCHES]
        if fx.get("goals", {}).get("home") is not None
        and fx.get("goals", {}).get("away") is not None
    ]
    if not recent:
        return None

    btts_count = sum(
        1 for fx in recent
        if float(fx["goals"]["home"]) >= 1 and float(fx["goals"]["away"]) >= 1
    )
    return btts_count / len(recent)


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_btts(
    home_xg: float,
    away_xg: float,
    h2h_fixtures: list[dict],
) -> BttsPrediction:
    """
    Predict Both Teams To Score probability.

    Args:
        home_xg:       Expected goals for the home team.
        away_xg:       Expected goals for the away team.
        h2h_fixtures:  Raw fixture list from /fixtures/headtohead.

    Returns:
        BttsPrediction with btts_yes and btts_no probabilities.
    """
    # xG-derived BTTS probability
    xg_btts = _p_score_at_least_one(home_xg) * _p_score_at_least_one(away_xg)

    # Blend with h2h observed rate
    h2h_rate = _h2h_btts_rate(h2h_fixtures)
    if h2h_rate is not None:
        btts_yes = round(0.70 * xg_btts + 0.30 * h2h_rate, 4)
    else:
        btts_yes = round(xg_btts, 4)

    btts_yes = max(0.0, min(btts_yes, 1.0))
    btts_no = round(1.0 - btts_yes, 4)

    return BttsPrediction(btts_yes=btts_yes, btts_no=btts_no)
