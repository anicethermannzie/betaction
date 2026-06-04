"""
Tests for the Prediction API router (prediction_router.py).
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.models.prediction import Ticket, TicketLeg


client = TestClient(app)


# Mock data
MOCK_TICKET = Ticket(
    id="test-ticket-id",
    tier="safe",
    name="Safe Accumulator",
    emoji="🔵",
    description="Decent probability with decent returns",
    legs=[
        TicketLeg(
            fixture_id=100,
            match="Team A vs Team B",
            league="Premier League",
            kickoff=None,
            market="home_win",
            selection="Team A to Win",
            probability=0.75,
            odds=1.40,
        )
    ],
    combined_odds=1.40,
    combined_probability=0.75,
    potential_return_per_unit=1.40,
    confidence="medium",
)


@pytest.fixture(autouse=True)
def mock_redis_lifespan():
    """Bypass Redis initialization during lifespan startup."""
    with patch("src.main.init_redis", new_callable=AsyncMock), \
         patch("src.main.close_redis", new_callable=AsyncMock):
        yield


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "prediction-service"


@patch("src.routers.prediction_router.generate_today_tickets", new_callable=AsyncMock)
def test_get_today_tickets(mock_gen):
    mock_gen.return_value = [MOCK_TICKET]

    response = client.get("/predictions/tickets/today")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 1
    assert data["data"][0]["id"] == "test-ticket-id"
    assert data["data"][0]["tier"] == "safe"


@patch("src.routers.prediction_router.generate_tier_tickets", new_callable=AsyncMock)
def test_get_tier_tickets(mock_gen):
    mock_gen.return_value = [MOCK_TICKET]

    response = client.get("/predictions/tickets/safe")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"][0]["tier"] == "safe"


def test_get_tier_tickets_invalid_tier():
    response = client.get("/predictions/tickets/super_risky")
    assert response.status_code == 422  # validation error since it's an enum


@patch("src.routers.prediction_router.predict_fixtures_by_date", new_callable=AsyncMock)
def test_get_today_predictions(mock_predict):
    mock_predict.return_value = []

    response = client.get("/predictions/today")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 0
    assert data["data"] == []


@patch("src.routers.prediction_router.predict_league_fixtures", new_callable=AsyncMock)
def test_get_league_predictions(mock_predict):
    mock_predict.return_value = []

    response = client.get("/predictions/league/39")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 0
    assert data["data"] == []
