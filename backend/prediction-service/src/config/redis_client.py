import redis.asyncio as aioredis
from src.config.settings import settings
import time

_redis_client = None


class InMemoryRedisMock:
    def __init__(self):
        self.cache = {}

    async def ping(self):
        return True

    async def get(self, key: str):
        item = self.cache.get(key)
        if not item:
            return None
        value, expiry = item
        if expiry and time.time() > expiry:
            del self.cache[key]
            return None
        return value

    async def setex(self, key: str, ttl: int, value: str):
        self.cache[key] = (value, time.time() + ttl)
        return True

    async def aclose(self):
        pass


def get_redis() -> aioredis.Redis:
    """Return the module-level Redis client (initialized on startup)."""
    global _redis_client
    if _redis_client is None:
        raise RuntimeError("Redis client has not been initialized. Call init_redis() first.")
    return _redis_client


async def init_redis() -> aioredis.Redis:
    """Create the Redis connection pool and verify connectivity."""
    global _redis_client

    url = f"redis://{settings.redis_host}:{settings.redis_port}"
    if settings.redis_password:
        url = f"redis://:{settings.redis_password}@{settings.redis_host}:{settings.redis_port}"

    client = aioredis.from_url(
        url,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
        retry_on_timeout=False,
    )

    try:
        await client.ping()
        _redis_client = client
        print(f"[prediction-service] Redis connected at {settings.redis_host}:{settings.redis_port}")
    except Exception as exc:
        print(f"[prediction-service] Redis connectivity failed ({exc}). Falling back to in-memory cache.")
        _redis_client = InMemoryRedisMock()

    return _redis_client


async def close_redis() -> None:
    """Close the Redis connection pool gracefully."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
        print("[prediction-service] Redis connection closed")
