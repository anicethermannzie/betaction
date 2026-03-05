"""
Prediction service — orchestrates the full prediction pipeline:

  1. Check Redis for a cached result.
  2. Fetch fixture details from match-service.
  3. Concurrently fetch team stats, h2h history, and odds.
  4. Run the prediction algorithm (predictor.predict).
  5. Store the result in Redis (TTL = prediction_cache_ttl seconds).
  6. Return the PredictionResult.

If match-service is unavailable and a cached result exists, we return
the cached result with cached=True rather than propagating the error.
"""

import asyncio
import json
from datetime import datetime

from src.algorithm.predictor import predict, predict_with_markets
from src.config.redis_client import get_redis
from src.config.settings import settings
from src.models.prediction import FullPredictionResult, PredictionResult, Ticket, TicketTier
from src.services.match_data_service import MatchDataService, MatchServiceError, match_data_service
from src.services.ticket_generator import ticket_generator


# ── Cache helpers ─────────────────────────────────────────────────────────────

def _cache_key(fixture_id: int) -> str:
    return f"prediction:{fixture_id}"


def _markets_cache_key(fixture_id: int) -> str:
    return f"markets:{fixture_id}"


def _tickets_cache_key(date: str) -> str:
    return f"tickets:{date}"


async def _read_cache(fixture_id: int) -> PredictionResult | None:
    try:
        raw = await get_redis().get(_cache_key(fixture_id))
        if raw:
            result = PredictionResult.model_validate_json(raw)
            result.cached = True
            return result
    except Exception:
        pass
    return None


async def _write_cache(result: PredictionResult) -> None:
    try:
        await get_redis().setex(
            _cache_key(result.fixture_id),
            settings.prediction_cache_ttl,
            result.model_dump_json(),
        )
    except Exception as exc:
        print(f"[prediction_service] Redis write failed: {exc}")


async def _read_markets_cache(fixture_id: int) -> FullPredictionResult | None:
    try:
        raw = await get_redis().get(_markets_cache_key(fixture_id))
        if raw:
            result = FullPredictionResult.model_validate_json(raw)
            result.cached = True
            return result
    except Exception:
        pass
    return None


async def _write_markets_cache(result: FullPredictionResult) -> None:
    try:
        await get_redis().setex(
            _markets_cache_key(result.fixture_id),
            settings.prediction_cache_ttl,
            result.model_dump_json(),
        )
    except Exception as exc:
        print(f"[prediction_service] Redis markets write failed: {exc}")


async def _read_tickets_cache(date: str) -> list[Ticket] | None:
    try:
        raw = await get_redis().get(_tickets_cache_key(date))
        if raw:
            data = json.loads(raw)
            return [Ticket.model_validate(t) for t in data]
    except Exception:
        pass
    return None


async def _write_tickets_cache(date: str, tickets: list[Ticket]) -> None:
    try:
        payload = json.dumps([t.model_dump(mode="json") for t in tickets])
        await get_redis().setex(
            _tickets_cache_key(date),
            settings.prediction_cache_ttl,
            payload,
        )
    except Exception as exc:
        print(f"[prediction_service] Redis tickets write failed: {exc}")


# ── Shared fixture data extraction ────────────────────────────────────────────

def _extract_fixture_meta(fx: dict) -> dict:
    """Extract common fields from a raw API-Football fixture dict."""
    kickoff_str = fx.get("fixture", {}).get("date")
    kickoff = None
    if kickoff_str:
        try:
            kickoff = datetime.fromisoformat(kickoff_str.replace("Z", "+00:00"))
        except ValueError:
            pass

    return {
        "home_team_id": fx["teams"]["home"]["id"],
        "away_team_id": fx["teams"]["away"]["id"],
        "home_team_name": fx["teams"]["home"]["name"],
        "away_team_name": fx["teams"]["away"]["name"],
        "league_id": fx["league"]["id"],
        "league_name": fx["league"].get("name", ""),
        "season": fx["league"]["season"],
        "kickoff": kickoff,
    }


async def _fetch_supporting_data(
    meta: dict,
    fixture_id: int,
    svc: MatchDataService,
) -> tuple[dict, dict, list[dict], list[dict]]:
    """Fetch team stats, h2h, and odds concurrently. Degrades gracefully."""
    home_stats_env, away_stats_env, h2h_env, odds_env = await asyncio.gather(
        svc.get_team_stats(meta["home_team_id"], meta["league_id"], meta["season"]),
        svc.get_team_stats(meta["away_team_id"], meta["league_id"], meta["season"]),
        svc.get_h2h(meta["home_team_id"], meta["away_team_id"]),
        svc.get_match_odds(fixture_id),
        return_exceptions=True,
    )

    def _safe(env, fallback):
        if isinstance(env, Exception):
            print(f"[prediction_service] Data fetch failed: {env}")
            return fallback
        return env.get("response", fallback)

    return (
        _safe(home_stats_env, {}),
        _safe(away_stats_env, {}),
        _safe(h2h_env, []),
        _safe(odds_env, []),
    )


# ── Core prediction pipeline ──────────────────────────────────────────────────

async def _build_prediction(
    fixture_id: int,
    svc: MatchDataService = match_data_service,
) -> PredictionResult:
    """
    Fetch all required data and run the algorithm.
    Raises MatchServiceError if match-service calls fail.
    """
    fixture_envelope = await svc.get_fixture(fixture_id)
    fixtures_list: list[dict] = fixture_envelope.get("response", [])

    if not fixtures_list:
        raise ValueError(f"Fixture {fixture_id} not found in match-service response")

    meta = _extract_fixture_meta(fixtures_list[0])
    home_stats, away_stats, h2h_fixtures, odds_response = await _fetch_supporting_data(
        meta, fixture_id, svc
    )

    return predict(
        fixture_id=fixture_id,
        home_team_id=meta["home_team_id"],
        away_team_id=meta["away_team_id"],
        home_team_name=meta["home_team_name"],
        away_team_name=meta["away_team_name"],
        league_id=meta["league_id"],
        season=meta["season"],
        home_team_stats=home_stats,
        away_team_stats=away_stats,
        h2h_fixtures=h2h_fixtures,
        odds_response=odds_response,
    )


async def _build_full_prediction(
    fixture_id: int,
    svc: MatchDataService = match_data_service,
) -> FullPredictionResult:
    """
    Fetch all required data and run the full multi-market algorithm.
    Raises MatchServiceError if match-service calls fail.
    """
    fixture_envelope = await svc.get_fixture(fixture_id)
    fixtures_list: list[dict] = fixture_envelope.get("response", [])

    if not fixtures_list:
        raise ValueError(f"Fixture {fixture_id} not found in match-service response")

    meta = _extract_fixture_meta(fixtures_list[0])
    home_stats, away_stats, h2h_fixtures, odds_response = await _fetch_supporting_data(
        meta, fixture_id, svc
    )

    return predict_with_markets(
        fixture_id=fixture_id,
        home_team_id=meta["home_team_id"],
        away_team_id=meta["away_team_id"],
        home_team_name=meta["home_team_name"],
        away_team_name=meta["away_team_name"],
        league_id=meta["league_id"],
        league_name=meta["league_name"],
        season=meta["season"],
        home_team_stats=home_stats,
        away_team_stats=away_stats,
        h2h_fixtures=h2h_fixtures,
        odds_response=odds_response,
        kickoff=meta["kickoff"],
    )


# ── Public service functions ──────────────────────────────────────────────────

async def predict_fixture(fixture_id: int) -> PredictionResult:
    """
    Return a prediction for a single fixture.

    Checks Redis first. If match-service is down and a cached result
    exists, returns the cached result. Otherwise re-raises the error.
    """
    cached = await _read_cache(fixture_id)
    if cached:
        return cached

    try:
        result = await _build_prediction(fixture_id)
        await _write_cache(result)
        return result
    except MatchServiceError:
        stale = await _read_cache(fixture_id)
        if stale:
            return stale
        raise


async def predict_fixture_with_markets(fixture_id: int) -> FullPredictionResult:
    """
    Return a full multi-market prediction for a single fixture.

    Uses a separate cache key (markets:{fixture_id}) from the 1x2 cache.
    """
    cached = await _read_markets_cache(fixture_id)
    if cached:
        return cached

    try:
        result = await _build_full_prediction(fixture_id)
        await _write_markets_cache(result)
        return result
    except MatchServiceError:
        stale = await _read_markets_cache(fixture_id)
        if stale:
            return stale
        raise


async def predict_fixtures_by_date(date: str) -> list[PredictionResult]:
    """
    Return predictions for all fixtures on a given date (YYYY-MM-DD).
    Fixtures that fail individually are skipped (logged, not raised).
    """
    try:
        envelope = await match_data_service.get_fixtures_by_date(date)
    except MatchServiceError:
        raise

    fixtures: list[dict] = envelope.get("response", [])

    tasks = [predict_fixture(fx["fixture"]["id"]) for fx in fixtures]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    predictions: list[PredictionResult] = []
    for fixture, result in zip(fixtures, results):
        if isinstance(result, Exception):
            fid = fixture["fixture"]["id"]
            print(f"[prediction_service] Skipping fixture {fid}: {result}")
        else:
            predictions.append(result)

    return predictions


async def predict_league_fixtures(league_id: int) -> list[PredictionResult]:
    """
    Return predictions for upcoming fixtures in a league.
    Fetches today's fixtures for the league.
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")
    try:
        envelope = await match_data_service.get_fixtures_by_date(today)
    except MatchServiceError:
        raise

    fixtures: list[dict] = [
        fx for fx in envelope.get("response", [])
        if fx.get("league", {}).get("id") == league_id
    ]

    tasks = [predict_fixture(fx["fixture"]["id"]) for fx in fixtures]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    return [r for r in results if not isinstance(r, Exception)]


async def generate_today_tickets() -> list[Ticket]:
    """
    Generate 4 risk-tiered betting tickets for today's matches.

    Checks Redis first (30-min TTL). Falls back to all-mock tickets
    if match-service is unavailable.
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")

    cached = await _read_tickets_cache(today)
    if cached:
        return cached

    # Attempt to fetch today's full predictions
    full_predictions: list[FullPredictionResult] = []
    try:
        envelope = await match_data_service.get_fixtures_by_date(today)
        fixtures: list[dict] = envelope.get("response", [])

        tasks = [predict_fixture_with_markets(fx["fixture"]["id"]) for fx in fixtures]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        full_predictions = [r for r in results if not isinstance(r, Exception)]
    except MatchServiceError:
        print("[prediction_service] match-service unavailable — using mock ticket data")

    tickets = ticket_generator.generate_daily_tickets(full_predictions)
    await _write_tickets_cache(today, tickets)
    return tickets


async def generate_tier_tickets(tier: TicketTier) -> list[Ticket]:
    """Return tickets filtered to a specific tier."""
    all_tickets = await generate_today_tickets()
    return [t for t in all_tickets if t.tier == tier.value]
