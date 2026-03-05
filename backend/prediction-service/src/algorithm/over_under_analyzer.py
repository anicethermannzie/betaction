"""
Over/Under goals analyzer.

Uses Poisson distribution to estimate the probability that total goals
exceed common thresholds (1.5, 2.5, 3.5).

Method:
  λ = expected total goals, blending:
    - xG-based prediction (70%)
    - Average goals from last H2H_MAX_MATCHES matches (30%)

  P(over X.5) = 1 − P(goals ≤ X) = 1 − Σ_{k=0}^{X} e^(−λ) × λ^k / k!
  P(under X.5) = 1 − P(over X.5)
"""

import math

from src.algorithm.weights import H2H_MAX_MATCHES
from src.models.prediction import OverUnderPrediction


# ── Poisson helpers ───────────────────────────────────────────────────────────

def _poisson_pmf(k: int, lam: float) -> float:
    """P(X = k) where X ~ Poisson(lam)."""
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def _poisson_cdf(k: int, lam: float) -> float:
    """P(X ≤ k) where X ~ Poisson(lam)."""
    return sum(_poisson_pmf(i, lam) for i in range(k + 1))


def _over_prob(threshold: int, lam: float) -> float:
    """P(total goals > threshold) = 1 − P(goals ≤ threshold)."""
    return round(1.0 - _poisson_cdf(threshold, lam), 4)


# ── H2H calibration ───────────────────────────────────────────────────────────

def _h2h_avg_goals(h2h_fixtures: list[dict]) -> float | None:
    """
    Calculate average total goals from recent head-to-head fixtures.
    Returns None if no scored fixtures are available.
    """
    recent = h2h_fixtures[:H2H_MAX_MATCHES]
    totals = []
    for fx in recent:
        goals = fx.get("goals", {})
        home_g = goals.get("home")
        away_g = goals.get("away")
        if home_g is not None and away_g is not None:
            try:
                totals.append(float(home_g) + float(away_g))
            except (TypeError, ValueError):
                pass
    return sum(totals) / len(totals) if totals else None


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_over_under(
    home_xg: float,
    away_xg: float,
    h2h_fixtures: list[dict],
) -> OverUnderPrediction:
    """
    Predict Over/Under probabilities for 1.5, 2.5, 3.5 goals.

    Args:
        home_xg:       Expected goals for the home team.
        away_xg:       Expected goals for the away team.
        h2h_fixtures:  Raw fixture list from /fixtures/headtohead.

    Returns:
        OverUnderPrediction with over/under probabilities for each threshold.
    """
    xg_total = home_xg + away_xg

    # Blend xG with h2h goal average for better calibration
    h2h_avg = _h2h_avg_goals(h2h_fixtures)
    if h2h_avg is not None:
        lam = 0.70 * xg_total + 0.30 * h2h_avg
    else:
        lam = xg_total

    # Clamp to a sensible range
    lam = max(0.5, min(lam, 7.0))

    o15 = _over_prob(1, lam)
    o25 = _over_prob(2, lam)
    o35 = _over_prob(3, lam)

    return OverUnderPrediction(
        over_1_5=o15,
        under_1_5=round(1.0 - o15, 4),
        over_2_5=o25,
        under_2_5=round(1.0 - o25, 4),
        over_3_5=o35,
        under_3_5=round(1.0 - o35, 4),
    )
