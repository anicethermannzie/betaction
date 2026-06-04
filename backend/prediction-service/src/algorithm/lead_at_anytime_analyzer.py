"""
Lead At Anytime analyzer.

Predicts the probability that each team will lead at any point during the match.
"""

import math
from src.models.prediction import LeadAtAnytimePrediction


def analyze_lead_at_anytime(
    home_win: float,
    draw: float,
    away_win: float,
    home_xg: float,
    away_xg: float,
    home_comeback: float,
    away_comeback: float,
) -> LeadAtAnytimePrediction:
    """
    Predict probability of each team leading at any point in the match.
    """
    # Probability of a non-nil draw (i.e. draw with goals)
    p_0_0 = math.exp(-(home_xg + away_xg))
    p_non_nil_draw = max(0.0, 1.0 - p_0_0)

    # A team leads at any point if:
    # 1. They win the match (they must lead at the end, unless it's a 0-0 win which is impossible)
    # 2. They draw the match and they scored/led at some point (approx. 50% of non-nil draws)
    # 3. The opponent came from behind to win (meaning the team led at some point but lost)
    home_lead = home_win + 0.5 * p_non_nil_draw * draw + away_comeback
    away_lead = away_win + 0.5 * p_non_nil_draw * draw + home_comeback

    return LeadAtAnytimePrediction(
        home_lead_anytime=round(max(0.0, min(home_lead, 1.0)), 4),
        away_lead_anytime=round(max(0.0, min(away_lead, 1.0)), 4),
    )
