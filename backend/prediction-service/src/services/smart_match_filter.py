"""
Smart match auto-selection filter (Avis 4).

Runs the expert decision tree over a list of matches and returns the ones worth
a closer look, each annotated with a recommended market, a plain-language
reason, a 0-100 confidence score, and a side-by-side view of 7 candidate
markets. Purely additive — it does not touch the existing ticket generator.

Recommendations are statistical only and never a guarantee of any result.
"""

from __future__ import annotations


class SmartMatchFilter:
    """
    Automatically identifies the most interesting matches
    of the day based on expert criteria.
    Implements the decision tree from Avis 4.
    """

    TARGET_MIN_ODDS = 1.20
    TARGET_MAX_ODDS = 1.60
    MIN_CONSECUTIVE_WINS = 3
    TOP_POSITION_THRESHOLD = 3

    def filter_interesting_matches(self, matches: list[dict]) -> list[dict]:
        """
        Filter and rank matches by interest level.
        Returns matches with recommended market and reasoning.
        """
        interesting: list[dict] = []

        for match in matches or []:
            try:
                result = self._evaluate_match(match)
            except Exception as exc:  # never let one bad match break the batch
                print(f"[smart_match_filter] skipped a match: {exc}")
                continue
            if result.get("is_interesting"):
                interesting.append({**match, "smart_analysis": result})

        # Sort by confidence score descending
        interesting.sort(
            key=lambda x: x["smart_analysis"]["confidence_score"],
            reverse=True,
        )

        return interesting

    def _evaluate_match(self, match: dict) -> dict:
        """
        Evaluate a single match through the expert's decision tree.
        """
        home_position = _as_int(match.get("home_standing", 99)) or 99
        away_position = _as_int(match.get("away_standing", 99)) or 99
        home_consecutive_wins = _as_int(match.get("home_consecutive_wins", 0))
        away_consecutive_wins = _as_int(match.get("away_consecutive_wins", 0))
        home_goals_avg = _as_float(match.get("home_goals_scored_avg", 0))
        away_goals_avg = _as_float(match.get("away_goals_scored_avg", 0))
        home_odds = _as_float(match.get("home_odds", 0))
        away_odds = _as_float(match.get("away_odds", 0))
        draw_odds = _as_float(match.get("draw_odds", 0))
        over15_odds = _as_float(match.get("over_15_odds", 0))
        over25_odds = _as_float(match.get("over_25_odds", 0))

        # Identify potential favorite
        if home_position < away_position:
            favorite = "home"
            favorite_position = home_position
            opponent_position = away_position
            favorite_odds = home_odds
            favorite_wins = home_consecutive_wins
            favorite_goals_avg = home_goals_avg
        else:
            favorite = "away"
            favorite_position = away_position
            opponent_position = home_position
            favorite_odds = away_odds
            favorite_wins = away_consecutive_wins
            favorite_goals_avg = away_goals_avg

        position_gap = opponent_position - favorite_position

        # STEP 1: Check base criteria
        is_top_team = favorite_position <= self.TOP_POSITION_THRESHOLD
        has_form = favorite_wins >= self.MIN_CONSECUTIVE_WINS
        has_goals = favorite_goals_avg >= 1.2

        if not (is_top_team and has_form and has_goals):
            return {
                "is_interesting": False,
                "reason": "Does not meet base criteria",
            }

        # STEP 2: Decision tree for best market
        recommended_market = None
        market_odds = 0
        reasoning = ""

        # Step 2a: Is simple win reliable?
        if (
            self.TARGET_MIN_ODDS <= favorite_odds <= self.TARGET_MAX_ODDS
            and favorite_wins >= 3
        ):
            recommended_market = "win"
            market_odds = favorite_odds
            reasoning = (
                f"Top team (pos {favorite_position}) with "
                f"{favorite_wins} consecutive wins. "
                f"Odds {favorite_odds} within target range."
            )

        # Step 2b: Try double chance
        elif favorite_odds > self.TARGET_MAX_ODDS:
            dc_odds = (
                1 / (1 / favorite_odds + 1 / draw_odds)
                if favorite_odds > 0 and draw_odds > 0
                else 0
            )
            if dc_odds >= self.TARGET_MIN_ODDS:
                recommended_market = "double_chance"
                market_odds = round(dc_odds, 2)
                reasoning = (
                    f"Win odds ({favorite_odds}) too high. "
                    f"Double chance offers better safety at {market_odds}."
                )

        # Step 2c: Try Over 1.5 goals
        if not recommended_market and over15_odds > 0:
            if self.TARGET_MIN_ODDS <= over15_odds <= 1.80:
                recommended_market = "over_15"
                market_odds = over15_odds
                reasoning = (
                    f"No reliable win market. "
                    f"Over 1.5 goals supported by "
                    f"avg {favorite_goals_avg} goals/match."
                )

        # Step 2d: Team to score
        if not recommended_market:
            team_score_odds = _as_float(
                match.get(
                    "home_to_score_odds" if favorite == "home" else "away_to_score_odds",
                    0,
                )
            )
            if team_score_odds > 0 and self.TARGET_MIN_ODDS <= team_score_odds <= 1.60:
                recommended_market = "team_to_score"
                market_odds = team_score_odds
                reasoning = (
                    f"Top team to score at least 1 goal "
                    f"(avg {favorite_goals_avg} goals/match)."
                )

        # Step 2e: No good market — skip this match
        if not recommended_market:
            return {
                "is_interesting": False,
                "reason": "No market within target odds range (1.20-1.60)",
            }

        # Calculate confidence score (0-100)
        confidence_score = 0
        if is_top_team:
            confidence_score += 25
        if position_gap >= 10:
            confidence_score += 20
        if favorite_wins >= 5:
            confidence_score += 20
        elif favorite_wins >= 3:
            confidence_score += 10
        if has_goals:
            confidence_score += 15
        if self.TARGET_MIN_ODDS <= market_odds <= 1.50:
            confidence_score += 20

        # Build side-by-side markets display (all 7 markets)
        all_markets = [
            {
                "market": "win",
                "label": f"Win ({favorite})",
                "odds": favorite_odds,
                "in_target_range": self.TARGET_MIN_ODDS <= favorite_odds <= self.TARGET_MAX_ODDS,
            },
            {
                "market": "double_chance",
                "label": "Double Chance",
                "odds": _as_float(match.get("double_chance_odds", 0)),
                "in_target_range": True,
            },
            {
                "market": "over_15",
                "label": "Over 1.5 Goals",
                "odds": over15_odds,
                "in_target_range": self.TARGET_MIN_ODDS <= over15_odds <= 1.80,
            },
            {
                "market": "over_25",
                "label": "Over 2.5 Goals",
                "odds": over25_odds,
                "in_target_range": self.TARGET_MIN_ODDS <= over25_odds <= 2.20,
            },
            {
                "market": "team_over_05",
                "label": "Favorite Over 0.5",
                "odds": _as_float(match.get("team_over_05_odds", 0)),
                "in_target_range": True,
            },
            {
                "market": "team_over_15",
                "label": "Favorite Over 1.5",
                "odds": _as_float(match.get("team_over_15_odds", 0)),
                "in_target_range": True,
            },
            {
                "market": "team_over_25",
                "label": "Favorite Over 2.5",
                "odds": _as_float(match.get("team_over_25_odds", 0)),
                "in_target_range": True,
            },
        ]

        return {
            "is_interesting": True,
            "favorite": favorite,
            "favorite_position": favorite_position,
            "opponent_position": opponent_position,
            "position_gap": position_gap,
            "consecutive_wins": favorite_wins,
            "recommended_market": recommended_market,
            "recommended_market_odds": market_odds,
            "reasoning": reasoning,
            "confidence_score": confidence_score,
            "all_markets": all_markets,
            "target_odds_range": f"{self.TARGET_MIN_ODDS} - {self.TARGET_MAX_ODDS}",
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
smart_match_filter = SmartMatchFilter()
