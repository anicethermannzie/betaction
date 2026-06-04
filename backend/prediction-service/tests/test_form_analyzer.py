"""
Tests for form_analyzer — purely synchronous, no external dependencies.
"""

from src.algorithm.form_analyzer import analyze_form
from src.algorithm.weights import NEUTRAL_SCORE


def test_perfect_form_returns_one():
    assert analyze_form("WWWWW") == 1.0


def test_worst_form_returns_zero():
    assert analyze_form("LLLLL") == 0.0


def test_none_returns_neutral():
    assert analyze_form(None) == NEUTRAL_SCORE


def test_empty_string_returns_neutral():
    assert analyze_form("") == NEUTRAL_SCORE


def test_only_last_n_matches_are_used():
    # History before last FORM_MATCHES should be ignored
    # "LLLLL" prefix + "WWWWW" → only last 5 (all W) count → 1.0
    padding = "L" * 10
    assert analyze_form(padding + "WWWWW") == 1.0


def test_mixed_form_is_between_zero_and_one():
    score = analyze_form("WDLWL")
    assert 0.0 < score < 1.0


def test_draw_points_less_than_win():
    draw_score = analyze_form("DDDDD")
    win_score = analyze_form("WWWWW")
    assert draw_score < win_score


def test_unknown_characters_are_ignored():
    # 'X' is not W/D/L — treated as 0 points, same as a loss
    score_x = analyze_form("XXXXX")
    score_l = analyze_form("LLLLL")
    assert score_x == score_l == 0.0
