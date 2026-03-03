from contextlib import asynccontextmanager
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from src.config.redis_client import init_redis, close_redis
from src.config.settings import settings
from src.routers.prediction_router import router as prediction_router


# ── Scheduler ────────────────────────────────────────────────────────────────

scheduler = AsyncIOScheduler(timezone="UTC")


async def warm_today_predictions_cache() -> None:
    """
    Scheduled job: pre-compute predictions for all of today's matches.
    Runs once at midnight UTC so the first requests of the day are instant.
    """
    from src.services.prediction_service import predict_fixtures_by_date

    today = datetime.utcnow().strftime("%Y-%m-%d")
    print(f"[scheduler] Warming prediction cache for {today}")
    try:
        await predict_fixtures_by_date(today)
        print(f"[scheduler] Cache warm complete for {today}")
    except Exception as exc:
        print(f"[scheduler] Cache warm failed: {exc}")


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_redis()

    scheduler.add_job(
        warm_today_predictions_cache,
        trigger="cron",
        hour=0,
        minute=1,
        id="warm_today_cache",
        replace_existing=True,
    )
    scheduler.start()
    print("[prediction-service] Scheduler started")

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    await close_redis()
    print("[prediction-service] Shutdown complete")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="BetAction Prediction Service",
    description="AI-powered football match predictions using weighted multi-factor analysis",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(prediction_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "prediction-service",
        "timestamp": datetime.utcnow().isoformat(),
        "match_service_url": settings.match_service_url,
    }
