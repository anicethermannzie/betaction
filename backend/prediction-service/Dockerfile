# =============================================================================
# BetAction — Prediction Service (Python/FastAPI)
# Multi-stage build: builder installs packages, production runs lean image
# =============================================================================

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

LABEL maintainer="BetAction Team"

WORKDIR /app

# Install dependencies into a user-local directory for clean copying
COPY requirements.txt ./

RUN pip install --no-cache-dir --user -r requirements.txt

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM python:3.11-slim AS production

LABEL maintainer="BetAction Team"

# curl for health checks (not present in python:3.11-slim by default)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Create a least-privilege non-root user
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

WORKDIR /app

# Copy installed packages from builder; chown so appuser can read them
COPY --chown=appuser:appgroup --from=builder /root/.local /home/appuser/.local

# Copy application source
COPY src/ ./src/

# Make the user-local bin available and set Python runtime flags
ENV PATH="/home/appuser/.local/bin:$PATH" \
    PYTHONPATH="/app" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Run as non-root for security
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
