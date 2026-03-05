"""
Pydantic models for prediction requests and responses.
"""

from datetime import datetime
from enum import Enum
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


# ── Multi-market models ────────────────────────────────────────────────────────

class OverUnderPrediction(BaseModel):
    over_1_5: float = Field(..., ge=0, le=1)
    under_1_5: float = Field(..., ge=0, le=1)
    over_2_5: float = Field(..., ge=0, le=1)
    under_2_5: float = Field(..., ge=0, le=1)
    over_3_5: float = Field(..., ge=0, le=1)
    under_3_5: float = Field(..., ge=0, le=1)


class BttsPrediction(BaseModel):
    btts_yes: float = Field(..., ge=0, le=1)
    btts_no: float = Field(..., ge=0, le=1)


class CornersPrediction(BaseModel):
    over_8_5: float = Field(..., ge=0, le=1)
    under_8_5: float = Field(..., ge=0, le=1)
    over_9_5: float = Field(..., ge=0, le=1)
    under_9_5: float = Field(..., ge=0, le=1)
    over_10_5: float = Field(..., ge=0, le=1)
    under_10_5: float = Field(..., ge=0, le=1)


class DoubleChancePrediction(BaseModel):
    dc_1x: float = Field(..., ge=0, le=1)  # home win or draw
    dc_12: float = Field(..., ge=0, le=1)  # home win or away win
    dc_x2: float = Field(..., ge=0, le=1)  # draw or away win


class CleanSheetPrediction(BaseModel):
    home_clean_sheet: float = Field(..., ge=0, le=1)
    away_clean_sheet: float = Field(..., ge=0, le=1)


class MarketsResult(BaseModel):
    over_under: OverUnderPrediction
    btts: BttsPrediction
    corners: CornersPrediction
    double_chance: DoubleChancePrediction
    clean_sheet: CleanSheetPrediction


class FullPredictionResult(PredictionResult):
    """Extends PredictionResult with all secondary markets + fixture metadata."""
    markets: MarketsResult
    league_name: str = ""
    kickoff: Optional[datetime] = None


class FullPredictionResponse(BaseModel):
    """API response wrapper for a full multi-market prediction."""
    success: bool = True
    data: FullPredictionResult


# ── Ticket models ─────────────────────────────────────────────────────────────

class TicketTier(str, Enum):
    ULTRA_SAFE = "ultra_safe"
    SAFE = "safe"
    MODERATE = "moderate"
    RISKY = "risky"


class TicketLeg(BaseModel):
    fixture_id: int
    match: str
    league: str
    kickoff: Optional[datetime] = None
    market: str
    selection: str
    probability: float = Field(..., ge=0, le=1)
    odds: float = Field(..., gt=1)


class Ticket(BaseModel):
    id: str
    tier: str
    name: str
    emoji: str
    description: str
    legs: list[TicketLeg]
    combined_odds: float
    combined_probability: float
    potential_return_per_unit: float
    confidence: Literal["high", "medium", "low"]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class TicketResponse(BaseModel):
    """API response wrapper for ticket list."""
    success: bool = True
    count: int
    data: list[Ticket]
