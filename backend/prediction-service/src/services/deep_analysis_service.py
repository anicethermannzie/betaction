"""
Deep match analysis service.

Combines the odds analyzer, the top-vs-bottom analyzer and the smart match
filter into one comprehensive per-match analysis, plus helpers to assemble the
flat ``match_data`` dict those analyzers expect from match-service data.

Every recommendation carries the disclaimer: no result is ever guaranteed.

No mock fallback: an earlier version of this service returned four hardcoded
scenario fixtures (ids 900001-900004) whenever match-service was unavailable
or a requested fixture id matched one of them — the same fabrication pattern
removed from ticket_generator.py during the production readiness audit (see
docs/PRODUCTION_READINESS_AUDIT.md). That data now lives only in
tests/deep_analysis_fixtures.py, used to exercise the analyzers with
realistic input — never returned to a real client. A fixture this service
cannot build real data for gets a real error, not an invented one.
"""

from __future__ import annotations

import asyncio

from src.algorithm.odds_analyzer import OddsAnalyzer
from src.algorithm.top_vs_bottom_analyzer import TopVsBottomAnalyzer
from src.services.match_data_service import MatchDataService, match_data_service
from src.services.smart_match_filter import SmartMatchFilter

DISCLAIMER = (
    "No result is ever guaranteed. This is statistical analysis for "
    "informational purposes only."
)


class DeepAnalysisService:
    """
    Combines all analyzers to produce a comprehensive
    match analysis.
    """

    def __init__(self) -> None:
        self.odds_analyzer = OddsAnalyzer()
        self.top_vs_bottom = TopVsBottomAnalyzer()
        self.smart_filter = SmartMatchFilter()

    def analyze_match(self, match_data: dict) -> dict:
        """
        Full deep analysis of a single match.
        Returns all data needed for the UI.
        """
        match_data = match_data or {}

        # 1. Odds analysis
        odds_analysis = self.odds_analyzer.analyze(match_data)

        # 2. Recent form (last 5 home + 5 away)
        #
        # match-service exposes no endpoint carrying a recent-fixture list
        # (dates, opponents, scores) — only season-aggregate stats and a form
        # string like "WWDLW". So home_recent_matches/away_recent_matches are
        # never populated by build_match_data() below, and this always
        # returns the empty shape for real fixtures. Same known gap as the
        # frontend's prediction detail page — see frontend/src/lib/
        # matchDetail.ts's file header. Not a bug; there is nothing to fill it
        # with honestly yet.
        home_form = self._analyze_form(
            match_data.get("home_recent_matches", []), venue="home"
        )
        away_form = self._analyze_form(
            match_data.get("away_recent_matches", []), venue="away"
        )

        # 3. H2H analysis — real data; see build_match_data's h2h mapping.
        h2h = self._analyze_h2h(match_data.get("head_to_head", []))

        # 4. Standings comparison
        standings = self._analyze_standings(match_data)

        # 5. Top vs Bottom detection
        top_bottom = self.top_vs_bottom.analyze(match_data)

        # 6. Smart market recommendation
        try:
            smart = self.smart_filter._evaluate_match(match_data)
        except Exception as exc:  # graceful — never crash the analysis
            smart = {"is_interesting": False, "reason": f"evaluation error: {exc}"}

        # 7. Final recommended market
        final_recommendation = self._build_recommendation(
            odds_analysis, home_form, away_form, h2h, standings, top_bottom, smart
        )

        return {
            "odds_analysis": odds_analysis,
            "home_form": home_form,
            "away_form": away_form,
            "h2h": h2h,
            "standings": standings,
            "top_vs_bottom": top_bottom,
            "smart_filter": smart,
            "final_recommendation": final_recommendation,
            "disclaimer": DISCLAIMER,
        }

    # ── Form ────────────────────────────────────────────────────────────────

    def _analyze_form(self, matches: list, venue: str) -> dict:
        """Analyze last 5 matches form."""
        if not matches:
            return {"venue": venue, "matches": [], "summary": {}}

        last_5 = matches[:5]
        wins = sum(1 for m in last_5 if m.get("result") == "W")
        draws = sum(1 for m in last_5 if m.get("result") == "D")
        losses = sum(1 for m in last_5 if m.get("result") == "L")
        goals_scored = sum(m.get("goals_scored", 0) for m in last_5)
        goals_conceded = sum(m.get("goals_conceded", 0) for m in last_5)

        # Trend: is the team improving?
        recent_3 = last_5[:3]
        older_2 = last_5[3:]
        recent_points = sum(
            3 if m.get("result") == "W" else 1 if m.get("result") == "D" else 0
            for m in recent_3
        )
        older_points = sum(
            3 if m.get("result") == "W" else 1 if m.get("result") == "D" else 0
            for m in older_2
        )

        trend = "improving" if recent_points >= older_points else "declining"

        consecutive_wins = 0
        for m in last_5:
            if m.get("result") == "W":
                consecutive_wins += 1
            else:
                break

        return {
            "venue": venue,
            "matches": last_5,
            "summary": {
                "wins": wins,
                "draws": draws,
                "losses": losses,
                "goals_scored": goals_scored,
                "goals_conceded": goals_conceded,
                "goals_scored_avg": round(goals_scored / len(last_5), 2),
                "goals_conceded_avg": round(goals_conceded / len(last_5), 2),
                "trend": trend,
                "consecutive_wins": consecutive_wins,
                "form_string": "".join(m.get("result", "?") for m in last_5),
            },
        }

    # ── Head to head ────────────────────────────────────────────────────────

    def _analyze_h2h(self, meetings: list) -> dict:
        """Analyze last 5 head-to-head meetings."""
        if not meetings:
            return {"meetings": [], "summary": {}}

        last_5 = meetings[:5]
        home_wins = sum(1 for m in last_5 if m.get("winner") == "home")
        draws = sum(1 for m in last_5 if m.get("winner") == "draw")
        away_wins = sum(1 for m in last_5 if m.get("winner") == "away")

        total_goals = [
            m.get("home_goals", 0) + m.get("away_goals", 0) for m in last_5
        ]
        avg_goals = round(sum(total_goals) / len(total_goals), 2)

        btts_count = sum(
            1
            for m in last_5
            if m.get("home_goals", 0) > 0 and m.get("away_goals", 0) > 0
        )
        over25_count = sum(
            1 for m in last_5 if m.get("home_goals", 0) + m.get("away_goals", 0) > 2.5
        )

        return {
            "meetings": last_5,
            "summary": {
                "home_wins": home_wins,
                "draws": draws,
                "away_wins": away_wins,
                "avg_goals_per_match": avg_goals,
                "btts_frequency": f"{btts_count}/{len(last_5)}",
                "over25_frequency": f"{over25_count}/{len(last_5)}",
                "btts_percentage": round(btts_count / len(last_5) * 100),
                "over25_percentage": round(over25_count / len(last_5) * 100),
                "goals_variance": round(max(total_goals) - min(total_goals), 1),
            },
        }

    # ── Standings ──────────────────────────────────────────────────────────

    def _analyze_standings(self, match_data: dict) -> dict:
        """Compare standings of both teams."""
        return {
            "home": {
                "position": match_data.get("home_standing", 0),
                "points": match_data.get("home_points", 0),
                "goal_difference": match_data.get("home_goal_diff", 0),
                "home_record": match_data.get("home_home_record", ""),
            },
            "away": {
                "position": match_data.get("away_standing", 0),
                "points": match_data.get("away_points", 0),
                "goal_difference": match_data.get("away_goal_diff", 0),
                "away_record": match_data.get("away_away_record", ""),
            },
            "position_gap": abs(
                match_data.get("home_standing", 0) - match_data.get("away_standing", 0)
            ),
        }

    # ── Final recommendation ──────────────────────────────────────────────

    def _build_recommendation(
        self, odds, home_form, away_form, h2h, standings, top_bottom, smart
    ) -> dict:
        """Build the final recommendation combining all analyses."""
        del home_form, away_form, h2h, standings  # not yet factored into the recommendation

        if smart.get("is_interesting") and smart.get("recommended_market"):
            return {
                "market": smart["recommended_market"],
                "odds": smart["recommended_market_odds"],
                "reasoning": smart["reasoning"],
                "confidence": smart["confidence_score"],
                "all_markets": smart.get("all_markets", []),
                "warning": (
                    top_bottom.get("alert_message")
                    if top_bottom.get("has_odds_anomaly")
                    else None
                ),
                "never_guaranteed": True,
                "disclaimer": DISCLAIMER,
            }

        # No smart-filter pick — surface top-vs-bottom market ideas if any
        tvb_markets = top_bottom.get("recommended_markets", []) if top_bottom else []
        if tvb_markets:
            best = tvb_markets[0]
            return {
                "market": best["market"],
                "selection": best["selection"],
                "reasoning": best["reasoning"],
                "confidence": 0,
                "all_markets": [],
                "warning": top_bottom.get("alert_message"),
                "never_guaranteed": True,
                "disclaimer": DISCLAIMER,
            }

        return {
            "market": None,
            "reasoning": "No clear market identified for this match.",
            "confidence": 0,
            "never_guaranteed": True,
            "disclaimer": DISCLAIMER,
        }

    # ── Data assembly ─────────────────────────────────────────────────────

    async def build_match_data(
        self, fixture_id: int, svc: MatchDataService = match_data_service
    ) -> dict:
        """
        Assemble the flat ``match_data`` dict the analyzers consume, from real
        match-service data only.

        Raises MatchServiceError when match-service is unreachable, ValueError
        when the fixture id does not exist. Neither is caught here — the
        caller (the router) decides how to surface it, same as every other
        prediction endpoint.
        """
        fixture_env = await svc.get_fixture(fixture_id)
        fixtures = fixture_env.get("response", [])
        if not fixtures:
            raise ValueError(f"Fixture {fixture_id} not found")

        fx = fixtures[0]
        home_id = fx["teams"]["home"]["id"]
        away_id = fx["teams"]["away"]["id"]
        league_id = fx["league"]["id"]
        season = fx["league"].get("season")

        odds_env, standings_env, home_stats_env, away_stats_env, h2h_env = await asyncio.gather(
            svc.get_match_odds(fixture_id),
            svc.get_league_standings(league_id, season),
            svc.get_team_stats(home_id, league_id, season),
            svc.get_team_stats(away_id, league_id, season),
            svc.get_h2h(home_id, away_id),
            return_exceptions=True,
        )

        data: dict = {
            "fixture_id": fixture_id,
            "home_team": fx["teams"]["home"]["name"],
            "away_team": fx["teams"]["away"]["name"],
            "league": fx["league"].get("name", ""),
        }
        data.update(_map_odds(_unwrap(odds_env)))
        data.update(_map_standings(_unwrap(standings_env), home_id, away_id))
        data.update(_map_team_stats(_unwrap(home_stats_env), "home"))
        data.update(_map_team_stats(_unwrap(away_stats_env), "away"))
        data["head_to_head"] = _map_h2h(_unwrap(h2h_env), home_id)
        return data

    async def collect_candidate_matches(
        self, date: str, svc: MatchDataService = match_data_service
    ) -> list[dict]:
        """
        Build ``match_data`` dicts for every fixture on ``date``.

        Bounded concurrency (see prediction_service._gather_predictions) for
        the same reason it exists there: an unbounded fan-out over a full
        matchday opened hundreds of simultaneous connections to match-service.
        A fixture this fails to build for is skipped and logged, never
        replaced with something invented — on a match-service outage this
        returns an empty list, which the smart-picks endpoint then reports
        honestly as zero picks rather than a fabricated set.
        """
        from src.services.prediction_service import _gather_predictions

        envelope = await svc.get_fixtures_by_date(date)
        fixtures: list[dict] = envelope.get("response", [])

        return await _gather_predictions(
            fixtures, lambda fixture_id: self.build_match_data(fixture_id, svc)
        )


# ── Mapping helpers (live match-service data -> flat match_data) ─────────────

def _unwrap(env):
    """Return env['response'] for a dict envelope, else None on any failure."""
    if isinstance(env, Exception):
        return None
    if isinstance(env, dict):
        return env.get("response", env)
    return env


def _to_float(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _map_odds(odds_response) -> dict:
    """Extract 1x2 + a few derived odds from an API-Football odds payload."""
    out: dict = {}
    if not odds_response:
        return out
    try:
        bets = odds_response[0]["bookmakers"][0]["bets"]
        for bet in bets:
            name = bet.get("name", "").lower()
            # Only the two markets below are read here, so `values` is only
            # built for them — other bet types (Asian Handicap, Correct
            # Score, ...) can carry a numeric `value` (e.g. -1.5) rather than
            # a string, and are otherwise unused. `str(...)` first keeps this
            # safe regardless of the type API-Football sends for a given bet.
            if "match winner" in name or name == "1x2":
                values = {str(v["value"]).lower(): _to_float(v["odd"]) for v in bet.get("values", [])}
                out["home_odds"] = values.get("home", 0)
                out["draw_odds"] = values.get("draw", 0)
                out["away_odds"] = values.get("away", 0)
            elif "over/under" in name or "goals over/under" in name:
                values = {str(v["value"]).lower(): _to_float(v["odd"]) for v in bet.get("values", [])}
                out.setdefault("over_15_odds", values.get("over 1.5", 0))
                out.setdefault("over_25_odds", values.get("over 2.5", 0))
    except (KeyError, IndexError, TypeError):
        pass
    return out


def _map_standings(standings_response, home_id: int, away_id: int) -> dict:
    """Pull positions / points / goal-diff for both teams from a standings payload."""
    out: dict = {}
    if not standings_response:
        return out
    try:
        table = standings_response[0]["league"]["standings"][0]
        out["total_teams_in_league"] = len(table)
        for row in table:
            tid = row.get("team", {}).get("id")
            side = "home" if tid == home_id else "away" if tid == away_id else None
            if not side:
                continue
            out[f"{side}_standing"] = row.get("rank", 0)
            out[f"{side}_points"] = row.get("points", 0)
            out[f"{side}_goal_diff"] = row.get("goalsDiff", 0)
            out[f"{side}_{'home' if side == 'home' else 'away'}_record"] = row.get("form", "")
    except (KeyError, IndexError, TypeError):
        pass
    return out


def _map_team_stats(stats_response, side: str) -> dict:
    """Derive goals averages + consecutive wins from a team-statistics payload."""
    out: dict = {}
    if not stats_response or not isinstance(stats_response, dict):
        return out
    try:
        goals = stats_response.get("goals", {})
        scored = goals.get("for", {}).get("average", {}).get("total")
        conceded = goals.get("against", {}).get("average", {}).get("total")
        if scored is not None:
            out[f"{side}_goals_scored_avg"] = _to_float(scored)
        if conceded is not None:
            out[f"{side}_goals_conceded_avg"] = _to_float(conceded)

        form = (stats_response.get("form") or "").upper()
        streak = 0
        for ch in reversed(form):
            if ch == "W":
                streak += 1
            else:
                break
        out[f"{side}_consecutive_wins"] = streak
    except (KeyError, TypeError):
        pass
    return out


def _map_h2h(h2h_response, home_id: int) -> list[dict]:
    """
    Map API-Football h2h fixtures to the {winner, home_goals, away_goals} shape
    _analyze_h2h expects, newest first. `home_id` is THIS match's home team —
    a head-to-head fixture may have had either side playing at home, so
    goals/winner are reoriented relative to the current fixture's home team
    rather than that historical fixture's own home team.
    """
    if not h2h_response:
        return []

    out: list[dict] = []
    for fx in h2h_response:
        try:
            home_goals_raw = fx["goals"]["home"]
            away_goals_raw = fx["goals"]["away"]
            if home_goals_raw is None or away_goals_raw is None:
                continue  # not yet played

            fixture_home_id = fx["teams"]["home"]["id"]
            # Reorient so "home"/"away" always mean this fixture's home team,
            # regardless of which side hosted that historical meeting.
            if fixture_home_id == home_id:
                home_goals, away_goals = home_goals_raw, away_goals_raw
            else:
                home_goals, away_goals = away_goals_raw, home_goals_raw

            winner = "home" if home_goals > away_goals else "away" if away_goals > home_goals else "draw"
            out.append({
                "date": fx.get("fixture", {}).get("date"),
                "winner": winner,
                "home_goals": home_goals,
                "away_goals": away_goals,
            })
        except (KeyError, TypeError):
            continue

    out.sort(key=lambda m: m.get("date") or "", reverse=True)
    return out


# Module-level singleton
deep_analysis_service = DeepAnalysisService()
