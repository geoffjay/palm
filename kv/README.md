# Redis Key-Value Store for fly.io

This directory contains the Redis deployment for the Simplify app on fly.io.

## Architecture

- **Image**: Redis 7.4 Alpine (lightweight, production-ready)
- **Network**: fly.io internal private network (IPv6)
- **Persistence**: 1GB volume mounted at `/data` with AOF + RDB snapshots
- **Memory**: 256MB with LRU eviction policy

## Deployment

### Initial Deployment

```bash
cd kv
fly launch --no-deploy --name app-geoffjay-com-redis --region sea
fly volumes create redis_data --size 1 --region sea --app app-geoffjay-com-redis
fly deploy --app app-geoffjay-com-redis
```

### Updates

```bash
cd kv
fly deploy --app app-geoffjay-com-redis
```

## Connection

From the main app (same fly.io organization), connect using the internal hostname:

```
redis://app-geoffjay-com-redis.internal:6379
```

The `.internal` suffix routes through fly.io's private IPv6 network (6PN).

## Monitoring

```bash
# View logs
fly logs --app app-geoffjay-com-redis

# Check status
fly status --app app-geoffjay-com-redis

# SSH into container
fly ssh console --app app-geoffjay-com-redis

# Connect to Redis CLI
fly ssh console --app app-geoffjay-com-redis -C "redis-cli"
```

## Configuration

The Redis instance is configured in `redis.conf` with:

- **Persistence**: RDB snapshots every 60s/300s/900s + AOF
- **Memory**: 256MB max with LRU eviction
- **Network**: Bound to 0.0.0.0 (internal network only, no external access)
- **Security**: No password (internal network is already secure)

## Troubleshooting

### Check Redis health

```bash
fly ssh console --app app-geoffjay-com-redis -C "redis-cli PING"
```

### View data persistence

```bash
fly ssh console --app app-geoffjay-com-redis -C "ls -lh /data"
```

### Monitor memory usage

```bash
fly ssh console --app app-geoffjay-com-redis -C "redis-cli INFO memory"
```
