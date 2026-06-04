"""
Correct Score analyzer.

Uses Poisson distribution to calculate the probabilities of the top 10
most likely exact scorelines (e.g. 1-0, 2-1, 1-1).
"""

import math


def _poisson_pmf(k: int, lam: float) -> float:
    """P(X = k) where X ~ Poisson(lam)."""
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def analyze_correct_score(home_xg: float, away_xg: float) -> dict[str, float]:
    """
    Predict probabilities for the top 10 most likely exact scorelines.

    Args:
        home_xg: Expected goals for the home team.
        away_xg: Expected goals for the away team.

    Returns:
        A dictionary mapping "h-a" scorelines to their probabilities.
    """
    scores = {}
    # soccer scorelines rarely exceed 5 goals per team
    for h in range(6):
        for a in range(6):
            p = _poisson_pmf(h, home_xg) * _poisson_pmf(a, away_xg)
            scores[f"{h}-{a}"] = p

    # Sort descending and get top 10
    top_10 = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:10]
    return {score: round(p, 4) for score, p in top_10}
