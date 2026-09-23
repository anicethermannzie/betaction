"""
Tests for the deep-analysis features:
  - OddsAnalyzer
  - TopVsBottomAnalyzer
  - SmartMatchFilter
  - DeepAnalysisService
  - services/entitlements.py::limit_deep_analysis
  - the router endpoints

The analyzer/service unit tests below use realistic fixture dicts from
tests/deep_analysis_fixtures.py — hand-built inputs, never served to a real
client. The router tests mock deep_analysis_service.build_match_data /
collect_candidate_matches at the boundary, the same way test_prediction_router.py
mocks the prediction pipeline — no live match-service call, and nothing
resembling the old mock-fixture-id special case in production code, because
that no longer exists.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.algorithm.odds_analyzer import OddsAnalyzer
from src.algorithm.top_vs_bottom_analyzer import TopVsBottomAnalyzer
from src.services.smart_match_filter import SmartMatchFilter
from src.services.deep_analysis_service import DeepAnalysisService, DISCLAIMER, _map_odds
from src.services.entitlements import limit_deep_analysis
from tests.deep_analysis_fixtures import ALL_FIXTURES, MATCH_1, MATCH_2, MATCH_3, MATCH_4


client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_redis_lifespan():
    with patch("src.main.init_redis", new_callable=AsyncMock), \
         patch("src.main.close_redis", new_callable=AsyncMock):
        yield


# ── OddsAnalyzer ───────────────────────────────────────────────────────────

def test_odds_analyzer_identifies_favorite_and_margin():
    out = OddsAnalyzer().analyze(MATCH_1)
    assert out["favorite"] == "home"
    assert out["is_high_value_match"] is True          # 1.35 in [1.20, 1.60]
    assert out["bookmaker_margin"] > 0
    assert abs(
        out["home_implied_probability"]
        + out["draw_implied_probability"]
        + out["away_implied_probability"]
        - 1.0
    ) < 1e-6


def test_odds_analyzer_flags_high_favorite_odds():
    out = OddsAnalyzer().analyze(MATCH_2)   # away priced 2.50
    assert out["anomaly_detected"] is True
    assert any("unusually high" in r for r in out["anomaly_reasons"])


def test_odds_analyzer_insufficient_data():
    out = OddsAnalyzer().analyze({})
    assert out["insufficient_data"] is True
    assert out["favorite"] is None


def test_detect_value_bet():
    out = OddsAnalyzer().detect_value_bet(our_probability=0.70, bookmaker_odds=2.0)
    assert out["has_value"] is True
    assert out["recommendation"] == "VALUE BET"
    assert out["value_percentage"] == pytest.approx(20.0, abs=0.1)

    none = OddsAnalyzer().detect_value_bet(our_probability=0.40, bookmaker_odds=2.0)
    assert none["has_value"] is False
    assert none["recommendation"] == "NO VALUE"


# ── TopVsBottomAnalyzer ────────────────────────────────────────────────────

def test_top_vs_bottom_detected():
    out = TopVsBottomAnalyzer().analyze(MATCH_1)
    assert out["is_top_vs_bottom"] is True
    assert out["top_team"] == "home"
    assert out["bottom_team"] == "away"
    assert out["position_gap"] == 17


def test_top_vs_bottom_low_scoring_recommends_under_and_btts_no():
    out = TopVsBottomAnalyzer().analyze(MATCH_3)
    assert out["is_top_vs_bottom"] is True
    assert out["is_bottom_low_scoring"] is True
    selections = {m["selection"] for m in out["recommended_markets"]}
    assert "Under 3.5 goals" in selections
    assert "BTTS No" in selections
    assert len(out["recommended_markets"]) <= 4


def test_not_top_vs_bottom():
    assert TopVsBottomAnalyzer().analyze(MATCH_4) == {"is_top_vs_bottom": False}


def test_top_vs_bottom_insufficient_data():
    out = TopVsBottomAnalyzer().analyze({"home_standing": 0, "away_standing": 0})
    assert out["is_top_vs_bottom"] is False
    assert out["insufficient_data"] is True


# ── SmartMatchFilter ──────────────────────────────────────────────────────

def test_smart_filter_picks_win_for_strong_favorite():
    out = SmartMatchFilter()._evaluate_match(MATCH_1)
    assert out["is_interesting"] is True
    assert out["recommended_market"] == "win"
    assert out["confidence_score"] == 100
    assert len(out["all_markets"]) == 7


def test_smart_filter_switches_to_double_chance_when_win_odds_high():
    out = SmartMatchFilter()._evaluate_match(MATCH_2)
    assert out["is_interesting"] is True
    assert out["recommended_market"] == "double_chance"
    assert 1.20 <= out["recommended_market_odds"] <= 1.60


def test_smart_filter_skips_when_no_market_in_range():
    out = SmartMatchFilter()._evaluate_match(MATCH_4)
    assert out["is_interesting"] is False
    assert "target odds range" in out["reason"]


def test_smart_filter_ranks_by_confidence():
    ranked = SmartMatchFilter().filter_interesting_matches(ALL_FIXTURES)
    assert [m["fixture_id"] for m in ranked]  # at least one pick
    scores = [m["smart_analysis"]["confidence_score"] for m in ranked]
    assert scores == sorted(scores, reverse=True)
    assert 900004 not in [m["fixture_id"] for m in ranked]


# ── DeepAnalysisService ───────────────────────────────────────────────────

def test_deep_analysis_service_shape():
    out = DeepAnalysisService().analyze_match(MATCH_1)
    for key in (
        "odds_analysis", "home_form", "away_form", "h2h",
        "standings", "top_vs_bottom", "smart_filter", "final_recommendation",
    ):
        assert key in out
    assert out["disclaimer"] == DISCLAIMER
    assert out["final_recommendation"]["never_guaranteed"] is True
    assert out["home_form"]["summary"]["form_string"] == "WWWWW"
    assert out["home_form"]["summary"]["consecutive_wins"] == 5


def test_deep_analysis_service_handles_empty_data():
    out = DeepAnalysisService().analyze_match({})
    assert out["odds_analysis"]["insufficient_data"] is True
    assert out["final_recommendation"]["market"] is None
    assert out["disclaimer"] == DISCLAIMER


def test_build_match_data_has_no_mock_fallback():
    """
    The removed anti-pattern: build_match_data used to special-case fixture
    ids 900001-900004 and return hardcoded data for them without ever calling
    match-service. It must now treat those the same as any other fixture id —
    i.e. actually call the injected service.
    """
    from unittest.mock import AsyncMock, MagicMock
    from src.services.deep_analysis_service import deep_analysis_service

    svc = MagicMock()
    svc.get_fixture = AsyncMock(return_value={"response": []})  # "not found"

    with pytest.raises(ValueError):
        import asyncio
        asyncio.get_event_loop().run_until_complete(
            deep_analysis_service.build_match_data(900001, svc)
        )
    svc.get_fixture.assert_awaited_once_with(900001)


# ── limit_deep_analysis (entitlement) ─────────────────────────────────────

def test_limit_deep_analysis_vip_gets_everything_unchanged():
    analysis = DeepAnalysisService().analyze_match(MATCH_1)
    shaped, limited = limit_deep_analysis(analysis, "vip")
    assert shaped is analysis
    assert limited is False


def test_limit_deep_analysis_free_gets_only_the_top_level_recommendation():
    analysis = DeepAnalysisService().analyze_match(MATCH_1)
    shaped, limited = limit_deep_analysis(analysis, "free")

    assert limited is True
    # Kept: the bare facts.
    assert shaped["final_recommendation"]["market"] == analysis["final_recommendation"]["market"]
    assert shaped["final_recommendation"]["odds"] == analysis["final_recommendation"]["odds"]
    assert shaped["final_recommendation"]["confidence"] == analysis["final_recommendation"]["confidence"]
    # Withheld: reasoning, all_markets, and every supporting section.
    assert "reasoning" not in shaped["final_recommendation"]
    assert "all_markets" not in shaped["final_recommendation"]
    for section in ("home_form", "away_form", "h2h", "standings", "top_vs_bottom", "smart_filter"):
        assert shaped[section] == {}


def test_limit_deep_analysis_free_keeps_the_anomaly_flag_but_not_the_detail():
    analysis = DeepAnalysisService().analyze_match(MATCH_2)  # has an odds anomaly
    shaped, _ = limit_deep_analysis(analysis, "free")

    assert shaped["odds_analysis"]["anomaly_detected"] is True
    assert "anomaly_reasons" not in shaped["odds_analysis"]
    assert "favorite_implied_probability" not in shaped["odds_analysis"]


# ── Router endpoints ──────────────────────────────────────────────────────

def test_endpoint_deep_analysis():
    with patch(
        "src.routers.prediction_router.deep_analysis_service.build_match_data",
        new_callable=AsyncMock,
    ) as mock_build:
        mock_build.return_value = MATCH_1
        r = client.get("/predictions/900001/deep-analysis")

    assert r.status_code == 200
    body = r.json()
    assert body["fixture_id"] == 900001
    assert body["disclaimer"] == DISCLAIMER
    # No auth header -> anonymous/free -> shaped response.
    assert body["plan"] == "free"
    assert body["limited"] is True
    assert body["data"]["smart_filter"] == {}


def test_endpoint_deep_analysis_not_found():
    with patch(
        "src.routers.prediction_router.deep_analysis_service.build_match_data",
        new_callable=AsyncMock,
    ) as mock_build:
        mock_build.side_effect = ValueError("Fixture 999999 not found")
        r = client.get("/predictions/999999/deep-analysis")

    assert r.status_code == 404


def test_endpoint_odds_anomaly():
    with patch(
        "src.routers.prediction_router.deep_analysis_service.build_match_data",
        new_callable=AsyncMock,
    ) as mock_build:
        mock_build.return_value = MATCH_2
        r = client.get("/predictions/900002/odds-anomaly")

    assert r.status_code == 200
    assert r.json()["data"]["anomaly_detected"] is True


def test_endpoint_top_vs_bottom_hit_and_404():
    with patch(
        "src.routers.prediction_router.deep_analysis_service.build_match_data",
        new_callable=AsyncMock,
    ) as mock_build:
        mock_build.return_value = MATCH_1
        ok = client.get("/predictions/900001/top-vs-bottom")
    assert ok.status_code == 200
    assert ok.json()["data"]["is_top_vs_bottom"] is True

    with patch(
        "src.routers.prediction_router.deep_analysis_service.build_match_data",
        new_callable=AsyncMock,
    ) as mock_build:
        mock_build.return_value = MATCH_4
        not_tvb = client.get("/predictions/900004/top-vs-bottom")
    assert not_tvb.status_code == 404


def test_endpoint_smart_picks_today():
    with patch(
        "src.routers.prediction_router.deep_analysis_service.collect_candidate_matches",
        new_callable=AsyncMock,
    ) as mock_collect:
        mock_collect.return_value = [dict(m) for m in ALL_FIXTURES]
        r = client.get("/predictions/smart-picks/today?min_odds=1.20&max_odds=1.60&limit=10")
    assert r.status_code == 200
    body = r.json()
    assert body["disclaimer"] == DISCLAIMER
    assert body["count"] >= 1
    ids = [p["fixture_id"] for p in body["data"]]
    assert 900004 not in ids            # filtered out
    assert body["data"][0]["smart_analysis"]["confidence_score"] >= body["data"][-1]["smart_analysis"]["confidence_score"]


def test_endpoint_smart_picks_by_date_bad_format():
    r = client.get("/predictions/smart-picks/date/2026-3-1")
    assert r.status_code == 422


def test_endpoint_deep_analysis_propagates_match_service_outage():
    from src.services.match_data_service import MatchServiceError

    with patch(
        "src.routers.prediction_router.deep_analysis_service.build_match_data",
        new_callable=AsyncMock,
    ) as mock_build:
        mock_build.side_effect = MatchServiceError("match-service unreachable")
        r = client.get("/predictions/900001/deep-analysis")

    assert r.status_code == 503


# ── _map_odds ──────────────────────────────────────────────────────────────
# Regression coverage for a live-data crash found while smoke-testing against
# the real API-Football feed: a bookmaker's "Match Winner" values are always
# string labels ("Home"/"Draw"/"Away"), but other bet types on the same
# odds response — Asian Handicap in particular — carry a *numeric* `value`
# (e.g. -1.5). The old code called `.lower()` on every bet's values
# unconditionally, so the very first non-1X2/Over-Under bet with a numeric
# value crashed the whole /deep-analysis request with an AttributeError.

def _odds_response(bets: list[dict]) -> list[dict]:
    return [{"bookmakers": [{"bets": bets}]}]


def test_map_odds_extracts_match_winner_and_over_under():
    odds = _odds_response([
        {"name": "Match Winner", "values": [
            {"value": "Home", "odd": "1.73"},
            {"value": "Draw", "odd": "3.40"},
            {"value": "Away", "odd": "4.20"},
        ]},
        {"name": "Goals Over/Under", "values": [
            {"value": "Over 1.5", "odd": "1.20"},
            {"value": "Over 2.5", "odd": "2.10"},
        ]},
    ])

    result = _map_odds(odds)

    assert result == {
        "home_odds": 1.73, "draw_odds": 3.40, "away_odds": 4.20,
        "over_15_odds": 1.20, "over_25_odds": 2.10,
    }


def test_map_odds_ignores_bet_types_with_numeric_values():
    """A real API-Football odds payload for a match with an Asian Handicap
    market listed before Match Winner must not crash, and must still pick up
    the Match Winner odds that follow it."""
    odds = _odds_response([
        {"name": "Asian Handicap", "values": [
            {"value": -1.5, "odd": "1.90"},   # numeric value, not a string
            {"value": 1.5, "odd": "1.95"},
        ]},
        {"name": "Match Winner", "values": [
            {"value": "Home", "odd": "1.73"},
            {"value": "Draw", "odd": "3.40"},
            {"value": "Away", "odd": "4.20"},
        ]},
    ])

    result = _map_odds(odds)

    assert result == {"home_odds": 1.73, "draw_odds": 3.40, "away_odds": 4.20}


def test_map_odds_handles_empty_and_malformed_input():
    assert _map_odds(None) == {}
    assert _map_odds([]) == {}
    assert _map_odds([{"bookmakers": []}]) == {}
    assert _map_odds([{"bookmakers": [{"bets": []}]}]) == {}
