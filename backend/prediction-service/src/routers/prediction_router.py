"""
Prediction API router.

Routes:
  GET /predictions/tickets/today              — risk-tiered tickets for today
  GET /predictions/tickets/{tier}             — tickets for a specific tier
  GET /predictions/today                      — predictions for all of today's fixtures
  GET /predictions/league/{league_id}         — predictions for a league's upcoming fixtures
  GET /predictions/smart-picks/today          — auto-selected best matches of the day
  GET /predictions/smart-picks/date/{date}    — auto-selected best matches for a date
  GET /predictions/{fixture_id}/markets       — full multi-market prediction for a fixture
  GET /predictions/{fixture_id}/deep-analysis — combined deep match analysis
  GET /predictions/{fixture_id}/top-vs-bottom — top-3 vs relegation-zone analysis
  GET /predictions/{fixture_id}/odds-anomaly  — bookmaker odds anomaly detector
  GET /predictions/{fixture_id}              — 1x2 prediction for a single fixture

Every route resolves a Viewer and shapes its response to that viewer's plan —
see services/entitlements.py. Anonymous callers are served the free response.

NOTE: Specific and literal paths (/today, /tickets/today, /tickets/{tier},
      /league/{id}, /smart-picks/...) are declared BEFORE the parameterised
      route /{fixture_id} to avoid FastAPI matching string segments as
      fixture IDs. /{fixture_id}/<suffix> routes are safe regardless of
      declaration order because they carry an extra path segment /{fixture_id}
      alone never matches, and fixture_id requires int, so string segments
      like "tickets" or "smart-picks" never match it either way.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from src.middleware.auth import Viewer, get_viewer
from src.models.deep_analysis import (
    DeepAnalysisResponse,
    OddsAnomalyResponse,
    SmartPicksListResponse,
    TopVsBottomResponse,
)
from src.models.prediction import (
    ErrorResponse,
    FullPredictionResponse,
    MarketsResult,
    PredictionListResponse,
    PredictionResponse,
    TicketResponse,
    TicketTier,
)
from src.services.deep_analysis_service import DISCLAIMER, deep_analysis_service
from src.services.entitlements import (
    limit_deep_analysis,
    limit_markets,
    limit_prediction,
    limit_tickets,
)
from src.services.match_data_service import MatchServiceError
from src.services.prediction_service import (
    generate_today_tickets,
    predict_fixture,
    predict_fixture_with_markets,
    predict_fixtures_by_date,
    predict_league_fixtures,
)
from src.services.smart_match_filter import SmartMatchFilter

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


# ── Smart picks ────────────────────────────────────────────────────────────────

def _clamp_odds_range(min_odds: float, max_odds: float) -> tuple[float, float]:
    """Sanitise the smart-pick odds window; fall back to the class defaults."""
    lo = min_odds if min_odds and min_odds > 1.0 else SmartMatchFilter.TARGET_MIN_ODDS
    hi = max_odds if max_odds and max_odds > lo else SmartMatchFilter.TARGET_MAX_ODDS
    return lo, hi


async def _smart_picks_for_date(date: str, min_odds: float, max_odds: float, limit: int, viewer: Viewer):
    lo, hi = _clamp_odds_range(min_odds, max_odds)

    flt = SmartMatchFilter()
    flt.TARGET_MIN_ODDS = lo
    flt.TARGET_MAX_ODDS = hi

    try:
        candidates = await deep_analysis_service.collect_candidate_matches(date)
    except MatchServiceError:
        logger.warning("match-service unavailable for smart-picks on %s", date)
        raise HTTPException(status_code=503, detail="Match data is temporarily unavailable. Please try again shortly.")

    interesting = flt.filter_interesting_matches(candidates)[: max(1, limit)]

    return SmartPicksListResponse(
        count=len(interesting),
        date=date,
        filters={"min_odds": lo, "max_odds": hi, "limit": limit},
        data=interesting,
        disclaimer=DISCLAIMER,
        plan=viewer.plan,
        limited=False,  # smart-picks is not gated by plan today; see below
    )


@router.get(
    "/smart-picks/today",
    response_model=SmartPicksListResponse,
    summary="Smart auto-selected picks for today",
    description=(
        "Runs the expert decision tree over today's matches and returns the most "
        "interesting ones, ranked by confidence score, each with a recommended "
        "market and a side-by-side view of 7 candidate markets. Additive — does "
        "not replace the ticket generator."
    ),
)
async def get_smart_picks_today(
    min_odds: float = Query(1.20, gt=1.0, description="Lower bound of the target odds window"),
    max_odds: float = Query(1.60, gt=1.0, description="Upper bound of the target odds window"),
    limit: int = Query(10, ge=1, le=50, description="Max picks to return"),
    viewer: Viewer = Depends(get_viewer),
):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return await _smart_picks_for_date(today, min_odds, max_odds, limit, viewer)


@router.get(
    "/smart-picks/date/{date}",
    response_model=SmartPicksListResponse,
    summary="Smart auto-selected picks for a specific date",
    description="Same as /smart-picks/today but for the given YYYY-MM-DD date.",
)
async def get_smart_picks_by_date(
    date: str = Path(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date as YYYY-MM-DD"),
    min_odds: float = Query(1.20, gt=1.0),
    max_odds: float = Query(1.60, gt=1.0),
    limit: int = Query(10, ge=1, le=50),
    viewer: Viewer = Depends(get_viewer),
):
    return await _smart_picks_for_date(date, min_odds, max_odds, limit, viewer)


# ── GET /predictions/{fixture_id}/deep-analysis ─────────────────────────────

@router.get(
    "/{fixture_id}/deep-analysis",
    response_model=DeepAnalysisResponse,
    summary="Full deep match analysis",
    description=(
        "Combines odds analysis, head-to-head, standings comparison, "
        "top-vs-bottom detection and the smart market recommendation into a "
        "single payload. Free callers receive the top-level recommendation "
        "only (market, odds, confidence) — reasoning, the market table and "
        "the supporting sections are VIP."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Fixture not found"},
        503: {"model": ErrorResponse, "description": "match-service unavailable"},
    },
)
async def get_deep_analysis(
    fixture_id: int = Path(..., gt=0, description="API-Football fixture ID"),
    viewer: Viewer = Depends(get_viewer),
):
    try:
        match_data = await deep_analysis_service.build_match_data(fixture_id)
    except MatchServiceError:
        logger.warning("match-service unavailable for fixture %s", fixture_id)
        raise HTTPException(status_code=503, detail="Match data is temporarily unavailable. Please try again shortly.")
    except ValueError:
        raise HTTPException(status_code=404, detail="Fixture not found")

    analysis = deep_analysis_service.analyze_match(match_data)
    shaped, limited = limit_deep_analysis(analysis, viewer.plan)

    return DeepAnalysisResponse(
        fixture_id=fixture_id, data=shaped, disclaimer=DISCLAIMER,
        plan=viewer.plan, limited=limited,
    )


# ── GET /predictions/{fixture_id}/top-vs-bottom ─────────────────────────────

@router.get(
    "/{fixture_id}/top-vs-bottom",
    response_model=TopVsBottomResponse,
    summary="Top-3 vs relegation-zone analysis",
    description=(
        "Returns priority-ordered smart market recommendations when the fixture "
        "pits a top-3 side against a relegation-zone side. 404 if it is not a "
        "top-vs-bottom scenario."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Not a top-vs-bottom fixture"},
        503: {"model": ErrorResponse, "description": "match-service unavailable"},
    },
)
async def get_top_vs_bottom(
    fixture_id: int = Path(..., gt=0, description="API-Football fixture ID"),
    viewer: Viewer = Depends(get_viewer),
):
    try:
        match_data = await deep_analysis_service.build_match_data(fixture_id)
    except MatchServiceError:
        logger.warning("match-service unavailable for fixture %s", fixture_id)
        raise HTTPException(status_code=503, detail="Match data is temporarily unavailable. Please try again shortly.")
    except ValueError:
        raise HTTPException(status_code=404, detail="Fixture not found")

    result = deep_analysis_service.top_vs_bottom.analyze(match_data)
    if not result.get("is_top_vs_bottom"):
        raise HTTPException(status_code=404, detail="This match is not a top-vs-bottom scenario.")

    return TopVsBottomResponse(
        fixture_id=fixture_id, data=result, disclaimer=DISCLAIMER,
        plan=viewer.plan, limited=False,
    )


# ── GET /predictions/{fixture_id}/odds-anomaly ─────────────────────────────

@router.get(
    "/{fixture_id}/odds-anomaly",
    response_model=OddsAnomalyResponse,
    summary="Bookmaker odds anomaly detector",
    description=(
        "Converts 1x2 odds to margin-free implied probabilities, identifies the "
        "favourite and flags anomalies (favourite priced too high, no clear "
        "favourite, draw unusually likely)."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Fixture not found"},
        503: {"model": ErrorResponse, "description": "match-service unavailable"},
    },
)
async def get_odds_anomaly(
    fixture_id: int = Path(..., gt=0, description="API-Football fixture ID"),
    viewer: Viewer = Depends(get_viewer),
):
    try:
        match_data = await deep_analysis_service.build_match_data(fixture_id)
    except MatchServiceError:
        logger.warning("match-service unavailable for fixture %s", fixture_id)
        raise HTTPException(status_code=503, detail="Match data is temporarily unavailable. Please try again shortly.")
    except ValueError:
        raise HTTPException(status_code=404, detail="Fixture not found")

    result = deep_analysis_service.odds_analyzer.analyze(match_data)
    return OddsAnomalyResponse(
        fixture_id=fixture_id, data=result, disclaimer=DISCLAIMER,
        plan=viewer.plan, limited=False,
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
