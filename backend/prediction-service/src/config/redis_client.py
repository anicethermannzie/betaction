import logging
import time
from collections import OrderedDict

import redis.asyncio as aioredis

from src.config.settings import settings

logger = logging.getLogger(__name__)

_redis_client = None

# Upper bound on the fallback cache. Predictions are ~4 KB each, so this caps the
# fallback at a few tens of MB instead of growing until the container is killed.
_FALLBACK_MAX_ENTRIES = 2000


class InMemoryRedisMock:
    """
    Process-local stand-in used when Redis cannot be reached at startup.

    Bounded and LRU-evicting: entries written but never read again used to sit in
    the map forever, because only the read path removed expired keys.
    Per-process, so with several tasks each keeps its own copy — acceptable for a
    cache, and the reason this is a fallback rather than a design.
    """

    def __init__(self):
        self.cache: OrderedDict[str, tuple[str, float]] = OrderedDict()

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
        self.cache.move_to_end(key)
        return value

    async def setex(self, key: str, ttl: int, value: str):
        self.cache[key] = (value, time.time() + ttl)
        self.cache.move_to_end(key)
        while len(self.cache) > _FALLBACK_MAX_ENTRIES:
            self.cache.popitem(last=False)
        return True

    async def aclose(self):
        self.cache.clear()


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
        logger.info("Redis connected at %s:%s", settings.redis_host, settings.redis_port)
    except Exception as exc:
        logger.error("Redis connectivity failed (%s) — falling back to the in-memory cache", exc)
        _redis_client = InMemoryRedisMock()

    return _redis_client


async def close_redis() -> None:
    """Close the Redis connection pool gracefully."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("Redis connection closed")
