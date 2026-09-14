"""
Tests for the TicketGenerator service (ticket_generator.py).
"""

from datetime import datetime
from src.services.ticket_generator import (
    ticket_generator,
    _prob_to_odds,
    _select_legs,
    _BetOption,
)
from src.algorithm.predictor import predict_with_markets
from tests.test_new_analyzers import MOCK_STATS_HOME, MOCK_STATS_AWAY
from tests.test_predictor import MOCK_ODDS_RESPONSE


def test_prob_to_odds():
    assert _prob_to_odds(1.0) == 1.05  # margin removed/added
    assert _prob_to_odds(0.5) == 2.11  # 1 / (0.5 * 0.95)
    assert _prob_to_odds(0.0) == 99.0


def test_select_legs():
    options = [
        _BetOption(1, "Team A vs Team B", "League A", None, "home_win", "Team A to Win", 0.90, 1.11),
        _BetOption(1, "Team A vs Team B", "League A", None, "over_2_5", "Over 2.5 Goals", 0.85, 1.22),
        _BetOption(2, "Team C vs Team D", "League A", None, "away_win", "Team D to Win", 0.80, 1.25),
        _BetOption(3, "Team E vs Team F", "League A", None, "home_win", "Team E to Win", 0.75, 1.33),
        _BetOption(4, "Team G vs Team H", "League A", None, "home_win", "Team G to Win", 0.70, 1.43),
    ]

    # Select legs with min_prob = 0.75, min_legs = 2, max_legs = 3
    selected = _select_legs(options, min_prob=0.75, min_legs=2, max_legs=3)

    # Output should respect max 1 leg per fixture.
    # fixture 1 has home_win (0.90) and over_2_5 (0.85). Only home_win should be chosen.
    assert len(selected) <= 3
    fixtures = [o.fixture_id for o in selected]
    assert len(fixtures) == len(set(fixtures))  # unique fixtures
    assert selected[0].fixture_id == 1
    assert selected[0].market == "home_win"
    assert selected[1].fixture_id == 2


def _prediction(fixture_id: int, home: str, away: str):
    return predict_with_markets(
        fixture_id=fixture_id,
        home_team_id=fixture_id * 10,
        away_team_id=fixture_id * 10 + 1,
        home_team_name=home,
        away_team_name=away,
        league_id=39,
        league_name="Premier League",
        season=2023,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
        h2h_fixtures=[],
        odds_response=MOCK_ODDS_RESPONSE,
        kickoff=datetime.utcnow(),
    )


def test_generate_daily_tickets_returns_nothing_without_predictions():
    """
    With no predictions there is nothing real to recommend, so no ticket is
    offered. The generator used to pad short tiers from a hardcoded list of
    invented fixtures, which put unwinnable bets in front of paying customers.
    """
    assert ticket_generator.generate_daily_tickets([]) == []


def test_single_fixture_cannot_fill_any_tier():
    """
    Legs must come from distinct fixtures and every tier needs at least two, so
    one match yields nothing. Previously this returned four tickets padded with
    invented fixtures.
    """
    assert ticket_generator.generate_daily_tickets([_prediction(123, "Man City", "Liverpool")]) == []


def test_generate_daily_tickets_with_real_data():
    predictions = [
        _prediction(101, "Man City", "Liverpool"),
        _prediction(102, "Arsenal", "Chelsea"),
        _prediction(103, "Spurs", "Everton"),
        _prediction(104, "Newcastle", "Brighton"),
        _prediction(105, "Villa", "Fulham"),
    ]
    fixture_ids = {p.fixture_id for p in predictions}

    tickets = ticket_generator.generate_daily_tickets(predictions)

    assert tickets, "five fixtures should fill at least the smallest tier"
    for ticket in tickets:
        assert len(ticket.legs) >= 2
        assert ticket.combined_odds > 1.0
        assert ticket.combined_probability > 0.0
        # Every leg traces back to a fixture that was actually predicted — no
        # invented fixtures may appear in a ticket.
        assert all(leg.fixture_id in fixture_ids for leg in ticket.legs)
        # One leg per fixture.
        leg_fixtures = [leg.fixture_id for leg in ticket.legs]
        assert len(leg_fixtures) == len(set(leg_fixtures))


def test_tiers_needing_more_legs_than_there_are_fixtures_are_omitted():
    """Three fixtures cannot produce the 8-leg "risky" ticket, so it is not offered."""
    predictions = [
        _prediction(201, "A", "B"),
        _prediction(202, "C", "D"),
        _prediction(203, "E", "F"),
    ]

    tiers = {t.tier for t in ticket_generator.generate_daily_tickets(predictions)}
    assert "risky" not in tiers
