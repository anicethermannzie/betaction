"""
Tests for the prediction-service lifespan's scheduler gating.

The midnight cache-warmup job pre-computes every fixture's prediction
regardless of whether anyone uses the app that day, which costs real
API-Football quota through match-service. It must default to off so an idle
deployment spends zero quota, and only run when explicitly enabled.
"""

from fastapi.testclient import TestClient

from src.config.settings import settings
from src.main import app, scheduler


def test_prediction_warmup_defaults_to_disabled():
    assert settings.enable_prediction_warmup is False


def test_scheduler_does_not_start_when_warmup_disabled():
    settings.enable_prediction_warmup = False
    try:
        with TestClient(app):
            assert scheduler.running is False
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)


def test_scheduler_starts_and_schedules_the_job_when_warmup_enabled():
    settings.enable_prediction_warmup = True
    try:
        with TestClient(app):
            assert scheduler.running is True
            assert scheduler.get_job("warm_today_cache") is not None
    finally:
        settings.enable_prediction_warmup = False
        if scheduler.running:
            scheduler.shutdown(wait=False)
