"""
Tests for server-side plan enforcement.

These guard revenue: if any of them fail, a free caller is receiving something a
customer is being charged $9.99/month for.
"""

from datetime import datetime, timedelta, timezone

import jwt
import pytest

from src.middleware.auth import resolve_plan
from src.models.prediction import (
    MatchWinnerPrediction,
    MarketsResult,
    FullPredictionResult,
    HandicapPrediction,
    PredictionFactors,
    Ticket,
    TicketLeg,
)
from src.services.entitlements import (
    FREE_LEGS_PER_TICKET,
    FREE_MARKET_FIELDS,
    FREE_TICKETS_PER_DAY,
    limit_markets,
    limit_prediction,
    limit_tickets,
)

SECRET = "x" * 48


def _factors() -> PredictionFactors:
    return PredictionFactors(
        home_form_score=0.6, away_form_score=0.4,
        home_h2h_score=0.5, away_h2h_score=0.5,
        home_expected_goals=1.6, away_expected_goals=1.1,
        home_home_win_rate=0.6, away_away_win_rate=0.3,
    )


def _full_prediction() -> FullPredictionResult:
    return FullPredictionResult(
        fixture_id=1, home_team="A", away_team="B",
        home_team_id=1, away_team_id=2, league_id=39, season=2026,
        home_win=0.5, draw=0.3, away_win=0.2,
        prediction="HOME_WIN", confidence="medium",
        factors=_factors(),
        markets=MarketsResult(
            **{"1x2": MatchWinnerPrediction(home_win=0.5, draw=0.3, away_win=0.2)},
            handicap=HandicapPrediction(
                home_minus_1=0.4, tie_minus_1=0.3, away_plus_1=0.3,
                home_minus_2=0.2, tie_minus_2=0.3, away_plus_2=0.5,
                home_minus_3=0.1, tie_minus_3=0.2, away_plus_3=0.7,
            ),
        ),
    )


def _ticket(tier: str, legs: int) -> Ticket:
    return Ticket(
        id=f"{tier}-id", tier=tier, name=tier, emoji="🔵", description="",
        legs=[
            TicketLeg(
                fixture_id=100 + i, match=f"A{i} vs B{i}", league="PL",
                market="home_win", selection="A to win", probability=0.8, odds=1.25,
            )
            for i in range(legs)
        ],
        combined_odds=round(1.25 ** legs, 2),
        combined_probability=round(0.8 ** legs, 4),
        potential_return_per_unit=round(1.25 ** legs, 2),
        confidence="medium",
    )


# ── Plan resolution ───────────────────────────────────────────────────────────

def test_vip_claim_resolves_to_vip():
    assert resolve_plan({"plan": "vip"}) == "vip"


def test_active_trial_does_not_resolve_to_vip():
    """
    Confirmed product decision (2026-09-14): the trial window does not unlock
    VIP. A trial user is a free caller — same restricted response as anyone
    else, matching the "Free trial" column on the pricing table. TRIAL_GRANTS_VIP
    is False in both this file and auth-service/src/utils/entitlements.js.
    """
    future = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    assert resolve_plan({"plan": "free", "trial_ends_at": future}) == "free"


def test_expired_trial_resolves_to_free():
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    assert resolve_plan({"plan": "free", "trial_ends_at": past}) == "free"


def test_missing_and_malformed_claims_resolve_to_free():
    assert resolve_plan({}) == "free"
    assert resolve_plan({"plan": "free", "trial_ends_at": "not-a-date"}) == "free"
    # A forged plan value must not be honoured.
    assert resolve_plan({"plan": "VIP  "}) == "free"


def test_token_round_trip_carries_the_plan_claim():
    token = jwt.encode({"id": 1, "plan": "vip", "trial_ends_at": None}, SECRET, algorithm="HS256")
    claims = jwt.decode(token, SECRET, algorithms=["HS256"])
    assert resolve_plan(claims) == "vip"


def test_token_signed_with_another_secret_is_rejected():
    token = jwt.encode({"id": 1, "plan": "vip"}, "attacker-secret", algorithm="HS256")
    with pytest.raises(jwt.InvalidTokenError):
        jwt.decode(token, SECRET, algorithms=["HS256"])


# ── Market shaping ────────────────────────────────────────────────────────────

def test_free_caller_receives_only_free_markets():
    limited = limit_markets(_full_prediction(), "free")

    assert limited.markets.one_x_two is not None       # a free market
    assert limited.markets.handicap is None            # a VIP market, withheld
    for field in limited.markets.model_fields:
        if getattr(limited.markets, field) is not None:
            assert field in FREE_MARKET_FIELDS


def test_free_caller_does_not_receive_the_factor_breakdown():
    assert limit_markets(_full_prediction(), "free").factors is None
    assert limit_prediction(_full_prediction(), "free").factors is None


def test_vip_receives_everything_untouched():
    result = _full_prediction()
    limited = limit_markets(result, "vip")
    assert limited.markets.handicap is not None
    assert limited.factors is not None


def test_shaping_does_not_mutate_the_cached_object():
    """The source object is re-used from cache, so trimming must copy."""
    original = _full_prediction()
    limit_markets(original, "free")
    assert original.markets.handicap is not None
    assert original.factors is not None


# ── Ticket shaping ────────────────────────────────────────────────────────────

def test_free_caller_gets_one_ticket_capped_at_three_legs():
    tickets = [_ticket("ultra_safe", 3), _ticket("safe", 5), _ticket("risky", 9)]
    limited = limit_tickets(tickets, "free")

    assert len(limited) == FREE_TICKETS_PER_DAY
    assert limited[0].tier == "ultra_safe"  # safest tier available
    assert len(limited[0].legs) <= FREE_LEGS_PER_TICKET


def test_capped_ticket_reports_the_odds_of_the_legs_it_shows():
    """A 3-leg ticket must not advertise the combined odds of a 9-leg parlay."""
    limited = limit_tickets([_ticket("risky", 9)], "free")[0]

    expected_odds = round(1.25 ** len(limited.legs), 2)
    assert limited.combined_odds == expected_odds
    assert limited.potential_return_per_unit == expected_odds
    assert limited.combined_probability == round(0.8 ** len(limited.legs), 4)


def test_vip_tickets_are_untouched():
    tickets = [_ticket("ultra_safe", 3), _ticket("safe", 5)]
    assert limit_tickets(tickets, "vip") == tickets
