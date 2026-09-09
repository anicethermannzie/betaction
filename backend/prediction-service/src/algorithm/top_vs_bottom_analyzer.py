"""
Top vs Bottom analyzer (Avis 3).

Detects "top-3 side vs relegation-zone side" fixtures and produces a
priority-ordered list of smart market recommendations (double chance, over 1.5,
team goals, under 3.5, correct-score range, BTTS No). Also raises an alert when
the strong side's odds look too high (possible injuries / suspensions / form).

None of the recommendations are guarantees — statistical analysis only.
"""

from __future__ import annotations


class TopVsBottomAnalyzer:
    """Smart market recommendations for lopsided table-position fixtures."""

    def analyze(self, match_data: dict) -> dict:
        """
        Detect top 3 vs relegation zone matches and
        provide smart market recommendations.

        Returns ``{"is_top_vs_bottom": False}`` for anything that is not a
        clear top-vs-bottom scenario (including incomplete standings data).
        """
        home_position = _as_int(match_data.get("home_standing", 0))
        away_position = _as_int(match_data.get("away_standing", 0))
        total_teams = _as_int(match_data.get("total_teams_in_league", 20)) or 20

        # Graceful fallback — need real league positions for both sides
        if home_position <= 0 or away_position <= 0:
            return {"is_top_vs_bottom": False, "insufficient_data": True}

        relegation_zone_start = total_teams - 3  # Last 3-4 teams
        top_zone_end = 3  # Top 3 teams

        # Identify top team and bottom team
        home_is_top = home_position <= top_zone_end
        away_is_top = away_position <= top_zone_end
        home_is_bottom = home_position >= relegation_zone_start
        away_is_bottom = away_position >= relegation_zone_start

        is_top_vs_bottom = (
            (home_is_top and away_is_bottom)
            or (away_is_top and home_is_bottom)
        )

        if not is_top_vs_bottom:
            return {"is_top_vs_bottom": False}

        # Identify which is top and which is bottom
        top_team = "home" if home_is_top else "away"
        bottom_team = "away" if home_is_top else "home"
        top_position = home_position if home_is_top else away_position
        bottom_position = away_position if home_is_top else home_position
        position_gap = abs(top_position - bottom_position)

        # Get stats for analysis
        home_goals_scored_avg = _as_float(match_data.get("home_goals_scored_avg", 0))
        away_goals_scored_avg = _as_float(match_data.get("away_goals_scored_avg", 0))
        home_goals_conceded_avg = _as_float(match_data.get("home_goals_conceded_avg", 0))
        away_goals_conceded_avg = _as_float(match_data.get("away_goals_conceded_avg", 0))

        top_goals_avg = home_goals_scored_avg if top_team == "home" else away_goals_scored_avg
        bottom_goals_conceded_avg = (
            away_goals_conceded_avg if top_team == "home" else home_goals_conceded_avg
        )
        bottom_goals_scored_avg = (
            away_goals_scored_avg if top_team == "home" else home_goals_scored_avg
        )

        # Is the bottom team low-scoring?
        is_bottom_low_scoring = 0 < bottom_goals_scored_avg < 0.8
        is_bottom_weak_defense = bottom_goals_conceded_avg > 1.8

        # Check for odds anomaly on the favorite
        top_team_odds = _as_float(
            match_data.get("home_odds", 0) if top_team == "home"
            else match_data.get("away_odds", 0)
        )
        has_odds_anomaly = top_team_odds > 1.80

        # Build smart market recommendations
        recommended_markets: list[dict] = []
        alert_message = None

        if has_odds_anomaly:
            alert_message = (
                f"⚠️ Alert: The top team's odds ({top_team_odds}) are "
                f"unusually high. Check for injuries, suspensions, or "
                f"recent poor form before selecting this match."
            )

        # Decision tree for market recommendations
        if 0 < top_team_odds <= 1.30:
            recommended_markets.append({
                "market": "double_chance",
                "selection": "Top team or Draw",
                "reasoning": "Very strong favorite — double chance for safety",
                "priority": 1,
            })

        if top_goals_avg >= 1.5 and bottom_goals_conceded_avg >= 1.5:
            recommended_markets.append({
                "market": "over_under",
                "selection": "Over 1.5 goals",
                "reasoning": "Top team scores well, bottom team concedes regularly",
                "priority": 2,
            })

        if is_bottom_low_scoring and top_goals_avg >= 1.2:
            recommended_markets.append({
                "market": "team_goals",
                "selection": "Top team Over 1.5 goals",
                "reasoning": "Top team likely to dominate offensively",
                "priority": 2,
            })

        if is_bottom_low_scoring and is_bottom_weak_defense:
            recommended_markets.append({
                "market": "over_under",
                "selection": "Under 3.5 goals",
                "reasoning": "Bottom team rarely scores — expect controlled win",
                "priority": 3,
            })
            recommended_markets.append({
                "market": "correct_score_range",
                "selection": "1-0 or 2-0",
                "reasoning": "Controlled win likely given defensive bottom team",
                "priority": 4,
            })

        if is_bottom_low_scoring:
            recommended_markets.append({
                "market": "btts",
                "selection": "BTTS No",
                "reasoning": "Bottom team rarely scores — both teams to score unlikely",
                "priority": 3,
            })

        # Sort by priority
        recommended_markets.sort(key=lambda x: x["priority"])

        return {
            "is_top_vs_bottom": True,
            "top_team": top_team,
            "bottom_team": bottom_team,
            "top_position": top_position,
            "bottom_position": bottom_position,
            "position_gap": position_gap,
            "has_odds_anomaly": has_odds_anomaly,
            "alert_message": alert_message,
            "is_bottom_low_scoring": is_bottom_low_scoring,
            "is_bottom_weak_defense": is_bottom_weak_defense,
            "recommended_markets": recommended_markets[:4],  # Top 4 recommendations
        }


def _as_float(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _as_int(value) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


# Module-level singleton
top_vs_bottom_analyzer = TopVsBottomAnalyzer()
