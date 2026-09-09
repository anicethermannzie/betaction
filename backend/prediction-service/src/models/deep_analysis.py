"""
Pydantic response models for the deep-analysis / smart-picks endpoints.

The analyzer outputs are intentionally dynamic (their keys depend on which
branches of the decision tree fire), so the payload models declare the
documented fields and allow extras rather than over-constraining.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class _Loose(BaseModel):
    """Base that keeps any additional analyzer keys instead of dropping them."""

    model_config = ConfigDict(extra="allow")


# ── Odds anomaly ────────────────────────────────────────────────────────────

class OddsAnomalyPayload(_Loose):
    favorite: Optional[str] = None
    favorite_odds: float = 0
    favorite_implied_probability: float = 0.0
    home_implied_probability: float = 0.0
    draw_implied_probability: float = 0.0
    away_implied_probability: float = 0.0
    bookmaker_margin: float = 0.0
    anomaly_detected: bool = False
    anomaly_reasons: list[str] = Field(default_factory=list)
    is_high_value_match: bool = False
    insufficient_data: bool = False


class OddsAnomalyResponse(BaseModel):
    success: bool = True
    fixture_id: int
    data: OddsAnomalyPayload
    disclaimer: str


# ── Top vs bottom ───────────────────────────────────────────────────────────

class TopVsBottomPayload(_Loose):
    is_top_vs_bottom: bool
    top_team: Optional[str] = None
    bottom_team: Optional[str] = None
    top_position: Optional[int] = None
    bottom_position: Optional[int] = None
    position_gap: Optional[int] = None
    has_odds_anomaly: Optional[bool] = None
    alert_message: Optional[str] = None
    is_bottom_low_scoring: Optional[bool] = None
    is_bottom_weak_defense: Optional[bool] = None
    recommended_markets: list[dict[str, Any]] = Field(default_factory=list)


class TopVsBottomResponse(BaseModel):
    success: bool = True
    fixture_id: int
    data: TopVsBottomPayload
    disclaimer: str


# ── Deep analysis ───────────────────────────────────────────────────────────

class DeepAnalysisPayload(_Loose):
    odds_analysis: dict[str, Any]
    home_form: dict[str, Any]
    away_form: dict[str, Any]
    h2h: dict[str, Any]
    standings: dict[str, Any]
    top_vs_bottom: dict[str, Any]
    smart_filter: dict[str, Any]
    final_recommendation: dict[str, Any]


class DeepAnalysisResponse(BaseModel):
    success: bool = True
    fixture_id: int
    data: DeepAnalysisPayload
    disclaimer: str


# ── Smart picks ─────────────────────────────────────────────────────────────

class SmartAnalysisPayload(_Loose):
    is_interesting: bool
    favorite: Optional[str] = None
    favorite_position: Optional[int] = None
    opponent_position: Optional[int] = None
    position_gap: Optional[int] = None
    consecutive_wins: Optional[int] = None
    recommended_market: Optional[str] = None
    recommended_market_odds: float = 0
    reasoning: Optional[str] = None
    confidence_score: int = 0
    all_markets: list[dict[str, Any]] = Field(default_factory=list)
    target_odds_range: Optional[str] = None


class SmartPickResponse(_Loose):
    """One ranked match. Carries the original match fields plus smart_analysis."""

    fixture_id: Optional[int] = None
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    league: Optional[str] = None
    smart_analysis: SmartAnalysisPayload


class SmartPicksListResponse(BaseModel):
    success: bool = True
    count: int
    date: str
    filters: dict[str, Any]
    data: list[SmartPickResponse]
    disclaimer: str
