"""
Home/away analyzer — quantifies venue-specific performance.

Input:  team statistics dict (raw `response` from /teams/statistics)
Output:
  home_win_rate  — fraction of home games won ∈ [0, 1]
  away_win_rate  — fraction of away games won ∈ [0, 1]
"""

from src.algorithm.weights import NEUTRAL_SCORE


def _safe_division(numerator: int | None, denominator: int | None) -> float:
    """Return numerator/denominator, or NEUTRAL_SCORE if denominator is 0/None."""
    if not denominator or denominator == 0:
        return NEUTRAL_SCORE
    return (numerator or 0) / denominator


def analyze_home_performance(team_stats: dict) -> float:
    """
    Calculate the team's win rate when playing at home.

    Args:
        team_stats: `response` object from /teams/statistics.

    Returns:
        float ∈ [0, 1]
    """
    fixtures = team_stats.get("fixtures", {})
    wins_home = fixtures.get("wins", {}).get("home")
    played_home = fixtures.get("played", {}).get("home")
    return _safe_division(wins_home, played_home)


def analyze_away_performance(team_stats: dict) -> float:
    """
    Calculate the team's win rate when playing away from home.

    Args:
        team_stats: `response` object from /teams/statistics.

    Returns:
        float ∈ [0, 1]
    """
    fixtures = team_stats.get("fixtures", {})
    wins_away = fixtures.get("wins", {}).get("away")
    played_away = fixtures.get("played", {}).get("away")
    return _safe_division(wins_away, played_away)
