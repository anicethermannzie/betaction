"""
Configurable weights for the prediction algorithm.

All weights must sum to 1.0.
Adjust here to re-tune the model without touching algorithm logic.
"""

# ── Factor weights ────────────────────────────────────────────────────────────

FORM_WEIGHT: float = 0.30        # Recent form — last 5 matches
H2H_WEIGHT: float = 0.20         # Head-to-head historical record
HOME_AWAY_WEIGHT: float = 0.15   # Home/away venue advantage
GOALS_WEIGHT: float = 0.20       # Goals scored / conceded ratio (expected goals)
ODDS_WEIGHT: float = 0.15        # Bookmaker odds as probability calibration

assert abs(FORM_WEIGHT + H2H_WEIGHT + HOME_AWAY_WEIGHT + GOALS_WEIGHT + ODDS_WEIGHT - 1.0) < 1e-9, \
    "Prediction weights must sum to 1.0"

# ── Confidence thresholds ─────────────────────────────────────────────────────

HIGH_CONFIDENCE_THRESHOLD: float = 0.55
MEDIUM_CONFIDENCE_THRESHOLD: float = 0.40

# ── Scoring constants ─────────────────────────────────────────────────────────

FORM_WIN_POINTS: int = 3
FORM_DRAW_POINTS: int = 1
FORM_LOSS_POINTS: int = 0
FORM_MAX_SCORE: int = 15   # 5 wins × 3 points  (normalisation divisor)
FORM_MATCHES: int = 5      # number of recent matches to consider

H2H_MAX_MATCHES: int = 10  # maximum head-to-head matches to consider

# Neutral fallback when no historical data is available
NEUTRAL_SCORE: float = 0.50
