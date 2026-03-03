"""
Pydantic models for prediction requests and responses.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class PredictionFactors(BaseModel):
    """Intermediate scores from each analysis module (all on 0–1 scale)."""
    home_form_score: float = Field(..., ge=0, le=1)
    away_form_score: float = Field(..., ge=0, le=1)
    home_h2h_score: float = Field(..., ge=0, le=1)
    away_h2h_score: float = Field(..., ge=0, le=1)
    home_expected_goals: float = Field(..., ge=0)
    away_expected_goals: float = Field(..., ge=0)
    home_home_win_rate: float = Field(..., ge=0, le=1)
    away_away_win_rate: float = Field(..., ge=0, le=1)


class PredictionResult(BaseModel):
    """Full prediction output for a single fixture."""
    fixture_id: int
    home_team: str
    away_team: str
    home_team_id: int
    away_team_id: int
    league_id: int
    season: int

    # Probabilities (sum to ≈ 1.0)
    home_win: float = Field(..., ge=0, le=1)
    draw: float = Field(..., ge=0, le=1)
    away_win: float = Field(..., ge=0, le=1)

    prediction: Literal["HOME_WIN", "DRAW", "AWAY_WIN"]
    confidence: Literal["high", "medium", "low"]

    factors: PredictionFactors

    cached: bool = False
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class PredictionResponse(BaseModel):
    """API response wrapper for a single prediction."""
    success: bool = True
    data: PredictionResult


class PredictionListResponse(BaseModel):
    """API response wrapper for multiple predictions."""
    success: bool = True
    count: int
    data: list[PredictionResult]


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
