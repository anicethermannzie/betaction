"""
Head-to-head analyzer — evaluates a team's historical record against a specific opponent.

Input:  list of h2h fixture dicts (raw API-Football `response` array)
        team_id to determine which side won each encounter
Output: h2h_score ∈ [0, 1]  — win rate over the last H2H_MAX_MATCHES meetings.
"""

from src.algorithm.weights import H2H_MAX_MATCHES, NEUTRAL_SCORE


def _team_won(fixture: dict, team_id: int) -> bool:
    """Return True if team_id won the given fixture."""
    teams = fixture.get("teams", {})
    home = teams.get("home", {})
    away = teams.get("away", {})

    # API-Football populates `winner: true` on the winning team after FT
    if home.get("id") == team_id:
        return bool(home.get("winner"))
    if away.get("id") == team_id:
        return bool(away.get("winner"))
    return False


def analyze_h2h(h2h_fixtures: list[dict], team_id: int) -> float:
    """
    Calculate a team's win rate from the last H2H_MAX_MATCHES head-to-head meetings.

    Args:
        h2h_fixtures: list of fixture dicts from API-Football `/fixtures/headtohead`.
        team_id:      the team we are scoring.

    Returns:
        float ∈ [0, 1] — win rate; NEUTRAL_SCORE if no h2h history exists.
    """
    if not h2h_fixtures:
        return NEUTRAL_SCORE

    # API-Football returns newest first; keep the most recent H2H_MAX_MATCHES
    recent = h2h_fixtures[:H2H_MAX_MATCHES]

    wins = sum(1 for fixture in recent if _team_won(fixture, team_id))
    return wins / len(recent)
