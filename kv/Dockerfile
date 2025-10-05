# Redis Dockerfile for fly.io deployment with TLS
FROM redis:7.4-alpine

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

# Copy custom Redis configuration
COPY redis.conf /usr/local/etc/redis/redis.conf

# Create TLS directory
RUN mkdir -p /etc/redis/tls

# Generate self-signed certificates at build time
RUN openssl req -x509 -nodes -newkey rsa:4096 \
    -keyout /etc/redis/tls/key.pem \
    -out /etc/redis/tls/cert.pem \
    -days 3650 \
    -subj "/CN=kv.geoffjay.com" && \
    cp /etc/redis/tls/cert.pem /etc/redis/tls/ca.pem && \
    chmod 644 /etc/redis/tls/*.pem

# Expose Redis TLS port
EXPOSE 6379

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'exec redis-server /usr/local/etc/redis/redis.conf --requirepass "${REDIS_PASSWORD:-changeme}"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Run Redis with custom config and password from environment
ENTRYPOINT ["/entrypoint.sh"]
