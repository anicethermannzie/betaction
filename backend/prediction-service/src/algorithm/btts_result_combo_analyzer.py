"""
BTTS + Result Combo analyzer.

Predicts combined Both Teams To Score (BTTS) and Match Result outcomes (6 combinations).
"""

import math
from src.models.prediction import BttsResultComboPrediction


def _poisson_pmf(k: int, lam: float) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def analyze_btts_result_combo(
    home_xg: float,
    away_xg: float,
    home_win: float,
    draw: float,
    away_win: float,
    btts_yes: float,
    btts_no: float,
) -> BttsResultComboPrediction:
    """
    Predict BTTS + Match Result combination probabilities.
    """
    # 1. Compute Poisson scoreline probabilities (0 to 10 goals)
    probs = {}
    for h in range(11):
        for a in range(11):
            probs[(h, a)] = _poisson_pmf(h, home_xg) * _poisson_pmf(a, away_xg)

    total_p = sum(probs.values()) or 1.0

    # 2. Extract Poisson joint probabilities
    p_yes_home = sum(p for (h, a), p in probs.items() if h > a and h >= 1 and a >= 1) / total_p
    p_yes_draw = sum(p for (h, a), p in probs.items() if h == a and h >= 1 and a >= 1) / total_p
    p_yes_away = sum(p for (h, a), p in probs.items() if h < a and h >= 1 and a >= 1) / total_p

    p_no_home = sum(p for (h, a), p in probs.items() if h > a and (h == 0 or a == 0)) / total_p
    p_no_draw = sum(p for (h, a), p in probs.items() if h == a and (h == 0 or a == 0)) / total_p
    p_no_away = sum(p for (h, a), p in probs.items() if h < a and (h == 0 or a == 0)) / total_p

    # 3. Blend with calibrated 1x2 and BTTS margins
    # Joint = 0.7 * Poisson + 0.3 * (calibrated_BTTS * calibrated_1x2)
    btts_yes_home = round(0.7 * p_yes_home + 0.3 * (btts_yes * home_win), 4)
    btts_yes_draw = round(0.7 * p_yes_draw + 0.3 * (btts_yes * draw), 4)
    btts_yes_away = round(0.7 * p_yes_away + 0.3 * (btts_yes * away_win), 4)

    btts_no_home = round(0.7 * p_no_home + 0.3 * (btts_no * home_win), 4)
    btts_no_draw = round(0.7 * p_no_draw + 0.3 * (btts_no * draw), 4)
    btts_no_away = round(0.7 * p_no_away + 0.3 * (btts_no * away_win), 4)

    # Normalise combinations to sum exactly to 1.0
    total = btts_yes_home + btts_yes_draw + btts_yes_away + btts_no_home + btts_no_draw + btts_no_away
    if total <= 0:
        total = 1.0

    return BttsResultComboPrediction(
        btts_yes_home=round(btts_yes_home / total, 4),
        btts_yes_draw=round(btts_yes_draw / total, 4),
        btts_yes_away=round(btts_yes_away / total, 4),
        btts_no_home=round(btts_no_home / total, 4),
        btts_no_draw=round(btts_no_draw / total, 4),
        btts_no_away=round(btts_no_away / total, 4),
    )
