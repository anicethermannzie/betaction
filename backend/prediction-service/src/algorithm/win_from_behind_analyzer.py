"""
Win From Behind analyzer.

Predicts if a team will come from behind to win.
"""

from src.models.prediction import WinFromBehindPrediction


def _get_late_goal_ratio(team_stats: dict) -> float:
    """Extract ratio of goals scored in the last 15 mins (+ stoppage time)."""
    try:
        goals = team_stats.get("goals", {})
        for_goals = goals.get("for", goals.get("for_", {}))
        minutes = for_goals.get("minute", {})

        late_keys = ["76-90", "91-105"]
        late_total = 0
        total = 0
        for m_range, data in minutes.items():
            val = data.get("total")
            if val is not None:
                val = int(val)
                total += val
                if m_range in late_keys:
                    late_total += val
        if total > 0:
            return late_total / total
    except Exception:
        pass
    return 0.20


def analyze_win_from_behind(
    home_xg: float,
    away_xg: float,
    home_team_stats: dict,
    away_team_stats: dict,
    home_win: float,
    away_win: float,
) -> WinFromBehindPrediction:
    """
    Predict comeback win probabilities.
    """
    total_xg = home_xg + away_xg
    if total_xg > 0:
        p_home_concede_first = away_xg / total_xg
        p_away_concede_first = home_xg / total_xg
    else:
        p_home_concede_first = 0.5
        p_away_concede_first = 0.5

    home_late_ratio = _get_late_goal_ratio(home_team_stats)
    away_late_ratio = _get_late_goal_ratio(away_team_stats)

    # Higher late-goals proportion suggests better ability to score late and make comebacks
    home_comeback_ability = 0.5 + home_late_ratio
    away_comeback_ability = 0.5 + away_late_ratio

    # Baseline comeback probability models: P(Concede First) * P(Win) * ability_modifier
    home_comeback = p_home_concede_first * home_win * 0.4 * home_comeback_ability
    away_comeback = p_away_concede_first * away_win * 0.4 * away_comeback_ability

    home_comeback = max(0.01, min(home_comeback, 0.25))
    away_comeback = max(0.01, min(away_comeback, 0.25))
    any_comeback = max(home_comeback, min(home_comeback + away_comeback, 0.40))

    return WinFromBehindPrediction(
        home_comeback=round(home_comeback, 4),
        away_comeback=round(away_comeback, 4),
        any_comeback=round(any_comeback, 4),
    )
