import redis.asyncio as aioredis
from src.config.settings import settings

_redis_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    """Return the module-level Redis client (initialized on startup)."""
    if _redis_client is None:
        raise RuntimeError("Redis client has not been initialized. Call init_redis() first.")
    return _redis_client


async def init_redis() -> aioredis.Redis:
    """Create the Redis connection pool and verify connectivity."""
    global _redis_client

    url = f"redis://{settings.redis_host}:{settings.redis_port}"
    if settings.redis_password:
        url = f"redis://:{settings.redis_password}@{settings.redis_host}:{settings.redis_port}"

    _redis_client = aioredis.from_url(
        url,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
        retry_on_timeout=True,
    )

    await _redis_client.ping()
    print(f"[prediction-service] Redis connected at {settings.redis_host}:{settings.redis_port}")
    return _redis_client


async def close_redis() -> None:
    """Close the Redis connection pool gracefully."""
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None
        print("[prediction-service] Redis connection closed")
