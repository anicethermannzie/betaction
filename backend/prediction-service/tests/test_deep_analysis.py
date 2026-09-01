"""
Tests for the deep-analysis features (Avis 2, 3, 4):
  - OddsAnalyzer
  - TopVsBottomAnalyzer
  - SmartMatchFilter
  - DeepAnalysisService
  - the 5 new router endpoints
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.algorithm.odds_analyzer import OddsAnalyzer
from src.algorithm.top_vs_bottom_analyzer import TopVsBottomAnalyzer
from src.services.smart_match_filter import SmartMatchFilter
from src.services.deep_analysis_service import DeepAnalysisService, DISCLAIMER
from src.services.deep_analysis_mock import MOCK_MATCH_BY_FIXTURE_ID, DEEP_ANALYSIS_MOCK_MATCHES


client = TestClient(app)

MATCH_1 = MOCK_MATCH_BY_FIXTURE_ID[900001]  # classic top vs bottom
MATCH_2 = MOCK_MATCH_BY_FIXTURE_ID[900002]  # odds anomaly
MATCH_3 = MOCK_MATCH_BY_FIXTURE_ID[900003]  # low-scoring top vs bottom
MATCH_4 = MOCK_MATCH_BY_FIXTURE_ID[900004]  # no market in range


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
    ranked = SmartMatchFilter().filter_interesting_matches(DEEP_ANALYSIS_MOCK_MATCHES)
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


# ── Router endpoints ──────────────────────────────────────────────────────

def test_endpoint_deep_analysis_mock_fixture():
    r = client.get("/predictions/900001/deep-analysis")
    assert r.status_code == 200
    body = r.json()
    assert body["fixture_id"] == 900001
    assert body["disclaimer"] == DISCLAIMER
    assert body["data"]["smart_filter"]["recommended_market"] == "win"


def test_endpoint_odds_anomaly_mock_fixture():
    r = client.get("/predictions/900002/odds-anomaly")
    assert r.status_code == 200
    assert r.json()["data"]["anomaly_detected"] is True


def test_endpoint_top_vs_bottom_hit_and_404():
    ok = client.get("/predictions/900001/top-vs-bottom")
    assert ok.status_code == 200
    assert ok.json()["data"]["is_top_vs_bottom"] is True

    not_tvb = client.get("/predictions/900004/top-vs-bottom")
    assert not_tvb.status_code == 404


def test_endpoint_smart_picks_today():
    with patch(
        "src.routers.prediction_router.deep_analysis_service.collect_candidate_matches",
        new_callable=AsyncMock,
    ) as mock_collect:
        mock_collect.return_value = [dict(m) for m in DEEP_ANALYSIS_MOCK_MATCHES]
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
