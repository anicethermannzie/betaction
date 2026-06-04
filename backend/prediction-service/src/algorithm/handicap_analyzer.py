"""
Handicap analyzer.

Predicts 3-way handicap spread results for -1, -2, -3 goals using Poisson.
"""

import math
from src.models.prediction import HandicapPrediction


def _poisson_pmf(k: int, lam: float) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def analyze_handicap(
    home_xg: float,
    away_xg: float,
) -> HandicapPrediction:
    """
    Predict 3-way handicap probabilities.
    """
    # Compute scoreline probabilities up to 10 goals to be comprehensive
    probs = {}
    for h in range(11):
        for a in range(11):
            probs[(h, a)] = _poisson_pmf(h, home_xg) * _poisson_pmf(a, away_xg)

    total_p = sum(probs.values()) or 1.0

    def calc_handicap(k: int) -> tuple[float, float, float]:
        # home minus k means: home goals - k > away goals
        hm = sum(probs[(h, a)] for h, a in probs if h - a > k) / total_p
        # tie minus k means: home goals - k == away goals
        t = sum(probs[(h, a)] for h, a in probs if h - a == k) / total_p
        # away plus k means: away goals + k > home goals (i.e. home goals - k < away goals)
        ap = sum(probs[(h, a)] for h, a in probs if h - a < k) / total_p
        return round(hm, 4), round(t, 4), round(ap, 4)

    h_m1, t_m1, a_p1 = calc_handicap(1)
    h_m2, t_m2, a_p2 = calc_handicap(2)
    h_m3, t_m3, a_p3 = calc_handicap(3)

    return HandicapPrediction(
        home_minus_1=h_m1, tie_minus_1=t_m1, away_plus_1=a_p1,
        home_minus_2=h_m2, tie_minus_2=t_m2, away_plus_2=a_p2,
        home_minus_3=h_m3, tie_minus_3=t_m3, away_plus_3=a_p3,
    )
