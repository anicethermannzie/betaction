"""
Corners analyzer.

NOTE: API-Football free tier does not expose per-team corner statistics.
      This module therefore uses an xG-based heuristic:

      Higher-scoring/more-attacking games tend to produce more corners.
      The model calibrates expected corners from total expected goals
      relative to the league average.

Method:
  base_corners     = LEAGUE_AVG_CORNERS  (10.0 per game, industry average)
  xg_ratio         = total_xg / league_avg_goals
  expected_corners = base_corners × (1 + CORNERS_XG_SENSITIVITY × (xg_ratio − 1))

  Apply Poisson CDF at k = 8, 9, 10 for Over/Under 8.5, 9.5, 10.5.
"""

import math

from src.models.prediction import CornersPrediction

LEAGUE_AVG_CORNERS: float = 10.0   # ~10 corners per game across top leagues
CORNERS_XG_SENSITIVITY: float = 0.25   # corners scale 25% with each unit of xg_ratio deviation


# ── Poisson helpers ───────────────────────────────────────────────────────────

def _poisson_pmf(k: int, lam: float) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def _poisson_cdf(k: int, lam: float) -> float:
    return sum(_poisson_pmf(i, lam) for i in range(k + 1))


def _over_prob(threshold: int, lam: float) -> float:
    return round(1.0 - _poisson_cdf(threshold, lam), 4)


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_corners(
    home_xg: float,
    away_xg: float,
    league_avg_goals: float,
) -> CornersPrediction:
    """
    Predict Over/Under corner probabilities for 8.5, 9.5, 10.5.

    Args:
        home_xg:           Expected goals for the home team.
        away_xg:           Expected goals for the away team.
        league_avg_goals:  League average goals per game (from settings).

    Returns:
        CornersPrediction with over/under probabilities for each threshold.
    """
    total_xg = home_xg + away_xg
    league_avg = max(league_avg_goals, 0.1)

    xg_ratio = total_xg / (league_avg * 2)  # *2 because total_xg is both teams
    expected_corners = LEAGUE_AVG_CORNERS * (
        1.0 + CORNERS_XG_SENSITIVITY * (xg_ratio - 1.0)
    )

    # Clamp to realistic range
    lam = max(6.0, min(expected_corners, 15.0))

    o85 = _over_prob(8, lam)
    o95 = _over_prob(9, lam)
    o105 = _over_prob(10, lam)

    return CornersPrediction(
        over_8_5=o85,
        under_8_5=round(1.0 - o85, 4),
        over_9_5=o95,
        under_9_5=round(1.0 - o95, 4),
        over_10_5=o105,
        under_10_5=round(1.0 - o105, 4),
    )
