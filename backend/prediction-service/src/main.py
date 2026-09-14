import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from src.config.redis_client import init_redis, close_redis
from src.config.settings import settings
from src.routers.prediction_router import router as prediction_router
from src.services.match_data_service import match_data_service

# ── Logging ──────────────────────────────────────────────────────────────────
# Replaces bare print() calls: levels, timestamps and module names, on stdout
# where the container runtime collects them.
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("prediction-service")


# ── Scheduler ────────────────────────────────────────────────────────────────

scheduler = AsyncIOScheduler(timezone="UTC")


async def warm_today_predictions_cache() -> None:
    """
    Scheduled job: pre-compute predictions for all of today's matches.
    Runs once at midnight UTC so the first requests of the day are instant.
    """
    from src.services.prediction_service import predict_fixtures_by_date

    today = datetime.utcnow().strftime("%Y-%m-%d")
    logger.info("Warming prediction cache for %s", today)
    try:
        predictions = await predict_fixtures_by_date(today)
        logger.info("Cache warm complete for %s (%d fixtures)", today, len(predictions))
    except Exception:
        logger.exception("Cache warm failed for %s", today)


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_redis()

    if not settings.jwt_access_secret:
        # Without the shared secret every caller resolves to anonymous/free, so
        # paying customers would silently receive the free response.
        logger.error(
            "JWT_ACCESS_SECRET is not set — all callers will be treated as anonymous "
            "and entitlement checks cannot honour a paid plan"
        )

    scheduler.add_job(
        warm_today_predictions_cache,
        trigger="cron",
        hour=0,
        minute=1,
        id="warm_today_cache",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started")

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    await match_data_service.aclose()
    await close_redis()
    logger.info("Shutdown complete")


# ── App ───────────────────────────────────────────────────────────────────────

# The interactive docs describe the paid algorithm's full surface, so they are
# served outside production only.
_docs_enabled = not settings.is_production

app = FastAPI(
    title="BetAction Prediction Service",
    description="AI-powered football match predictions using weighted multi-factor analysis",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(prediction_router)


@app.get("/health", tags=["Health"])
async def health_check():
    # Deliberately does not echo match_service_url — the health endpoint is
    # reachable through the gateway and internal hostnames are not public detail.
    return {
        "status": "ok",
        "service": "prediction-service",
        "timestamp": datetime.utcnow().isoformat(),
    }
