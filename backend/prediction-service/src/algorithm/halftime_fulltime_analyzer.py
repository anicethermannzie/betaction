"""
Halftime/Fulltime combination analyzer.

Predicts the 9 possible HT/FT combinations based on team first-half scoring patterns
and transition probability models (comebacks, dominance).
"""

import math
from src.models.prediction import HalftimeFulltimePrediction


def _poisson_pmf(k: int, lam: float) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def _get_fh_ratio(team_stats: dict, key: str = "for") -> float:
    """Extract first-half goal ratio from minute-by-minute stats."""
    try:
        goals = team_stats.get("goals", {})
        for_goals = goals.get("for", goals.get("for_", {}))
        against_goals = goals.get("against", {})

        minutes = against_goals.get("minute", {}) if key == "against" else for_goals.get("minute", {})
        fh_keys = ["0-15", "16-30", "31-45"]
        fh_total = 0
        total = 0
        for m_range, data in minutes.items():
            val = data.get("total")
            if val is not None:
                val = int(val)
                total += val
                if m_range in fh_keys:
                    fh_total += val
        if total > 0:
            return fh_total / total
    except Exception:
        pass
    return 0.45


def analyze_halftime_fulltime(
    home_xg: float,
    away_xg: float,
    home_team_stats: dict,
    away_team_stats: dict,
    home_win: float,
    draw: float,
    away_win: float,
) -> HalftimeFulltimePrediction:
    """
    Predict Halftime/Fulltime combination probabilities.
    """
    # 1. First-half scoring and conceding ratios
    home_fh_scored = _get_fh_ratio(home_team_stats, "for")
    home_fh_conceded = _get_fh_ratio(home_team_stats, "against")
    away_fh_scored = _get_fh_ratio(away_team_stats, "for")
    away_fh_conceded = _get_fh_ratio(away_team_stats, "against")

    # 2. First-half expected goals
    home_fh_xg = home_xg * (home_fh_scored + away_fh_conceded) / 2.0
    away_fh_xg = away_xg * (away_fh_scored + home_fh_conceded) / 2.0

    # 3. Compute 1st half result probabilities using Poisson (0 to 4 goals)
    probs_ht = {}
    for h in range(5):
        for a in range(5):
            probs_ht[(h, a)] = _poisson_pmf(h, home_fh_xg) * _poisson_pmf(a, away_fh_xg)

    total_ht = sum(probs_ht.values()) or 1.0
    home_win_ht = sum(probs_ht[(h, a)] for h, a in probs_ht if h > a) / total_ht
    draw_ht = sum(probs_ht[(h, a)] for h, a in probs_ht if h == a) / total_ht
    away_win_ht = sum(probs_ht[(h, a)] for h, a in probs_ht if h < a) / total_ht

    # 4. Joint probabilities via transition models
    p_home_home = home_win_ht * (0.70 + 0.15 * home_win)
    p_home_draw = home_win_ht * (0.20 * draw)
    p_home_away = home_win_ht * (0.10 * away_win)

    p_draw_home = draw_ht * home_win * 1.2
    p_draw_draw = draw_ht * draw * 1.4
    p_draw_away = draw_ht * away_win * 1.2

    p_away_home = away_win_ht * (0.10 * home_win)
    p_away_draw = away_win_ht * (0.20 * draw)
    p_away_away = away_win_ht * (0.70 + 0.15 * away_win)

    # Normalize combinations to sum to 1.0
    total = (
        p_home_home + p_home_draw + p_home_away +
        p_draw_home + p_draw_draw + p_draw_away +
        p_away_home + p_away_draw + p_away_away
    )
    if total <= 0:
        total = 1.0

    return HalftimeFulltimePrediction(
        home_home=round(p_home_home / total, 4),
        draw_home=round(p_draw_home / total, 4),
        away_home=round(p_away_home / total, 4),
        home_draw=round(p_home_draw / total, 4),
        draw_draw=round(p_draw_draw / total, 4),
        away_draw=round(p_away_draw / total, 4),
        home_away=round(p_home_away / total, 4),
        draw_away=round(p_draw_away / total, 4),
        away_away=round(p_away_away / total, 4),
    )
