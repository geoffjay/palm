# Development Setup Guide

## Prerequisites

- Bun (managed via asdf)
- Docker (for Redis)
- Google Cloud Platform account (for OAuth)

## Quick Start

1. **Install Dependencies**

   ```bash
   bun install
   ```

2. **Start Services (Redis & PostgreSQL)**

   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d

   # Or use the management script
   ./scripts/docker.sh start

   # Alternative: Start Redis only
   docker run -d -p 6379:6379 --name simplify-redis redis:alpine
   ```

3. **Create Environment File**
   Create a `.env` file with the following content:

   ```env
   NODE_ENV=development
   BASE_URL=http://localhost:3000
   FRONTEND_URL=http://localhost:3000

   # Google OAuth Configuration (get from Google Cloud Console)
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0

   # Session Configuration
   SESSION_TTL=86400

   # Development Settings
   DEBUG=true
   LOG_LEVEL=info
   ```

4. **Run Database Migrations**

   ```bash
   bun run migrate:up
   ```

5. **Start Development Server**
   ```bash
   bun dev
   ```

## API Testing

### Public Endpoints

```bash
# Test basic API
curl http://localhost:3000/api/hello

# Check authentication status
curl http://localhost:3000/auth/user
```

### Protected Endpoints

```bash
# This should return 401 without authentication
curl http://localhost:3000/api/user/profile
```

### OAuth Flow

1. Visit `http://localhost:3000/auth/google` in your browser
2. This will redirect to Google OAuth (requires valid credentials)
3. After successful auth, you'll be redirected back with a session

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API and OAuth2 API
4. Create OAuth 2.0 Client IDs
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

## Architecture

- **Frontend**: React v19+ with TypeScript
- **Backend**: Bun.serve() with TypeScript
- **Session Storage**: Redis with ioredis client
- **Authentication**: Google OAuth 2.0
- **Security**: CSRF protection, rate limiting, secure cookies

## Files Structure

```
src/
├── auth/
│   ├── oauth.ts          # Google OAuth implementation
│   ├── session.ts        # Redis session management
│   ├── middleware.ts     # Authentication middleware
│   └── handlers.ts       # OAuth route handlers
├── index.tsx             # Main server file
└── index.html           # Frontend entry point
```

## Docker Services

### Docker Compose

The project includes a `docker-compose.yml` with Redis and PostgreSQL:

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Management Script

Use `./scripts/docker.sh` for easier service management:

```bash
# Start services
./scripts/docker.sh start

# Stop services
./scripts/docker.sh stop

# View status
./scripts/docker.sh status

# Connect to Redis CLI
./scripts/docker.sh redis-cli

# Connect to PostgreSQL
./scripts/docker.sh psql

# Reset database (WARNING: destroys data)
./scripts/docker.sh reset-db
```

### Service Details

- **Redis**: Latest Alpine image on port 6379
- **PostgreSQL**: Version 16 Alpine on port 5432
- **Database**: `simplify`
- **User**: `user`
- **Password**: `password`

## Development Notes

- The server runs on port 3000 by default
- Hot reload is enabled for both frontend and backend
- Redis connection is required for session management
- PostgreSQL is optional but recommended for user data persistence
- OAuth requires valid Google credentials to test fully

## Troubleshooting

### Redis Connection Issues

If you see `ECONNREFUSED 127.0.0.1:6379`, start Redis:

```bash
docker run -d -p 6379:6379 --name simplify-redis redis:alpine
```

### Port Already in Use

If port 3000 is busy:

```bash
pkill -f "bun.*index.tsx"
```

### OAuth Redirect URI Mismatch

Ensure the redirect URI in Google Cloud Console exactly matches:
`http://localhost:3000/auth/google/callback`

## Production Deployment

For production, update:

- Use secure Redis instance
- Set `NODE_ENV=production`
- Configure proper CORS and security headers
- Use HTTPS for all OAuth redirects
- Set secure cookie options
