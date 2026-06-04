"""
Halftime Result analyzer.

Predicts the first-half result only (Home win, Draw, Away win) based on early scoring statistics.
"""

import math
from src.models.prediction import HalftimeResultPrediction


def _poisson_pmf(k: int, lam: float) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def _get_fh_ratio(team_stats: dict, key: str = "for") -> float:
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


def analyze_halftime_result(
    home_xg: float,
    away_xg: float,
    home_team_stats: dict,
    away_team_stats: dict,
) -> HalftimeResultPrediction:
    """
    Predict Halftime result (Home/Draw/Away) probabilities.
    """
    home_fh_scored = _get_fh_ratio(home_team_stats, "for")
    home_fh_conceded = _get_fh_ratio(home_team_stats, "against")
    away_fh_scored = _get_fh_ratio(away_team_stats, "for")
    away_fh_conceded = _get_fh_ratio(away_team_stats, "against")

    home_fh_xg = home_xg * (home_fh_scored + away_fh_conceded) / 2.0
    away_fh_xg = away_xg * (away_fh_scored + home_fh_conceded) / 2.0

    probs = {}
    for h in range(5):
        for a in range(5):
            probs[(h, a)] = _poisson_pmf(h, home_fh_xg) * _poisson_pmf(a, away_fh_xg)

    total_p = sum(probs.values()) or 1.0

    home_win_ht = sum(probs[(h, a)] for h, a in probs if h > a) / total_p
    draw_ht = sum(probs[(h, a)] for h, a in probs if h == a) / total_p
    away_win_ht = sum(probs[(h, a)] for h, a in probs if h < a) / total_p

    return HalftimeResultPrediction(
        home_win_ht=round(home_win_ht, 4),
        draw_ht=round(draw_ht, 4),
        away_win_ht=round(away_win_ht, 4),
    )
