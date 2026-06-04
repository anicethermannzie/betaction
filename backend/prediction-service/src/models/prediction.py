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

class MatchWinnerPrediction(BaseModel):
    home_win: float = Field(..., ge=0, le=1)
    draw: float = Field(..., ge=0, le=1)
    away_win: float = Field(..., ge=0, le=1)


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


class HalftimeFulltimePrediction(BaseModel):
    home_home: float = Field(..., ge=0, le=1)
    draw_home: float = Field(..., ge=0, le=1)
    away_home: float = Field(..., ge=0, le=1)
    home_draw: float = Field(..., ge=0, le=1)
    draw_draw: float = Field(..., ge=0, le=1)
    away_draw: float = Field(..., ge=0, le=1)
    home_away: float = Field(..., ge=0, le=1)
    draw_away: float = Field(..., ge=0, le=1)
    away_away: float = Field(..., ge=0, le=1)


class HalftimeResultPrediction(BaseModel):
    home_win_ht: float = Field(..., ge=0, le=1)
    draw_ht: float = Field(..., ge=0, le=1)
    away_win_ht: float = Field(..., ge=0, le=1)


class TeamTotalGoalsPrediction(BaseModel):
    home_over_0_5: float = Field(..., ge=0, le=1)
    home_over_1_5: float = Field(..., ge=0, le=1)
    home_over_2_5: float = Field(..., ge=0, le=1)
    away_over_0_5: float = Field(..., ge=0, le=1)
    away_over_1_5: float = Field(..., ge=0, le=1)
    away_over_2_5: float = Field(..., ge=0, le=1)
    home_under_0_5: float = Field(..., ge=0, le=1)
    home_under_1_5: float = Field(..., ge=0, le=1)
    home_under_2_5: float = Field(..., ge=0, le=1)
    away_under_0_5: float = Field(..., ge=0, le=1)
    away_under_1_5: float = Field(..., ge=0, le=1)
    away_under_2_5: float = Field(..., ge=0, le=1)


class WinBothHalvesPrediction(BaseModel):
    home_win_both: float = Field(..., ge=0, le=1)
    away_win_both: float = Field(..., ge=0, le=1)


class WinEitherHalfPrediction(BaseModel):
    home_win_either: float = Field(..., ge=0, le=1)
    away_win_either: float = Field(..., ge=0, le=1)


class WinFromBehindPrediction(BaseModel):
    home_comeback: float = Field(..., ge=0, le=1)
    away_comeback: float = Field(..., ge=0, le=1)
    any_comeback: float = Field(..., ge=0, le=1)


class DrawNoBetPrediction(BaseModel):
    home_dnb: float = Field(..., ge=0, le=1)
    away_dnb: float = Field(..., ge=0, le=1)


class HandicapPrediction(BaseModel):
    home_minus_1: float = Field(..., ge=0, le=1)
    tie_minus_1: float = Field(..., ge=0, le=1)
    away_plus_1: float = Field(..., ge=0, le=1)
    home_minus_2: float = Field(..., ge=0, le=1)
    tie_minus_2: float = Field(..., ge=0, le=1)
    away_plus_2: float = Field(..., ge=0, le=1)
    home_minus_3: float = Field(..., ge=0, le=1)
    tie_minus_3: float = Field(..., ge=0, le=1)
    away_plus_3: float = Field(..., ge=0, le=1)


class BttsResultComboPrediction(BaseModel):
    btts_yes_home: float = Field(..., ge=0, le=1)
    btts_yes_draw: float = Field(..., ge=0, le=1)
    btts_yes_away: float = Field(..., ge=0, le=1)
    btts_no_home: float = Field(..., ge=0, le=1)
    btts_no_draw: float = Field(..., ge=0, le=1)
    btts_no_away: float = Field(..., ge=0, le=1)


class BttsTotalGoalsComboPrediction(BaseModel):
    btts_yes_over_2_5: float = Field(..., ge=0, le=1)
    btts_yes_under_2_5: float = Field(..., ge=0, le=1)
    btts_yes_over_3_5: float = Field(..., ge=0, le=1)
    btts_yes_under_3_5: float = Field(..., ge=0, le=1)
    btts_yes_over_4_5: float = Field(..., ge=0, le=1)
    btts_yes_under_4_5: float = Field(..., ge=0, le=1)
    btts_yes_over_5_5: float = Field(..., ge=0, le=1)
    btts_yes_under_5_5: float = Field(..., ge=0, le=1)
    btts_no_over_2_5: float = Field(..., ge=0, le=1)
    btts_no_under_2_5: float = Field(..., ge=0, le=1)
    btts_no_over_3_5: float = Field(..., ge=0, le=1)
    btts_no_under_3_5: float = Field(..., ge=0, le=1)
    btts_no_over_4_5: float = Field(..., ge=0, le=1)
    btts_no_under_4_5: float = Field(..., ge=0, le=1)
    btts_no_over_5_5: float = Field(..., ge=0, le=1)
    btts_no_under_5_5: float = Field(..., ge=0, le=1)


class LeadAtAnytimePrediction(BaseModel):
    home_lead_anytime: float = Field(..., ge=0, le=1)
    away_lead_anytime: float = Field(..., ge=0, le=1)


class MarketsResult(BaseModel):
    one_x_two: Optional[MatchWinnerPrediction] = Field(None, alias="1x2")
    over_under: Optional[OverUnderPrediction] = None
    btts: Optional[BttsPrediction] = None
    corners: Optional[CornersPrediction] = None
    double_chance: Optional[DoubleChancePrediction] = None
    clean_sheet: Optional[CleanSheetPrediction] = None
    correct_score: Optional[dict[str, float]] = None
    halftime_fulltime: Optional[HalftimeFulltimePrediction] = None
    halftime_result: Optional[HalftimeResultPrediction] = None
    team_total_goals: Optional[TeamTotalGoalsPrediction] = None
    win_both_halves: Optional[WinBothHalvesPrediction] = None
    win_either_half: Optional[WinEitherHalfPrediction] = None
    win_from_behind: Optional[WinFromBehindPrediction] = None
    draw_no_bet: Optional[DrawNoBetPrediction] = None
    handicap: Optional[HandicapPrediction] = None
    btts_result: Optional[BttsResultComboPrediction] = None
    btts_total_goals: Optional[BttsTotalGoalsComboPrediction] = None
    lead_at_anytime: Optional[LeadAtAnytimePrediction] = None

    model_config = {
        "populate_by_name": True
    }


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


class BetMarket(str, Enum):
    MATCH_WINNER = "1x2"
    OVER_UNDER = "over_under"
    BTTS = "btts"
    CORNERS = "corners"
    DOUBLE_CHANCE = "double_chance"
    CLEAN_SHEET = "clean_sheet"
    CORRECT_SCORE = "correct_score"
    HALFTIME_FULLTIME = "halftime_fulltime"
    HALFTIME_RESULT = "halftime_result"
    TEAM_TOTAL_GOALS = "team_total_goals"
    WIN_BOTH_HALVES = "win_both_halves"
    WIN_EITHER_HALF = "win_either_half"
    WIN_FROM_BEHIND = "win_from_behind"
    DRAW_NO_BET = "draw_no_bet"
    HANDICAP = "handicap"
    BTTS_RESULT = "btts_result"
    BTTS_TOTAL_GOALS = "btts_total_goals"
    LEAD_AT_ANYTIME = "lead_at_anytime"



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
