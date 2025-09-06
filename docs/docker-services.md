# Docker Services Documentation

## Overview

This project uses Docker Compose to manage Redis and PostgreSQL services for local development. The setup provides a consistent development environment with persistent data storage.

## Services

### Redis (redis:7-alpine)

- **Purpose**: Session storage and caching
- **Port**: 6379
- **Volume**: `redis_data` for data persistence
- **Health Check**: Redis ping command
- **Configuration**: Append-only file enabled for data durability

### PostgreSQL (postgres:16-alpine)

- **Purpose**: Primary database for user data
- **Port**: 5432
- **Database**: `simplify`
- **Username**: `user`
- **Password**: `password`
- **Volume**: `postgres_data` for data persistence
- **Health Check**: `pg_isready` command
- **Schema Management**: Handled by migration system (not Docker init scripts)

## Database Schema

The database schema is managed through the migration system. Current tables include:

### `users` Table

```sql
- id (SERIAL PRIMARY KEY)
- google_id (VARCHAR UNIQUE) - Google OAuth ID
- email (VARCHAR UNIQUE) - User email
- name (VARCHAR) - Full name
- given_name (VARCHAR) - First name
- family_name (VARCHAR) - Last name
- picture (VARCHAR) - Profile picture URL
- created_at (TIMESTAMP) - Account creation
- updated_at (TIMESTAMP) - Last update (auto-updated)
- last_login (TIMESTAMP) - Last login time
```

### `user_sessions` Table (Optional)

```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK to users.id)
- session_id (VARCHAR UNIQUE) - Session identifier
- created_at (TIMESTAMP) - Session creation
- expires_at (TIMESTAMP) - Session expiration
- user_agent (TEXT) - Browser/client info
- ip_address (INET) - Client IP address
```

## Management Commands

### Using Docker Compose Directly

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop and remove volumes (destroys data)
docker-compose down -v
```

### Using Management Script

```bash
# Start services
./scripts/docker.sh start

# Stop services
./scripts/docker.sh stop

# View status
./scripts/docker.sh status

# View logs
./scripts/docker.sh logs

# Connect to Redis CLI
./scripts/docker.sh redis-cli

# Connect to PostgreSQL
./scripts/docker.sh psql

# Reset database (WARNING: destroys data)
./scripts/docker.sh reset-db

# Clean up everything (WARNING: destroys data)
./scripts/docker.sh clean
```

## Environment Variables

The Docker Compose setup uses these environment variables (with defaults):

```env
# Database Configuration
DB_NAME=simplify          # PostgreSQL database name
DB_USER=user             # PostgreSQL username
DB_PASSWORD=password     # PostgreSQL password
DB_PORT=5432            # PostgreSQL port

# Redis Configuration
REDIS_HOST=localhost     # Redis host
REDIS_PORT=6379         # Redis port
REDIS_PASSWORD=         # Redis password (optional)
REDIS_DB=0              # Redis database number
```

## Data Persistence

Both services use Docker volumes for data persistence:

- **`simplify_redis_data`**: Redis data directory (`/data`)
- **`simplify_postgres_data`**: PostgreSQL data directory (`/var/lib/postgresql/data`)

Data persists between container restarts unless volumes are explicitly removed.

## Health Checks

Both services include health checks:

- **Redis**: `redis-cli ping` every 10 seconds
- **PostgreSQL**: `pg_isready` every 10 seconds

Health status can be viewed with `docker-compose ps` or `./scripts/docker.sh status`.

## Network Configuration

Services run on a custom bridge network `simplify-network` for:

- Service discovery between containers
- Isolation from other Docker projects
- Consistent internal networking

## Development Workflow

1. **First Time Setup**:

   ```bash
   ./scripts/docker.sh start
   ```

2. **Daily Development**:

   ```bash
   # Services auto-start with persistent data
   bun dev
   ```

3. **Debugging**:

   ```bash
   # Check service status
   ./scripts/docker.sh status

   # View logs
   ./scripts/docker.sh logs

   # Connect to services
   ./scripts/docker.sh redis-cli
   ./scripts/docker.sh psql
   ```

4. **Cleanup**:

   ```bash
   # Stop services (keep data)
   ./scripts/docker.sh stop

   # Remove everything (lose data)
   ./scripts/docker.sh clean
   ```

## Integration with Application

### Redis Connection

The application connects to Redis using ioredis:

```typescript
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  // ... other options
});
```

### PostgreSQL Connection (Future)

When implementing PostgreSQL integration:

```typescript
// Using Bun.sql native PostgreSQL driver
const db = new Bun.sql({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "simplify",
  username: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "password",
});
```

## Troubleshooting

### Port Conflicts

If ports 5432 or 6379 are in use:

```bash
# Find what's using the port
lsof -i :5432
lsof -i :6379

# Stop conflicting services
./scripts/docker.sh stop
```

### Data Corruption

If services won't start due to data issues:

```bash
# Reset everything
./scripts/docker.sh clean
./scripts/docker.sh start
```

### Network Issues

If containers can't communicate:

```bash
# Recreate network
docker-compose down
docker-compose up -d
```

## Production Considerations

For production deployment:

- Use managed Redis and PostgreSQL services
- Implement proper backup strategies
- Use secrets management for passwords
- Configure SSL/TLS connections
- Set up monitoring and alerting
- Use connection pooling for database connections
