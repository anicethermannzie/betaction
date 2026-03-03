# =============================================================================
# BetAction — API Gateway (Nginx)
# Single-stage: nginx:alpine is already minimal; no build step required
# =============================================================================

FROM nginx:alpine

LABEL maintainer="BetAction Team"

# curl is needed for the health check (not present in nginx:alpine by default)
RUN apk add --no-cache curl

# Remove the default welcome-page config shipped with the base image
RUN rm -f /etc/nginx/conf.d/default.conf

# Main nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Modular conf.d snippets (rate-limiting, security-headers, upstream)
COPY conf.d/ /etc/nginx/conf.d/

# Verify configuration syntax at build time — fails fast before deployment
RUN nginx -t

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# nginx drops from root to the unprivileged `nginx` user after binding port 80
CMD ["nginx", "-g", "daemon off;"]
