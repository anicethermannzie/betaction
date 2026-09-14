"""
Prediction API router.

Routes:
  GET /predictions/tickets/today              — risk-tiered tickets for today
  GET /predictions/tickets/{tier}             — tickets for a specific tier
  GET /predictions/today                      — predictions for all of today's fixtures
  GET /predictions/league/{league_id}         — predictions for a league's upcoming fixtures
  GET /predictions/{fixture_id}/markets       — full multi-market prediction for a fixture
  GET /predictions/{fixture_id}              — 1x2 prediction for a single fixture

Every route resolves a Viewer and shapes its response to that viewer's plan —
see services/entitlements.py. Anonymous callers are served the free response.

NOTE: Specific and literal paths (/today, /tickets/today, /tickets/{tier},
      /league/{id}) are declared BEFORE the parameterised route
      /{fixture_id} to avoid FastAPI matching string segments as fixture IDs.
      /{fixture_id}/markets is safe because FastAPI requires fixture_id to be
      an int, so string segments like "tickets" never match it.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from src.middleware.auth import Viewer, get_viewer
from src.models.prediction import (
    ErrorResponse,
    FullPredictionResponse,
    MarketsResult,
    PredictionListResponse,
    PredictionResponse,
    TicketResponse,
    TicketTier,
)
from src.services.entitlements import limit_markets, limit_prediction, limit_tickets
from src.services.match_data_service import MatchServiceError
from src.services.prediction_service import (
    generate_today_tickets,
    predict_fixture,
    predict_fixture_with_markets,
    predict_fixtures_by_date,
    predict_league_fixtures,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["Predictions"])


# ── GET /predictions/tickets/today ────────────────────────────────────────────

@router.get(
    "/tickets/today",
    response_model=TicketResponse,
    summary="Today's betting tickets",
    description=(
        "Generates risk-tiered betting accumulators from today's match predictions. "
        "Tiers: ultra_safe (≥82% each leg), safe (≥68%), moderate (≥55%), risky (≥40%). "
        "Cached for 30 minutes. A tier with too few qualifying legs is omitted rather "
        "than padded. Free callers receive 1 ticket capped at 3 legs."
    ),
)
async def get_today_tickets(viewer: Viewer = Depends(get_viewer)):
    try:
        tickets = await generate_today_tickets()
    except Exception:
        logger.exception("Ticket generation failed")
        raise HTTPException(status_code=500, detail="Ticket generation failed")

    limited = limit_tickets(tickets, viewer.plan)
    return TicketResponse(
        count=len(limited),
        data=limited,
        plan=viewer.plan,
        limited=len(limited) < len(tickets),
    )


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
        403: {"model": ErrorResponse, "description": "Tier not included in this plan"},
        404: {"model": ErrorResponse, "description": "No ticket found for this tier"},
    },
)
async def get_tier_tickets(
    tier: TicketTier = Path(..., description="Ticket tier (ultra_safe, safe, moderate, risky)"),
    viewer: Viewer = Depends(get_viewer),
):
    # The day's full set is resolved once (Redis-cached) and filtered here, rather
    # than generated per tier: asking for one tier must not be a way around the
    # "which ticket does a free plan get" decision, and that decision can only be
    # made against the whole set.
    try:
        tickets = await generate_today_tickets()
    except Exception:
        logger.exception("Ticket generation failed for tier %s", tier.value)
        raise HTTPException(status_code=500, detail="Ticket generation failed")

    entitled = [t for t in limit_tickets(tickets, viewer.plan) if t.tier == tier.value]

    if not entitled:
        if any(t.tier == tier.value for t in tickets):
            raise HTTPException(
                status_code=403,
                detail="This ticket tier is included in VIP. Upgrade to unlock every tier.",
            )
        raise HTTPException(status_code=404, detail=f"No ticket found for tier '{tier.value}'")

    return TicketResponse(
        count=len(entitled), data=entitled, plan=viewer.plan,
        limited=viewer.plan != "vip",
    )


# ── GET /predictions/today ────────────────────────────────────────────────────

@router.get(
    "/today",
    response_model=PredictionListResponse,
    summary="Predictions for today's matches",
    description="Returns AI predictions for all fixtures scheduled for today (UTC).",
)
async def get_today_predictions(viewer: Viewer = Depends(get_viewer)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    try:
        predictions = await predict_fixtures_by_date(today)
    except MatchServiceError:
        logger.warning("match-service unavailable for /today")
        raise HTTPException(
            status_code=503,
            detail="Match data is temporarily unavailable. Please try again shortly.",
        )

    shaped = [limit_prediction(p, viewer.plan) for p in predictions]
    return PredictionListResponse(
        count=len(shaped), data=shaped, plan=viewer.plan, limited=viewer.plan != "vip",
    )


# ── GET /predictions/league/{league_id} ──────────────────────────────────────

@router.get(
    "/league/{league_id}",
    response_model=PredictionListResponse,
    summary="Predictions for a league's upcoming fixtures",
    description="Returns predictions for all of today's fixtures in the given league.",
)
async def get_league_predictions(
    league_id: int = Path(..., gt=0, description="API-Football league ID"),
    viewer: Viewer = Depends(get_viewer),
):
    try:
        predictions = await predict_league_fixtures(league_id)
    except MatchServiceError:
        logger.warning("match-service unavailable for league %s", league_id)
        raise HTTPException(
            status_code=503,
            detail="Match data is temporarily unavailable. Please try again shortly.",
        )

    shaped = [limit_prediction(p, viewer.plan) for p in predictions]
    return PredictionListResponse(
        count=len(shaped), data=shaped, plan=viewer.plan, limited=viewer.plan != "vip",
    )


# ── GET /predictions/{fixture_id}/markets ────────────────────────────────────

@router.get(
    "/{fixture_id}/markets",
    response_model=FullPredictionResponse,
    summary="Full multi-market prediction for a single fixture",
    description=(
        "Returns 1x2 probabilities plus secondary market predictions. VIP receives "
        "all 18 markets; free callers receive 6. Cached for 30 minutes."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Fixture not found"},
        503: {"model": ErrorResponse, "description": "match-service unavailable"},
    },
)
async def get_fixture_markets(
    fixture_id: int = Path(..., gt=0, description="API-Football fixture ID"),
    category: str = Query("all", description="Market category to filter (all, sgp, totals, corners, halftime, spreads)"),
    viewer: Viewer = Depends(get_viewer),
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
    except MatchServiceError:
        logger.warning("match-service unavailable for fixture %s", fixture_id)
        raise HTTPException(
            status_code=503,
            detail="Match data is temporarily unavailable. Please try again shortly.",
        )
    except ValueError:
        raise HTTPException(status_code=404, detail="Fixture not found")
    except Exception:
        logger.exception("Prediction failed for fixture %s", fixture_id)
        raise HTTPException(status_code=500, detail="Prediction failed")

    # Entitlement is applied before the category filter so a free caller cannot
    # reach a VIP market by asking for its category directly.
    full_market_count = sum(
        1 for field in result.markets.model_fields if getattr(result.markets, field) is not None
    )
    result = limit_markets(result, viewer.plan)

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

    served_market_count = sum(
        1 for field in result.markets.model_fields if getattr(result.markets, field) is not None
    )

    return FullPredictionResponse(
        data=result,
        plan=viewer.plan,
        limited=served_market_count < full_market_count and category_lower == "all",
    )


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
    viewer: Viewer = Depends(get_viewer),
):
    try:
        result = await predict_fixture(fixture_id)
    except MatchServiceError:
        logger.warning("match-service unavailable for fixture %s", fixture_id)
        raise HTTPException(
            status_code=503,
            detail="Match data is temporarily unavailable. Please try again shortly.",
        )
    except ValueError:
        raise HTTPException(status_code=404, detail="Fixture not found")
    except Exception:
        logger.exception("Prediction failed for fixture %s", fixture_id)
        raise HTTPException(status_code=500, detail="Prediction failed")

    return PredictionResponse(
        data=limit_prediction(result, viewer.plan),
        plan=viewer.plan,
        limited=viewer.plan != "vip",
    )
