"""
Prediction API router.

Routes:
  GET /predictions/tickets/today              — 4 risk-tiered tickets for today
  GET /predictions/tickets/{tier}             — tickets for a specific tier
  GET /predictions/today                      — predictions for all of today's fixtures
  GET /predictions/league/{league_id}         — predictions for a league's upcoming fixtures
  GET /predictions/{fixture_id}/markets       — full multi-market prediction for a fixture
  GET /predictions/{fixture_id}              — 1x2 prediction for a single fixture

NOTE: Specific and literal paths (/today, /tickets/today, /tickets/{tier},
      /league/{id}) are declared BEFORE the parameterised route
      /{fixture_id} to avoid FastAPI matching string segments as fixture IDs.
      /{fixture_id}/markets is safe because FastAPI requires fixture_id to be
      an int, so string segments like "tickets" never match it.
"""

from fastapi import APIRouter, HTTPException, Path, Query

from src.models.prediction import (
    ErrorResponse,
    FullPredictionResponse,
    PredictionListResponse,
    PredictionResponse,
    TicketResponse,
    TicketTier,
    MarketsResult,
)
from src.services.match_data_service import MatchServiceError
from src.services.prediction_service import (
    generate_tier_tickets,
    generate_today_tickets,
    predict_fixture,
    predict_fixture_with_markets,
    predict_fixtures_by_date,
    predict_league_fixtures,
)

from datetime import datetime

router = APIRouter(prefix="/predictions", tags=["Predictions"])


# ── GET /predictions/tickets/today ────────────────────────────────────────────

@router.get(
    "/tickets/today",
    response_model=TicketResponse,
    summary="Today's betting tickets (all 4 tiers)",
    description=(
        "Generates 4 risk-tiered betting accumulators from today's match predictions. "
        "Tiers: ultra_safe (≥82% each leg), safe (≥68%), moderate (≥55%), risky (≥40%). "
        "Cached for 30 minutes. Falls back to realistic mock data if match-service is unavailable."
    ),
)
async def get_today_tickets():
    try:
        tickets = await generate_today_tickets()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ticket generation failed: {exc}")

    return TicketResponse(count=len(tickets), data=tickets)


# ── GET /predictions/tickets/{tier} ──────────────────────────────────────────

@router.get(
    "/tickets/{tier}",
    response_model=TicketResponse,
    summary="Today's betting ticket for a specific tier",
    description=(
        "Returns the ticket for a single tier. "
        "Valid tier values: ultra_safe, safe, moderate, risky."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "No ticket found for this tier"},
    },
)
async def get_tier_tickets(
    tier: TicketTier = Path(..., description="Ticket tier (ultra_safe, safe, moderate, risky)"),
):
    try:
        tickets = await generate_tier_tickets(tier)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ticket generation failed: {exc}")

    if not tickets:
        raise HTTPException(status_code=404, detail=f"No ticket found for tier '{tier.value}'")

    return TicketResponse(count=len(tickets), data=tickets)


# ── GET /predictions/today ────────────────────────────────────────────────────

@router.get(
    "/today",
    response_model=PredictionListResponse,
    summary="Predictions for today's matches",
    description="Returns AI predictions for all fixtures scheduled for today (UTC).",
)
async def get_today_predictions():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    try:
        predictions = await predict_fixtures_by_date(today)
    except MatchServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"match-service unavailable: {exc}",
        )

    return PredictionListResponse(count=len(predictions), data=predictions)


# ── GET /predictions/league/{league_id} ──────────────────────────────────────

@router.get(
    "/league/{league_id}",
    response_model=PredictionListResponse,
    summary="Predictions for a league's upcoming fixtures",
    description="Returns predictions for all of today's fixtures in the given league.",
)
async def get_league_predictions(
    league_id: int = Path(..., gt=0, description="API-Football league ID"),
):
    try:
        predictions = await predict_league_fixtures(league_id)
    except MatchServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"match-service unavailable: {exc}",
        )

    if not predictions:
        return PredictionListResponse(count=0, data=[])

    return PredictionListResponse(count=len(predictions), data=predictions)


# ── GET /predictions/{fixture_id}/markets ────────────────────────────────────

@router.get(
    "/{fixture_id}/markets",
    response_model=FullPredictionResponse,
    summary="Full multi-market prediction for a single fixture",
    description=(
        "Returns 1x2 probabilities plus all secondary market predictions: "
        "Over/Under (1.5, 2.5, 3.5), BTTS, Corners (8.5, 9.5, 10.5), "
        "Double Chance, and Clean Sheet. Cached for 30 minutes."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Fixture not found"},
        503: {"model": ErrorResponse, "description": "match-service unavailable"},
    },
)
async def get_fixture_markets(
    fixture_id: int = Path(..., gt=0, description="API-Football fixture ID"),
    category: str = Query("all", description="Market category to filter (all, sgp, totals, corners, halftime, spreads)"),
):
    category_lower = category.lower()
    valid_categories = {"all", "sgp", "totals", "corners", "halftime", "spreads"}
    if category_lower not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category query parameter. Valid choices are: {', '.join(valid_categories)}",
        )

    try:
        result = await predict_fixture_with_markets(fixture_id)
    except MatchServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"match-service unavailable: {exc}",
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    if category_lower != "all":
        allowed_fields = set()
        if category_lower == "sgp":
            allowed_fields = {"btts_result", "btts_total_goals"}
        elif category_lower == "totals":
            allowed_fields = {"over_under", "team_total_goals", "btts_total_goals"}
        elif category_lower == "corners":
            allowed_fields = {"corners"}
        elif category_lower == "halftime":
            allowed_fields = {
                "halftime_fulltime",
                "halftime_result",
                "win_both_halves",
                "win_either_half",
            }
        elif category_lower == "spreads":
            allowed_fields = {"handicap", "draw_no_bet"}

        filtered_dict = {}
        for field in result.markets.model_fields.keys():
            if field in allowed_fields:
                filtered_dict[field] = getattr(result.markets, field)

        result.markets = MarketsResult(**filtered_dict)

    return FullPredictionResponse(data=result)


# ── GET /predictions/{fixture_id} ─────────────────────────────────────────────

@router.get(
    "/{fixture_id}",
    response_model=PredictionResponse,
    summary="Prediction for a single fixture",
    description=(
        "Returns an AI-powered win/draw/loss probability breakdown for the given fixture. "
        "Results are cached for 30 minutes. The `cached` flag indicates a Redis hit."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Fixture not found"},
        503: {"model": ErrorResponse, "description": "match-service unavailable"},
    },
)
async def get_fixture_prediction(
    fixture_id: int = Path(..., gt=0, description="API-Football fixture ID"),
):
    try:
        result = await predict_fixture(fixture_id)
    except MatchServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"match-service unavailable: {exc}",
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    return PredictionResponse(data=result)
