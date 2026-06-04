"""
Draw No Bet analyzer.

Predicts Draw No Bet probabilities by removing the draw option and redistributing.
"""

from src.models.prediction import DrawNoBetPrediction


def analyze_draw_no_bet(
    home_win: float,
    away_win: float,
) -> DrawNoBetPrediction:
    """
    Predict Draw No Bet (Home DNB / Away DNB) probabilities.
    """
    total = home_win + away_win
    if total <= 0:
        return DrawNoBetPrediction(home_dnb=0.5, away_dnb=0.5)

    return DrawNoBetPrediction(
        home_dnb=round(home_win / total, 4),
        away_dnb=round(away_win / total, 4),
    )
