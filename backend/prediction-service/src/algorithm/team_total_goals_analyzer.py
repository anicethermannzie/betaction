"""
Team Total Goals analyzer.

Predicts each team's individual total goals Over/Under 0.5, 1.5, 2.5 using Poisson.
"""

import math
from src.models.prediction import TeamTotalGoalsPrediction


def _poisson_pmf(k: int, lam: float) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def analyze_team_total_goals(
    home_xg: float,
    away_xg: float,
) -> TeamTotalGoalsPrediction:
    """
    Predict individual team total goals (Over/Under 0.5, 1.5, 2.5).
    """
    def calc_overs(lam: float) -> tuple[float, float, float]:
        p0 = _poisson_pmf(0, lam)
        p1 = _poisson_pmf(1, lam)
        p2 = _poisson_pmf(2, lam)

        over_0_5 = 1.0 - p0
        over_1_5 = 1.0 - (p0 + p1)
        over_2_5 = 1.0 - (p0 + p1 + p2)

        return (
            max(0.0, min(over_0_5, 1.0)),
            max(0.0, min(over_1_5, 1.0)),
            max(0.0, min(over_2_5, 1.0)),
        )

    h_o05, h_o15, h_o25 = calc_overs(home_xg)
    a_o05, a_o15, a_o25 = calc_overs(away_xg)

    return TeamTotalGoalsPrediction(
        home_over_0_5=round(h_o05, 4),
        home_over_1_5=round(h_o15, 4),
        home_over_2_5=round(h_o25, 4),
        away_over_0_5=round(a_o05, 4),
        away_over_1_5=round(a_o15, 4),
        away_over_2_5=round(a_o25, 4),
        home_under_0_5=round(1.0 - h_o05, 4),
        home_under_1_5=round(1.0 - h_o15, 4),
        home_under_2_5=round(1.0 - h_o25, 4),
        away_under_0_5=round(1.0 - a_o05, 4),
        away_under_1_5=round(1.0 - a_o15, 4),
        away_under_2_5=round(1.0 - a_o25, 4),
    )
