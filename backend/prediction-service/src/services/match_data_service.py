"""
HTTP client for the match-service.

All prediction data flows through here — the prediction service never
calls API-Football directly. This makes the prediction service testable
by mocking this layer.
"""

from datetime import datetime
from typing import Any

import httpx

from src.config.settings import settings


class MatchServiceError(Exception):
    """Raised when the match-service returns an error or is unreachable."""


class MatchDataService:
    """Async HTTP client for the match-service REST API."""

    def __init__(self) -> None:
        self._base_url = settings.match_service_url.rstrip("/")
        self._timeout = settings.match_service_timeout
        self._client: httpx.AsyncClient | None = None

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def _get_client(self) -> httpx.AsyncClient:
        """
        Lazily create one shared client.

        A client per request meant a fresh TCP handshake for every one of the
        hundreds of calls a matchday batch makes. One pooled client keeps
        connections alive across them. Created lazily rather than at import so
        it binds to the running event loop.
        """
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
            )
        return self._client

    async def aclose(self) -> None:
        """Close the pooled client. Called from the FastAPI lifespan shutdown."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
        self._client = None

    # ── Private helpers ───────────────────────────────────────────────────────

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> dict:
        """Execute an async GET request and return the parsed JSON body."""
        url = f"{self._base_url}{path}"
        try:
            response = await self._get_client().get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            raise MatchServiceError(
                f"match-service timed out after {self._timeout}s for GET {path}"
            )
        except httpx.HTTPStatusError as exc:
            raise MatchServiceError(
                f"match-service returned {exc.response.status_code} for GET {path}"
            )
        except httpx.RequestError as exc:
            raise MatchServiceError(
                f"match-service unreachable — {exc} — is it running at {self._base_url}?"
            )

    # ── Public methods ────────────────────────────────────────────────────────

    async def get_fixture(self, fixture_id: int) -> dict:
        """
        Fetch details for a single fixture.
        Endpoint: GET /matches/{fixture_id}
        """
        return await self._get(f"/matches/{fixture_id}")

    async def get_fixtures_by_date(self, date: str) -> dict:
        """
        Fetch all fixtures for a given date (YYYY-MM-DD).
        Endpoint: GET /matches/date/{date}
        """
        return await self._get(f"/matches/date/{date}")

    async def get_team_stats(
        self, team_id: int, league_id: int, season: int | None = None
    ) -> dict:
        """
        Fetch aggregated season statistics for a team within a league.
        Endpoint: GET /teams/{teamId}/stats?league=ID&season=YYYY
        """
        if season is None:
            season = datetime.utcnow().year
        return await self._get(
            f"/teams/{team_id}/stats",
            params={"league": league_id, "season": season},
        )

    async def get_h2h(self, team1_id: int, team2_id: int) -> dict:
        """
        Fetch head-to-head fixture history between two teams.
        Endpoint: GET /matches/h2h/{team1_id}/{team2_id}
        """
        return await self._get(f"/matches/h2h/{team1_id}/{team2_id}")

    async def get_match_odds(self, fixture_id: int) -> dict:
        """
        Fetch bookmaker odds for a fixture.
        Endpoint: GET /matches/{fixture_id}/odds
        """
        return await self._get(f"/matches/{fixture_id}/odds")

    async def get_league_standings(
        self, league_id: int, season: int | None = None
    ) -> dict:
        """
        Fetch current league standings.
        Endpoint: GET /leagues/{leagueId}/standings?season=YYYY
        """
        if season is None:
            season = datetime.utcnow().year
        return await self._get(
            f"/leagues/{league_id}/standings",
            params={"season": season},
        )


# Module-level singleton — created once, reused across requests
match_data_service = MatchDataService()
