"""
Clean Sheet analyzer.

Uses Poisson distribution to estimate the probability that each team
concedes zero goals (i.e. the opposing team scores zero goals).

Method:
  P(team scores 0) = e^(−opponent_xg)   [Poisson PMF at k=0]

  home_clean_sheet = P(away team scores 0) = e^(−away_xg)
  away_clean_sheet = P(home team scores 0) = e^(−home_xg)
"""

import math

from src.models.prediction import CleanSheetPrediction


def analyze_clean_sheet(
    home_xg: float,
    away_xg: float,
) -> CleanSheetPrediction:
    """
    Predict clean sheet probabilities for home and away teams.

    Args:
        home_xg:  Expected goals for the home team (threat to away clean sheet).
        away_xg:  Expected goals for the away team (threat to home clean sheet).

    Returns:
        CleanSheetPrediction with home_clean_sheet and away_clean_sheet.
    """
    home_clean = round(math.exp(-max(away_xg, 0.0)), 4)
    away_clean = round(math.exp(-max(home_xg, 0.0)), 4)

    return CleanSheetPrediction(
        home_clean_sheet=home_clean,
        away_clean_sheet=away_clean,
    )
