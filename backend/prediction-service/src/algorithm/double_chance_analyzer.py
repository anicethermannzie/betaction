"""
Double Chance analyzer.

Double Chance markets combine two of the three 1x2 outcomes.
This is a pure algebraic derivation — no additional data required.

  1X = home win OR draw   → P(1X) = P(home_win) + P(draw)
  12 = home win OR away win → P(12) = P(home_win) + P(away_win)
  X2 = draw OR away win   → P(X2) = P(draw) + P(away_win)
"""

from src.models.prediction import DoubleChancePrediction


def analyze_double_chance(
    home_win: float,
    draw: float,
    away_win: float,
) -> DoubleChancePrediction:
    """
    Derive double-chance probabilities from 1x2 probabilities.

    Args:
        home_win:  P(home team wins).
        draw:      P(draw).
        away_win:  P(away team wins).

    Returns:
        DoubleChancePrediction with dc_1x, dc_12, dc_x2.
    """
    return DoubleChancePrediction(
        dc_1x=round(min(home_win + draw, 1.0), 4),
        dc_12=round(min(home_win + away_win, 1.0), 4),
        dc_x2=round(min(draw + away_win, 1.0), 4),
    )
