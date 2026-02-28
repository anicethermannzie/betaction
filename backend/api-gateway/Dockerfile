# =============================================================================
# BetAction API Gateway — Dockerfile
# Base image: nginx:alpine (small footprint, hardened build)
# =============================================================================

FROM nginx:alpine

# Remove the default Nginx welcome page configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy main configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy modular conf.d snippets
COPY conf.d/ /etc/nginx/conf.d/

# Verify configuration syntax at build time — fails fast before deployment
RUN nginx -t

EXPOSE 80

# nginx image already runs as root to bind port 80;
# the `user nginx;` directive in nginx.conf drops privileges to the
# unprivileged `nginx` user after the master process binds the socket.
CMD ["nginx", "-g", "daemon off;"]
