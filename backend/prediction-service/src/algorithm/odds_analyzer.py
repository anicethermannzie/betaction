"""
Odds anomaly detector (Avis 2).

Reads 1x2 bookmaker odds for a match, converts them to margin-free implied
probabilities, identifies the true favourite, and flags anomalies (favourite
priced too high, no clear favourite, draw unusually likely).

`detect_value_bet` compares our own model probability against a bookmaker's
implied probability to surface value.

Nothing here is a guarantee — this is statistical analysis only.
"""

from __future__ import annotations


class OddsAnalyzer:
    """Analyse bookmaker odds to detect anomalies and identify the favourite."""

    def analyze(self, match_data: dict) -> dict:
        """
        Analyze bookmaker odds to detect anomalies and
        identify the true favorite.

        Returns a graceful ``{"insufficient_data": True, ...}`` payload when
        no usable 1x2 odds are present, rather than raising.
        """
        home_odds = _as_float(match_data.get("home_odds", 0))
        draw_odds = _as_float(match_data.get("draw_odds", 0))
        away_odds = _as_float(match_data.get("away_odds", 0))

        if home_odds <= 0 and away_odds <= 0:
            return {
                "insufficient_data": True,
                "reason": "No usable 1x2 odds for this match",
                "favorite": None,
                "favorite_odds": 0,
                "favorite_implied_probability": 0.0,
                "home_implied_probability": 0.0,
                "draw_implied_probability": 0.0,
                "away_implied_probability": 0.0,
                "bookmaker_margin": 0.0,
                "anomaly_detected": False,
                "anomaly_reasons": [],
                "is_high_value_match": False,
            }

        # Convert odds to implied probabilities
        # prob = 1 / odds (then normalize to remove margin)
        home_prob = 1 / home_odds if home_odds > 0 else 0
        draw_prob = 1 / draw_odds if draw_odds > 0 else 0
        away_prob = 1 / away_odds if away_odds > 0 else 0
        total = home_prob + draw_prob + away_prob

        # Normalize (remove bookmaker margin)
        if total > 0:
            home_prob /= total
            draw_prob /= total
            away_prob /= total

        # Identify favorite
        favorite = "home" if home_prob > away_prob else "away"
        favorite_odds = home_odds if favorite == "home" else away_odds
        favorite_prob = home_prob if favorite == "home" else away_prob

        # Detect anomaly: favorite odds > 2.0 when one
        # team should clearly dominate
        anomaly_detected = False
        anomaly_reasons: list[str] = []

        if favorite_odds > 2.0:
            anomaly_detected = True
            anomaly_reasons.append("Favorite odds unusually high (>2.0)")

        if abs(home_prob - away_prob) < 0.05:
            anomaly_reasons.append("Very balanced match — no clear favorite")

        if 0 < draw_odds < 2.5:
            anomaly_reasons.append("Draw is highly likely according to bookmakers")

        # Value detection: compare our prediction vs bookmaker
        # If our predicted probability > implied probability -> value bet

        return {
            "favorite": favorite,
            "favorite_odds": favorite_odds,
            "favorite_implied_probability": round(favorite_prob, 3),
            "home_implied_probability": round(home_prob, 3),
            "draw_implied_probability": round(draw_prob, 3),
            "away_implied_probability": round(away_prob, 3),
            "bookmaker_margin": round((total - 1) * 100, 2),
            "anomaly_detected": anomaly_detected,
            "anomaly_reasons": anomaly_reasons,
            "is_high_value_match": 1.20 <= favorite_odds <= 1.60,
        }

    def detect_value_bet(self, our_probability: float, bookmaker_odds: float) -> dict:
        """
        Detect if there is value: our probability > implied probability.
        Value = our_prob > 1 / bookmaker_odds
        """
        our_probability = _as_float(our_probability)
        bookmaker_odds = _as_float(bookmaker_odds)

        implied_prob = 1 / bookmaker_odds if bookmaker_odds > 0 else 0
        has_value = our_probability > implied_prob > 0
        value_percentage = (our_probability - implied_prob) * 100

        return {
            "has_value": has_value,
            "our_probability": round(our_probability, 3),
            "implied_probability": round(implied_prob, 3),
            "value_percentage": round(value_percentage, 2),
            "recommendation": "VALUE BET" if has_value else "NO VALUE",
        }


def _as_float(value) -> float:
    """Coerce possibly-missing / string odds to a float, defaulting to 0.0."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


# Module-level singleton — mirrors the pattern used elsewhere in the service
odds_analyzer = OddsAnalyzer()
