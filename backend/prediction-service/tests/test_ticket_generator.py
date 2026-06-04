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


def test_generate_daily_tickets_fallback():
    # When predictions is empty, generator should fall back to mock data
    tickets = ticket_generator.generate_daily_tickets([])
    assert len(tickets) == 4
    for ticket in tickets:
        assert len(ticket.legs) > 0
        assert ticket.combined_odds > 1.0
        assert ticket.combined_probability > 0.0


def test_generate_daily_tickets_with_real_data():
    pred = predict_with_markets(
        fixture_id=123,
        home_team_id=1,
        away_team_id=2,
        home_team_name="Man City",
        away_team_name="Liverpool",
        league_id=39,
        league_name="Premier League",
        season=2023,
        home_team_stats=MOCK_STATS_HOME,
        away_team_stats=MOCK_STATS_AWAY,
        h2h_fixtures=[],
        odds_response=MOCK_ODDS_RESPONSE,
        kickoff=datetime.utcnow(),
    )

    tickets = ticket_generator.generate_daily_tickets([pred])
    assert len(tickets) == 4
    # Real leg from Man City vs Liverpool should be selected/integrated
    found_real_leg = False
    for ticket in tickets:
        for leg in ticket.legs:
            if leg.fixture_id == 123:
                found_real_leg = True
                assert leg.match == "Man City vs Liverpool"
    assert found_real_leg is True
    # Even with only 1 real match, tickets should be fully populated due to mock fallback
    for ticket in tickets:
        assert len(ticket.legs) >= 2

