"""
Tests for all 12 new betting market analyzers.
"""

import pytest

from src.algorithm.correct_score_analyzer import analyze_correct_score
from src.algorithm.halftime_fulltime_analyzer import analyze_halftime_fulltime
from src.algorithm.halftime_result_analyzer import analyze_halftime_result
from src.algorithm.team_total_goals_analyzer import analyze_team_total_goals
from src.algorithm.win_both_halves_analyzer import analyze_win_both_halves
from src.algorithm.win_either_half_analyzer import analyze_win_either_half
from src.algorithm.win_from_behind_analyzer import analyze_win_from_behind
from src.algorithm.draw_no_bet_analyzer import analyze_draw_no_bet
from src.algorithm.handicap_analyzer import analyze_handicap
from src.algorithm.btts_result_combo_analyzer import analyze_btts_result_combo
from src.algorithm.btts_total_goals_combo_analyzer import analyze_btts_total_goals_combo
from src.algorithm.lead_at_anytime_analyzer import analyze_lead_at_anytime


# Mock team stats with minute breakdown
MOCK_STATS_HOME = {
    "goals": {
        "for": {
            "minute": {
                "0-15": {"total": 2},
                "16-30": {"total": 3},
                "31-45": {"total": 4},
                "46-60": {"total": 3},
                "61-75": {"total": 2},
                "76-90": {"total": 5},
                "91-105": {"total": 1},
            }
        },
        "against": {
            "minute": {
                "0-15": {"total": 1},
                "16-30": {"total": 2},
                "31-45": {"total": 1},
                "46-60": {"total": 2},
                "61-75": {"total": 3},
                "76-90": {"total": 2},
            }
        }
    }
}

MOCK_STATS_AWAY = {
    "goals": {
        "for": {
            "minute": {
                "0-15": {"total": 1},
                "16-30": {"total": 1},
                "31-45": {"total": 2},
                "46-60": {"total": 4},
                "61-75": {"total": 3},
                "76-90": {"total": 2},
            }
        },
        "against": {
            "minute": {
                "0-15": {"total": 3},
                "16-30": {"total": 2},
                "31-45": {"total": 4},
                "46-60": {"total": 2},
                "61-75": {"total": 1},
                "76-90": {"total": 4},
            }
        }
    }
}


def test_correct_score_analyzer():
    res = analyze_correct_score(1.5, 1.0)
    assert len(res) == 10
    # Values should be probabilities between 0 and 1
    for score, prob in res.items():
        assert 0.0 <= prob <= 1.0
        assert "-" in score


def test_halftime_fulltime_analyzer():
    res = analyze_halftime_fulltime(
        home_xg=1.8,
        away_xg=1.2,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
        home_win=0.5,
        draw=0.25,
        away_win=0.25,
    )
    # Total combinations should sum to ≈ 1.0
    total = (
        res.home_home + res.draw_home + res.away_home +
        res.home_draw + res.draw_draw + res.away_draw +
        res.home_away + res.draw_away + res.away_away
    )
    assert pytest.approx(total, abs=1e-2) == 1.0


def test_halftime_result_analyzer():
    res = analyze_halftime_result(
        home_xg=1.5,
        away_xg=1.1,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
    )
    total = res.home_win_ht + res.draw_ht + res.away_win_ht
    assert pytest.approx(total, abs=1e-2) == 1.0


def test_team_total_goals_analyzer():
    res = analyze_team_total_goals(1.6, 1.2)
    # Check over + under = 1.0
    assert pytest.approx(res.home_over_0_5 + res.home_under_0_5, abs=1e-3) == 1.0
    assert pytest.approx(res.home_over_1_5 + res.home_under_1_5, abs=1e-3) == 1.0
    assert pytest.approx(res.home_over_2_5 + res.home_under_2_5, abs=1e-3) == 1.0
    assert pytest.approx(res.away_over_0_5 + res.away_under_0_5, abs=1e-3) == 1.0


def test_win_both_halves_analyzer():
    res = analyze_win_both_halves(
        home_xg=2.0,
        away_xg=1.0,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
    )
    assert 0.0 <= res.home_win_both <= 1.0
    assert 0.0 <= res.away_win_both <= 1.0


def test_win_either_half_analyzer():
    res = analyze_win_either_half(
        home_xg=2.0,
        away_xg=1.0,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
    )
    assert 0.0 <= res.home_win_either <= 1.0
    assert 0.0 <= res.away_win_either <= 1.0


def test_win_from_behind_analyzer():
    res = analyze_win_from_behind(
        home_xg=1.8,
        away_xg=1.2,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
        home_win=0.5,
        away_win=0.3,
    )
    assert 0.0 <= res.home_comeback <= 1.0
    assert 0.0 <= res.away_comeback <= 1.0
    assert res.any_comeback >= max(res.home_comeback, res.away_comeback)


def test_draw_no_bet_analyzer():
    res = analyze_draw_no_bet(0.6, 0.2)
    assert pytest.approx(res.home_dnb + res.away_dnb, abs=1e-3) == 1.0
    assert res.home_dnb == 0.75
    assert res.away_dnb == 0.25


def test_handicap_analyzer():
    res = analyze_handicap(1.5, 1.2)
    total_minus_1 = res.home_minus_1 + res.tie_minus_1 + res.away_plus_1
    assert pytest.approx(total_minus_1, abs=1e-2) == 1.0

    total_minus_2 = res.home_minus_2 + res.tie_minus_2 + res.away_plus_2
    assert pytest.approx(total_minus_2, abs=1e-2) == 1.0


def test_btts_result_combo_analyzer():
    res = analyze_btts_result_combo(
        home_xg=1.5,
        away_xg=1.2,
        home_win=0.5,
        draw=0.25,
        away_win=0.25,
        btts_yes=0.6,
        btts_no=0.4,
    )
    total = (
        res.btts_yes_home + res.btts_yes_draw + res.btts_yes_away +
        res.btts_no_home + res.btts_no_draw + res.btts_no_away
    )
    assert pytest.approx(total, abs=1e-2) == 1.0


def test_btts_total_goals_combo_analyzer():
    res = analyze_btts_total_goals_combo(
        home_xg=1.5,
        away_xg=1.2,
        btts_yes=0.6,
        btts_no=0.4,
    )
    # Each threshold combos should sum to 1.0
    t25 = res.btts_yes_over_2_5 + res.btts_yes_under_2_5 + res.btts_no_over_2_5 + res.btts_no_under_2_5
    assert pytest.approx(t25, abs=1e-2) == 1.0

    t35 = res.btts_yes_over_3_5 + res.btts_yes_under_3_5 + res.btts_no_over_3_5 + res.btts_no_under_3_5
    assert pytest.approx(t35, abs=1e-2) == 1.0


def test_lead_at_anytime_analyzer():
    res = analyze_lead_at_anytime(
        home_win=0.5,
        draw=0.3,
        away_win=0.2,
        home_xg=1.5,
        away_xg=1.0,
        home_comeback=0.08,
        away_comeback=0.04,
    )
    assert 0.0 <= res.home_lead_anytime <= 1.0
    assert 0.0 <= res.away_lead_anytime <= 1.0
