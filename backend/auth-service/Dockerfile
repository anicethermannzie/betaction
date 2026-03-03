# =============================================================================
# BetAction — Auth Service
# Multi-stage build: builder installs all deps, production runs lean image
# =============================================================================

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL maintainer="BetAction Team"

WORKDIR /app

# Copy manifests first — layer cache is invalidated only when these change
COPY package*.json ./

# Install ALL dependencies (prod + dev) with exact lock-file versions
RUN npm ci

# Copy application source after deps to preserve cache on source-only changes
COPY src/ ./src/

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

LABEL maintainer="BetAction Team"

# curl is not included in node:20-alpine — install for health checks
RUN apk add --no-cache curl

# Create a least-privilege non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production

# Copy only the artefacts produced by the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src          ./src
COPY --from=builder /app/package.json ./package.json

# Run as non-root for security
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "src/server.js"]
