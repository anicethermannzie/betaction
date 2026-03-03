"""
Pydantic models for data received from the match-service.
These mirror the API-Football v3 response structure that match-service proxies.
Fields are Optional where API-Football may omit them (e.g. goals before kick-off).
"""

from typing import Optional
from pydantic import BaseModel


# ── Team ─────────────────────────────────────────────────────────────────────

class TeamInfo(BaseModel):
    id: int
    name: str
    logo: Optional[str] = None
    winner: Optional[bool] = None  # populated in fixture responses after FT


class TeamsInFixture(BaseModel):
    home: TeamInfo
    away: TeamInfo


# ── Goals ────────────────────────────────────────────────────────────────────

class Goals(BaseModel):
    home: Optional[int] = None
    away: Optional[int] = None


# ── Fixture meta ─────────────────────────────────────────────────────────────

class FixtureStatus(BaseModel):
    long: str
    short: str
    elapsed: Optional[int] = None


class FixtureMeta(BaseModel):
    id: int
    date: Optional[str] = None
    status: FixtureStatus


# ── League context ───────────────────────────────────────────────────────────

class LeagueMeta(BaseModel):
    id: int
    name: str
    season: int
    round: Optional[str] = None


# ── Full fixture ─────────────────────────────────────────────────────────────

class Fixture(BaseModel):
    fixture: FixtureMeta
    league: LeagueMeta
    teams: TeamsInFixture
    goals: Goals


# ── Team statistics (from /teams/statistics) ─────────────────────────────────

class GoalAverage(BaseModel):
    home: Optional[str] = None
    away: Optional[str] = None
    total: Optional[str] = None


class GoalStat(BaseModel):
    average: GoalAverage


class GoalsStats(BaseModel):
    for_: GoalStat  # "for" is a reserved keyword in Python
    against: GoalStat

    model_config = {"populate_by_name": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        # Remap "for" → "for_" when deserializing raw API-Football JSON
        if isinstance(obj, dict) and "for" in obj and "for_" not in obj:
            obj = {**obj, "for_": obj.pop("for")}
        return super().model_validate(obj, **kwargs)


class FixtureRecord(BaseModel):
    home: Optional[int] = None
    away: Optional[int] = None
    total: Optional[int] = None


class FixturesStats(BaseModel):
    played: FixtureRecord
    wins: FixtureRecord
    draws: FixtureRecord
    loses: FixtureRecord


class TeamStatistics(BaseModel):
    """
    Represents the `response` object from GET /teams/statistics.
    We only model the fields our algorithm actually uses.
    """
    form: Optional[str] = None          # e.g. "WWDLW"
    fixtures: Optional[FixturesStats] = None
    goals: Optional[GoalsStats] = None


# ── Odds ─────────────────────────────────────────────────────────────────────

class OddsValue(BaseModel):
    value: str    # "Home", "Draw", "Away"
    odd: str      # decimal odds as string, e.g. "1.85"


class OddsBet(BaseModel):
    name: str
    values: list[OddsValue]


class OddsBookmaker(BaseModel):
    bets: list[OddsBet]


class MatchOdds(BaseModel):
    """Represents a single item in the `response` array from GET /odds."""
    bookmakers: list[OddsBookmaker] = []
