"""
Goals analyzer — calculates attack/defense strength and expected goals (xG).

Method:
  attack_strength  = team_avg_goals_scored   / LEAGUE_AVG_GOALS
  defense_weakness = team_avg_goals_conceded / LEAGUE_AVG_GOALS

  home_xG = home_attack_strength  × away_defense_weakness × LEAGUE_AVG_GOALS
  away_xG = away_attack_strength  × home_defense_weakness × LEAGUE_AVG_GOALS

The expected-goals ratio is then mapped to a [0, 1] score for each team.
"""

from src.config.settings import settings


def _parse_avg(value: str | float | int | None) -> float:
    """Safely parse an average value that API-Football returns as a string."""
    try:
        return float(value) if value is not None else 0.0
    except (ValueError, TypeError):
        return 0.0


def _get_strengths(team_stats: dict) -> tuple[float, float]:
    """
    Extract attack and defense weakness for a team from its statistics dict.

    Returns:
        (attack_strength, defense_weakness)  both relative to league average.
    """
    league_avg = settings.league_avg_goals

    goals = team_stats.get("goals", {})

    avg_scored = _parse_avg(
        goals.get("for", goals.get("for_", {})).get("average", {}).get("total")
    )
    avg_conceded = _parse_avg(
        goals.get("against", {}).get("average", {}).get("total")
    )

    attack_strength = avg_scored / league_avg if league_avg > 0 else 1.0
    defense_weakness = avg_conceded / league_avg if league_avg > 0 else 1.0

    return attack_strength, defense_weakness


def calculate_expected_goals(
    home_stats: dict,
    away_stats: dict,
) -> tuple[float, float]:
    """
    Estimate expected goals for home and away teams.

    Args:
        home_stats: `response` object from /teams/statistics for the home team.
        away_stats: `response` object from /teams/statistics for the away team.

    Returns:
        (home_xg, away_xg) — raw expected-goals floats (not normalised to [0,1]).
    """
    league_avg = settings.league_avg_goals

    home_attack, home_defense_weakness = _get_strengths(home_stats)
    away_attack, away_defense_weakness = _get_strengths(away_stats)

    # Home team scores against the away team's defensive weakness
    home_xg = home_attack * away_defense_weakness * league_avg
    # Away team scores against the home team's defensive weakness
    away_xg = away_attack * home_defense_weakness * league_avg

    return home_xg, away_xg


def xg_to_scores(home_xg: float, away_xg: float) -> tuple[float, float]:
    """
    Normalise expected goals into [0, 1] scores for each team.

    Returns:
        (home_goals_score, away_goals_score)
    """
    total = home_xg + away_xg
    if total == 0:
        return 0.5, 0.5
    return home_xg / total, away_xg / total
