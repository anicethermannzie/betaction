"""
Form analyzer — evaluates a team's recent performance.

Input:  form string from API-Football team statistics (e.g. "WWDLW")
        The string is ordered oldest → newest, so we take the last N chars.
Output: form_score ∈ [0, 1]
        Computed as total_points / FORM_MAX_SCORE
        where Win=3, Draw=1, Loss=0 over the last FORM_MATCHES games.
"""

from src.algorithm.weights import (
    FORM_WIN_POINTS,
    FORM_DRAW_POINTS,
    FORM_LOSS_POINTS,
    FORM_MAX_SCORE,
    FORM_MATCHES,
    NEUTRAL_SCORE,
)


def analyze_form(form_string: str | None) -> float:
    """
    Parse a form string and return a normalised score in [0, 1].

    Args:
        form_string: e.g. "WWDLWDL". If None or empty, returns NEUTRAL_SCORE.

    Returns:
        float — 0.0 (worst possible form) to 1.0 (perfect form).
    """
    if not form_string:
        return NEUTRAL_SCORE

    # Take the most recent FORM_MATCHES results (rightmost characters)
    recent = form_string.upper()[-FORM_MATCHES:]

    points = 0
    for result in recent:
        if result == "W":
            points += FORM_WIN_POINTS
        elif result == "D":
            points += FORM_DRAW_POINTS
        elif result == "L":
            points += FORM_LOSS_POINTS
        # Unknown characters are ignored (treated as 0 points)

    # Normalise against the maximum achievable score for the games played
    max_possible = len(recent) * FORM_WIN_POINTS
    if max_possible == 0:
        return NEUTRAL_SCORE

    return points / max_possible
