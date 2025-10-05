# Redis Dockerfile for fly.io deployment
FROM redis:7.4-alpine

# Copy custom Redis configuration
COPY redis.conf /usr/local/etc/redis/redis.conf

# Expose Redis port
EXPOSE 6379

# Run Redis with config file
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
