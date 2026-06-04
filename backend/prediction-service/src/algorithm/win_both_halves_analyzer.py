"""
Win Both Halves analyzer.

Predicts if a team will win both the first and second halves individually.
"""

import math
from src.models.prediction import WinBothHalvesPrediction


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


def analyze_win_both_halves(
    home_xg: float,
    away_xg: float,
    home_team_stats: dict,
    away_team_stats: dict,
) -> WinBothHalvesPrediction:
    """
    Predict probability of a team winning both halves.
    """
    home_fh_scored = _get_fh_ratio(home_team_stats, "for")
    home_fh_conceded = _get_fh_ratio(home_team_stats, "against")
    away_fh_scored = _get_fh_ratio(away_team_stats, "for")
    away_fh_conceded = _get_fh_ratio(away_team_stats, "against")

    home_fh_xg = home_xg * (home_fh_scored + away_fh_conceded) / 2.0
    away_fh_xg = away_xg * (away_fh_scored + home_fh_conceded) / 2.0

    home_sh_xg = max(0.1, home_xg - home_fh_xg)
    away_sh_xg = max(0.1, away_xg - away_fh_xg)

    # 1st half win probabilities
    p_1h_home = sum(_poisson_pmf(h, home_fh_xg) * _poisson_pmf(a, away_fh_xg) for h in range(5) for a in range(5) if h > a)
    p_1h_away = sum(_poisson_pmf(h, home_fh_xg) * _poisson_pmf(a, away_fh_xg) for h in range(5) for a in range(5) if h < a)

    # 2nd half win probabilities
    p_2h_home = sum(_poisson_pmf(h, home_sh_xg) * _poisson_pmf(a, away_sh_xg) for h in range(5) for a in range(5) if h > a)
    p_2h_away = sum(_poisson_pmf(h, home_sh_xg) * _poisson_pmf(a, away_sh_xg) for h in range(5) for a in range(5) if h < a)

    return WinBothHalvesPrediction(
        home_win_both=round(p_1h_home * p_2h_home, 4),
        away_win_both=round(p_1h_away * p_2h_away, 4),
    )
