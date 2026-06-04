"""
BTTS + Total Goals Combo analyzer.

Predicts combined Both Teams To Score (BTTS) and Total Goals outcomes (16 combinations).
"""

import math
from src.models.prediction import BttsTotalGoalsComboPrediction


def _poisson_pmf(k: int, lam: float) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def analyze_btts_total_goals_combo(
    home_xg: float,
    away_xg: float,
    btts_yes: float,
    btts_no: float,
) -> BttsTotalGoalsComboPrediction:
    """
    Predict BTTS + Total Goals combination probabilities.
    """
    # 1. Compute Poisson scoreline probabilities (0 to 11 goals)
    probs = {}
    for h in range(12):
        for a in range(12):
            probs[(h, a)] = _poisson_pmf(h, home_xg) * _poisson_pmf(a, away_xg)

    total_p = sum(probs.values()) or 1.0

    def calc_combo(limit: int) -> tuple[float, float, float, float]:
        yes_over = sum(p for (h, a), p in probs.items() if h >= 1 and a >= 1 and h + a > limit) / total_p
        yes_under = sum(p for (h, a), p in probs.items() if h >= 1 and a >= 1 and h + a <= limit) / total_p
        no_over = sum(p for (h, a), p in probs.items() if (h == 0 or a == 0) and h + a > limit) / total_p
        no_under = sum(p for (h, a), p in probs.items() if (h == 0 or a == 0) and h + a <= limit) / total_p

        # Blend with calibrated BTTS margins to keep it aligned
        b_yes_over = 0.7 * yes_over + 0.3 * (btts_yes * (yes_over + no_over))
        b_yes_under = 0.7 * yes_under + 0.3 * (btts_yes * (yes_under + no_under))
        b_no_over = 0.7 * no_over + 0.3 * (btts_no * (yes_over + no_over))
        b_no_under = 0.7 * no_under + 0.3 * (btts_no * (yes_under + no_under))

        total = b_yes_over + b_yes_under + b_no_over + b_no_under
        if total <= 0:
            total = 1.0

        return (
            round(b_yes_over / total, 4),
            round(b_yes_under / total, 4),
            round(b_no_over / total, 4),
            round(b_no_under / total, 4),
        )

    yo25, yu25, no25, nu25 = calc_combo(2)
    yo35, yu35, no35, nu35 = calc_combo(3)
    yo45, yu45, no45, nu45 = calc_combo(4)
    yo55, yu55, no55, nu55 = calc_combo(5)

    return BttsTotalGoalsComboPrediction(
        btts_yes_over_2_5=yo25, btts_yes_under_2_5=yu25, btts_no_over_2_5=no25, btts_no_under_2_5=nu25,
        btts_yes_over_3_5=yo35, btts_yes_under_3_5=yu35, btts_no_over_3_5=no35, btts_no_under_3_5=nu35,
        btts_yes_over_4_5=yo45, btts_yes_under_4_5=yu45, btts_no_over_4_5=no45, btts_no_under_4_5=nu45,
        btts_yes_over_5_5=yo55, btts_yes_under_5_5=yu55, btts_no_over_5_5=no55, btts_no_under_5_5=nu55,
    )
