"""
Mock match data for the deep-analysis / smart-picks features.

Used as a graceful fallback when the match-service cannot supply the extended
fields these analyzers need (standings, consecutive wins, per-market odds,
recent-match logs, H2H history). Mirrors how ``ticket_generator`` falls back to
mock data so the endpoints always return something useful in dev.

Four scenarios, one per row, matching the test matrix in the spec:

  900001  Classic top vs bottom      -> SmartMatchFilter picks it, market "win"
  900002  Odds anomaly on favourite  -> anomaly flagged, double-chance instead
  900003  Low-scoring top vs bottom  -> Under 3.5 / BTTS No recommendations
  900004  No market in 1.20-1.60     -> filtered out by SmartMatchFilter
"""

from __future__ import annotations


def _form(results: list[str], scored: list[int], conceded: list[int]) -> list[dict]:
    """Build a recent-matches log (newest first) for _analyze_form."""
    return [
        {"result": r, "goals_scored": s, "goals_conceded": c}
        for r, s, c in zip(results, scored, conceded)
    ]


def _h2h(rows: list[tuple[str, int, int]]) -> list[dict]:
    """rows: (winner, home_goals, away_goals) newest first."""
    return [
        {"winner": w, "home_goals": hg, "away_goals": ag}
        for (w, hg, ag) in rows
    ]


# ── 900001 — classic top vs bottom ──────────────────────────────────────────
_MATCH_1 = {
    "fixture_id": 900001,
    "home_team": "Northgate FC",
    "away_team": "Riverside United",
    "league": "Mock Premier League",
    "home_standing": 1,
    "away_standing": 18,
    "total_teams_in_league": 20,
    "home_consecutive_wins": 5,
    "away_consecutive_wins": 0,
    "home_goals_scored_avg": 2.3,
    "away_goals_scored_avg": 0.6,
    "home_goals_conceded_avg": 0.7,
    "away_goals_conceded_avg": 2.1,
    "home_odds": 1.35,
    "draw_odds": 5.0,
    "away_odds": 8.0,
    "over_15_odds": 1.25,
    "over_25_odds": 1.65,
    "double_chance_odds": 1.08,
    "home_to_score_odds": 1.06,
    "away_to_score_odds": 2.40,
    "team_over_05_odds": 1.05,
    "team_over_15_odds": 1.40,
    "team_over_25_odds": 2.30,
    "home_points": 55,
    "away_points": 14,
    "home_goal_diff": 34,
    "away_goal_diff": -25,
    "home_home_record": "W-W-W-W-D",
    "away_away_record": "L-L-L-D-L",
    "home_recent_matches": _form(["W", "W", "W", "W", "W"], [3, 2, 4, 1, 2], [0, 1, 0, 0, 1]),
    "away_recent_matches": _form(["L", "L", "D", "L", "L"], [0, 1, 1, 0, 1], [3, 2, 1, 2, 4]),
    "head_to_head": _h2h([("home", 3, 0), ("home", 2, 1), ("home", 4, 0), ("draw", 1, 1), ("home", 2, 0)]),
}

# ── 900002 — odds anomaly on the favourite ──────────────────────────────────
_MATCH_2 = {
    "fixture_id": 900002,
    "home_team": "Kingsbridge City",
    "away_team": "Fenwick Rovers",
    "league": "Mock Premier League",
    "home_standing": 2,
    "away_standing": 15,
    "total_teams_in_league": 20,
    "home_consecutive_wins": 4,
    "away_consecutive_wins": 1,
    "home_goals_scored_avg": 1.9,
    "away_goals_scored_avg": 1.1,
    "home_goals_conceded_avg": 0.9,
    "away_goals_conceded_avg": 1.6,
    "home_odds": 2.80,          # suspiciously high for a 2nd-vs-15th home side
    "draw_odds": 3.40,
    "away_odds": 2.50,
    "over_15_odds": 1.30,
    "over_25_odds": 1.90,
    "double_chance_odds": 1.45,
    "home_to_score_odds": 1.25,
    "away_to_score_odds": 1.70,
    "team_over_05_odds": 1.20,
    "team_over_15_odds": 1.95,
    "team_over_25_odds": 3.60,
    "home_points": 48,
    "away_points": 26,
    "home_goal_diff": 19,
    "away_goal_diff": -6,
    "home_home_record": "W-W-D-W-W",
    "away_away_record": "L-D-L-W-L",
    "home_recent_matches": _form(["W", "W", "W", "W", "D"], [2, 3, 1, 2, 1], [0, 1, 0, 1, 1]),
    "away_recent_matches": _form(["W", "L", "D", "L", "L"], [2, 0, 1, 1, 0], [1, 2, 1, 3, 2]),
    "head_to_head": _h2h([("home", 2, 1), ("draw", 1, 1), ("away", 0, 1), ("home", 3, 0), ("home", 1, 0)]),
}

# ── 900003 — low-scoring top vs bottom ──────────────────────────────────────
_MATCH_3 = {
    "fixture_id": 900003,
    "home_team": "Ashford Athletic",
    "away_team": "Dockside Town",
    "league": "Mock Championship",
    "home_standing": 3,
    "away_standing": 19,
    "total_teams_in_league": 20,
    "home_consecutive_wins": 2,
    "away_consecutive_wins": 0,
    "home_goals_scored_avg": 1.3,
    "away_goals_scored_avg": 0.5,      # low-scoring bottom side
    "home_goals_conceded_avg": 0.8,
    "away_goals_conceded_avg": 1.9,    # weak defence
    "home_odds": 1.50,
    "draw_odds": 4.20,
    "away_odds": 6.50,
    "over_15_odds": 1.80,
    "over_25_odds": 2.90,
    "double_chance_odds": 1.15,
    "home_to_score_odds": 1.18,
    "away_to_score_odds": 3.10,
    "team_over_05_odds": 1.16,
    "team_over_15_odds": 2.05,
    "team_over_25_odds": 4.80,
    "home_points": 44,
    "away_points": 12,
    "home_goal_diff": 15,
    "away_goal_diff": -28,
    "home_home_record": "W-D-W-W-D",
    "away_away_record": "L-L-L-L-D",
    "home_recent_matches": _form(["W", "W", "D", "W", "D"], [1, 2, 0, 1, 1], [0, 1, 0, 0, 1]),
    "away_recent_matches": _form(["L", "L", "L", "D", "L"], [0, 1, 0, 0, 0], [2, 3, 1, 0, 2]),
    "head_to_head": _h2h([("home", 1, 0), ("home", 2, 0), ("draw", 0, 0), ("home", 1, 0), ("home", 3, 1)]),
}

# ── 900004 — no market inside the 1.20-1.60 window ──────────────────────────
_MATCH_4 = {
    "fixture_id": 900004,
    "home_team": "Whitmore Wanderers",
    "away_team": "Castleton FC",
    "league": "Mock Premier League",
    "home_standing": 2,
    "away_standing": 6,
    "total_teams_in_league": 20,
    "home_consecutive_wins": 4,
    "away_consecutive_wins": 2,
    "home_goals_scored_avg": 1.6,
    "away_goals_scored_avg": 1.3,
    "home_goals_conceded_avg": 1.0,
    "away_goals_conceded_avg": 1.1,
    "home_odds": 1.75,          # > 1.60 -> not a "win" pick
    "draw_odds": 3.60,          # DC works out to ~1.18 -> below 1.20 floor
    "away_odds": 4.50,
    "over_15_odds": 1.90,       # > 1.80 -> not an "over 1.5" pick
    "over_25_odds": 2.60,
    "double_chance_odds": 1.18,
    "home_to_score_odds": 1.10,  # < 1.20 -> not a "team to score" pick
    "away_to_score_odds": 1.55,
    "team_over_05_odds": 1.10,
    "team_over_15_odds": 1.85,
    "team_over_25_odds": 3.40,
    "home_points": 47,
    "away_points": 34,
    "home_goal_diff": 18,
    "away_goal_diff": 7,
    "home_home_record": "W-W-W-D-W",
    "away_away_record": "W-L-W-D-W",
    "home_recent_matches": _form(["W", "W", "W", "W", "L"], [2, 1, 3, 2, 0], [0, 0, 1, 1, 1]),
    "away_recent_matches": _form(["W", "W", "D", "L", "W"], [2, 1, 1, 0, 2], [0, 0, 1, 1, 1]),
    "head_to_head": _h2h([("home", 2, 1), ("away", 1, 2), ("draw", 1, 1), ("home", 3, 2), ("home", 1, 0)]),
}


DEEP_ANALYSIS_MOCK_MATCHES: list[dict] = [_MATCH_1, _MATCH_2, _MATCH_3, _MATCH_4]

MOCK_MATCH_BY_FIXTURE_ID: dict[int, dict] = {
    m["fixture_id"]: m for m in DEEP_ANALYSIS_MOCK_MATCHES
}
