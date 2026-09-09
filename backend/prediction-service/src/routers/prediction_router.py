"""
Prediction API router.

Routes:
  GET /predictions/tickets/today              — 4 risk-tiered tickets for today
  GET /predictions/tickets/{tier}             — tickets for a specific tier
  GET /predictions/today                      — predictions for all of today's fixtures
  GET /predictions/league/{league_id}         — predictions for a league's upcoming fixtures
  GET /predictions/{fixture_id}/markets       — full multi-market prediction for a fixture
  GET /predictions/smart-picks/today          — auto-selected best matches of the day (Avis 4)
  GET /predictions/smart-picks/date/{date}    — auto-selected best matches for a date (Avis 4)
  GET /predictions/{fixture_id}/deep-analysis — combined deep match analysis (Avis 2)
  GET /predictions/{fixture_id}/top-vs-bottom — top-3 vs relegation-zone analysis (Avis 3)
  GET /predictions/{fixture_id}/odds-anomaly  — bookmaker odds anomaly detector (Avis 2)
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
from src.models.deep_analysis import (
    DeepAnalysisResponse,
    OddsAnomalyResponse,
    SmartPicksListResponse,
    TopVsBottomResponse,
)
from src.services.match_data_service import MatchServiceError
from src.services.deep_analysis_service import DISCLAIMER, deep_analysis_service
from src.services.smart_match_filter import SmartMatchFilter
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


# ═══════════════════════════════════════════════════════════════════════════════
# Deep analysis / smart picks (Avis 2, 3, 4)
#
# NOTE: all of these are declared BEFORE the catch-all /{fixture_id} route.
#       /smart-picks/... is safe (not an int); /{fixture_id}/<suffix> routes are
#       more specific than /{fixture_id} so FastAPI matches them first.
# ═══════════════════════════════════════════════════════════════════════════════


def _clamp_odds_range(min_odds: float, max_odds: float) -> tuple[float, float]:
    """Sanitise the smart-pick odds window; fall back to the class defaults."""
    lo = min_odds if min_odds and min_odds > 1.0 else SmartMatchFilter.TARGET_MIN_ODDS
    hi = max_odds if max_odds and max_odds > lo else SmartMatchFilter.TARGET_MAX_ODDS
    return lo, hi


async def _smart_picks_for_date(date: str, min_odds: float, max_odds: float, limit: int):
    lo, hi = _clamp_odds_range(min_odds, max_odds)

    flt = SmartMatchFilter()
    flt.TARGET_MIN_ODDS = lo
    flt.TARGET_MAX_ODDS = hi

    try:
        candidates = await deep_analysis_service.collect_candidate_matches(date)
    except MatchServiceError as exc:
        raise HTTPException(status_code=503, detail=f"match-service unavailable: {exc}")

    interesting = flt.filter_interesting_matches(candidates)[: max(1, limit)]

    return SmartPicksListResponse(
        count=len(interesting),
        date=date,
        filters={"min_odds": lo, "max_odds": hi, "limit": limit},
        data=interesting,
        disclaimer=DISCLAIMER,
    )


# ── GET /predictions/smart-picks/today ──────────────────────────────────────

@router.get(
    "/smart-picks/today",
    response_model=SmartPicksListResponse,
    summary="Smart auto-selected picks for today (Avis 4)",
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
):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return await _smart_picks_for_date(today, min_odds, max_odds, limit)


# ── GET /predictions/smart-picks/date/{date} ────────────────────────────────

@router.get(
    "/smart-picks/date/{date}",
    response_model=SmartPicksListResponse,
    summary="Smart auto-selected picks for a specific date (Avis 4)",
    description="Same as /smart-picks/today but for the given YYYY-MM-DD date.",
)
async def get_smart_picks_by_date(
    date: str = Path(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date as YYYY-MM-DD"),
    min_odds: float = Query(1.20, gt=1.0),
    max_odds: float = Query(1.60, gt=1.0),
    limit: int = Query(10, ge=1, le=50),
):
    return await _smart_picks_for_date(date, min_odds, max_odds, limit)


# ── GET /predictions/{fixture_id}/deep-analysis ─────────────────────────────

@router.get(
    "/{fixture_id}/deep-analysis",
    response_model=DeepAnalysisResponse,
    summary="Full deep match analysis (Avis 2)",
    description=(
        "Combines odds analysis, home/away recent form, head-to-head, standings "
        "comparison, top-vs-bottom detection and the smart market recommendation "
        "into a single payload. Mock fixture IDs 900001-900004 exercise every "
        "scenario without a live match-service."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Fixture not found"},
        503: {"model": ErrorResponse, "description": "match-service unavailable"},
    },
)
async def get_deep_analysis(
    fixture_id: int = Path(..., gt=0, description="Fixture ID (or 900001-900004 for mock data)"),
):
    try:
        match_data = await deep_analysis_service.build_match_data(fixture_id)
    except MatchServiceError as exc:
        raise HTTPException(status_code=503, detail=f"match-service unavailable: {exc}")
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    analysis = deep_analysis_service.analyze_match(match_data)
    return DeepAnalysisResponse(fixture_id=fixture_id, data=analysis, disclaimer=DISCLAIMER)


# ── GET /predictions/{fixture_id}/top-vs-bottom ─────────────────────────────

@router.get(
    "/{fixture_id}/top-vs-bottom",
    response_model=TopVsBottomResponse,
    summary="Top-3 vs relegation-zone analysis (Avis 3)",
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
    fixture_id: int = Path(..., gt=0, description="Fixture ID (or 900001-900004 for mock data)"),
):
    try:
        match_data = await deep_analysis_service.build_match_data(fixture_id)
    except MatchServiceError as exc:
        raise HTTPException(status_code=503, detail=f"match-service unavailable: {exc}")
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    result = deep_analysis_service.top_vs_bottom.analyze(match_data)
    if not result.get("is_top_vs_bottom"):
        raise HTTPException(
            status_code=404,
            detail="This match is not a top-vs-bottom scenario.",
        )

    return TopVsBottomResponse(fixture_id=fixture_id, data=result, disclaimer=DISCLAIMER)


# ── GET /predictions/{fixture_id}/odds-anomaly ─────────────────────────────

@router.get(
    "/{fixture_id}/odds-anomaly",
    response_model=OddsAnomalyResponse,
    summary="Bookmaker odds anomaly detector (Avis 2)",
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
    fixture_id: int = Path(..., gt=0, description="Fixture ID (or 900001-900004 for mock data)"),
):
    try:
        match_data = await deep_analysis_service.build_match_data(fixture_id)
    except MatchServiceError as exc:
        raise HTTPException(status_code=503, detail=f"match-service unavailable: {exc}")
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    result = deep_analysis_service.odds_analyzer.analyze(match_data)
    return OddsAnomalyResponse(fixture_id=fixture_id, data=result, disclaimer=DISCLAIMER)


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
