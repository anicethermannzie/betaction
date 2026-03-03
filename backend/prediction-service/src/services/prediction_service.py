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

from src.algorithm.predictor import predict
from src.config.redis_client import get_redis
from src.config.settings import settings
from src.models.prediction import PredictionResult
from src.services.match_data_service import MatchDataService, MatchServiceError, match_data_service


# ── Cache helpers ─────────────────────────────────────────────────────────────

def _cache_key(fixture_id: int) -> str:
    return f"prediction:{fixture_id}"


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


# ── Core prediction pipeline ──────────────────────────────────────────────────

async def _build_prediction(
    fixture_id: int,
    svc: MatchDataService = match_data_service,
) -> PredictionResult:
    """
    Fetch all required data and run the algorithm.
    Raises MatchServiceError if match-service calls fail.
    """
    # Step 1: fixture details (we need team IDs, league, season)
    fixture_envelope = await svc.get_fixture(fixture_id)
    fixtures_list: list[dict] = fixture_envelope.get("response", [])

    if not fixtures_list:
        raise ValueError(f"Fixture {fixture_id} not found in match-service response")

    fx = fixtures_list[0]
    home_team_id: int = fx["teams"]["home"]["id"]
    away_team_id: int = fx["teams"]["away"]["id"]
    home_team_name: str = fx["teams"]["home"]["name"]
    away_team_name: str = fx["teams"]["away"]["name"]
    league_id: int = fx["league"]["id"]
    season: int = fx["league"]["season"]

    # Step 2: concurrent data fetching (team stats × 2, h2h, odds)
    home_stats_env, away_stats_env, h2h_env, odds_env = await asyncio.gather(
        svc.get_team_stats(home_team_id, league_id, season),
        svc.get_team_stats(away_team_id, league_id, season),
        svc.get_h2h(home_team_id, away_team_id),
        svc.get_match_odds(fixture_id),
        return_exceptions=True,
    )

    def _safe_response(env, fallback):
        """Return `response` list/dict from envelope, or fallback on error."""
        if isinstance(env, Exception):
            print(f"[prediction_service] Data fetch failed: {env}")
            return fallback
        return env.get("response", fallback)

    home_stats: dict = _safe_response(home_stats_env, {})
    away_stats: dict = _safe_response(away_stats_env, {})
    h2h_fixtures: list[dict] = _safe_response(h2h_env, [])
    odds_response: list[dict] = _safe_response(odds_env, [])

    # Step 3: run algorithm
    return predict(
        fixture_id=fixture_id,
        home_team_id=home_team_id,
        away_team_id=away_team_id,
        home_team_name=home_team_name,
        away_team_name=away_team_name,
        league_id=league_id,
        season=season,
        home_team_stats=home_stats,
        away_team_stats=away_stats,
        h2h_fixtures=h2h_fixtures,
        odds_response=odds_response,
    )


# ── Public service functions ──────────────────────────────────────────────────

async def predict_fixture(fixture_id: int) -> PredictionResult:
    """
    Return a prediction for a single fixture.

    Checks Redis first. If match-service is down and a cached result
    exists, returns the cached result. Otherwise re-raises the error.
    """
    # Cache hit
    cached = await _read_cache(fixture_id)
    if cached:
        return cached

    try:
        result = await _build_prediction(fixture_id)
        await _write_cache(result)
        return result
    except MatchServiceError:
        # Last-chance: return stale cache if any
        stale = await _read_cache(fixture_id)
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
    except MatchServiceError as exc:
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

    # Filter by league
    fixtures: list[dict] = [
        fx for fx in envelope.get("response", [])
        if fx.get("league", {}).get("id") == league_id
    ]

    tasks = [predict_fixture(fx["fixture"]["id"]) for fx in fixtures]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    return [r for r in results if not isinstance(r, Exception)]
