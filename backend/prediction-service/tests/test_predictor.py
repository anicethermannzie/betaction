"""
Tests for the main prediction engine (predictor.py).
"""

import pytest
from src.algorithm.predictor import predict, predict_with_markets, _parse_odds
from tests.test_new_analyzers import MOCK_STATS_HOME, MOCK_STATS_AWAY


MOCK_ODDS_RESPONSE = [
    {
        "bookmakers": [
            {
                "bets": [
                    {
                        "name": "Match Winner",
                        "values": [
                            {"value": "Home", "odd": "2.0"},
                            {"value": "Draw", "odd": "3.2"},
                            {"value": "Away", "odd": "4.0"},
                        ],
                    }
                ]
            }
        ]
    }
]


def test_parse_odds_valid():
    home_p, draw_p, away_p = _parse_odds(MOCK_ODDS_RESPONSE)
    assert 0.0 <= home_p <= 1.0
    assert 0.0 <= draw_p <= 1.0
    assert 0.0 <= away_p <= 1.0
    assert pytest.approx(home_p + draw_p + away_p) == 1.0


def test_parse_odds_empty_or_invalid():
    # Empty odds should fall back to neutral
    home_p, draw_p, away_p = _parse_odds([])
    assert pytest.approx(home_p, abs=1e-4) == 1/3
    assert pytest.approx(draw_p, abs=1e-4) == 1/3
    assert pytest.approx(away_p, abs=1e-4) == 1/3


def test_predict_engine():
    result = predict(
        fixture_id=100,
        home_team_id=1,
        away_team_id=2,
        home_team_name="Home FC",
        away_team_name="Away FC",
        league_id=39,
        season=2023,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
        h2h_fixtures=[],
        odds_response=MOCK_ODDS_RESPONSE,
    )

    assert result.fixture_id == 100
    assert result.home_team == "Home FC"
    assert result.away_team == "Away FC"
    assert pytest.approx(result.home_win + result.draw + result.away_win, abs=1e-2) == 1.0
    assert result.prediction in ["HOME_WIN", "DRAW", "AWAY_WIN"]
    assert result.confidence in ["high", "medium", "low"]


def test_predict_with_markets():
    result = predict_with_markets(
        fixture_id=100,
        home_team_id=1,
        away_team_id=2,
        home_team_name="Home FC",
        away_team_name="Away FC",
        league_id=39,
        league_name="Premier League",
        season=2023,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
        h2h_fixtures=[],
        odds_response=MOCK_ODDS_RESPONSE,
    )

    assert result.fixture_id == 100
    assert result.league_name == "Premier League"
    assert result.markets is not None
    assert result.markets.one_x_two is not None
    assert result.markets.over_under is not None
    assert result.markets.btts is not None
    assert result.markets.correct_score is not None
    assert result.markets.lead_at_anytime is not None
