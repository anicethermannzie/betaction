from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Service ──────────────────────────────────────────────────────────────
    port: int = 8000
    debug: bool = False

    # ── Match service ────────────────────────────────────────────────────────
    match_service_url: str = "http://localhost:3002"
    match_service_timeout: float = 10.0

    # ── Redis ────────────────────────────────────────────────────────────────
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""

    # ── Cache ────────────────────────────────────────────────────────────────
    prediction_cache_ttl: int = 1800  # 30 minutes

    # ── Algorithm defaults ───────────────────────────────────────────────────
    league_avg_goals: float = 1.5  # average goals per team per match

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
