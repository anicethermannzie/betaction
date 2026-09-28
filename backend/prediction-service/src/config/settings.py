from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Service ──────────────────────────────────────────────────────────────
    port: int = 8000
    debug: bool = False
    environment: str = "development"

    # ── Match service ────────────────────────────────────────────────────────
    match_service_url: str = "http://localhost:3002"
    match_service_timeout: float = 10.0

    # Upper bound on fixtures predicted concurrently. Each fixture costs five
    # upstream calls (fixture + 2 team stats + h2h + odds), so an unbounded
    # gather over a full matchday fired ~600 simultaneous requests at
    # match-service and burned the API-Football quota in a single page load.
    max_concurrent_predictions: int = 8

    # ── Auth ─────────────────────────────────────────────────────────────────
    # Shared with auth-service. Used to verify access tokens locally and read the
    # plan claim; without it every caller is treated as anonymous/free.
    jwt_access_secret: str = ""

    # ── Redis ────────────────────────────────────────────────────────────────
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""

    # ── Cache ────────────────────────────────────────────────────────────────
    prediction_cache_ttl: int = 1800  # 30 minutes

    # ── Algorithm defaults ───────────────────────────────────────────────────
    league_avg_goals: float = 1.5  # average goals per team per match

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


settings = Settings()
