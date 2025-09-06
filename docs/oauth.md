# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Bun full-stack application.

## Prerequisites

- Google Cloud Platform account
- Redis server running locally or in the cloud
- PostgreSQL database (optional, for user data storage)

## Step 1: Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API
4. Go to "Credentials" in the sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen first if prompted
7. Choose "Web application" as the application type
8. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`

## Step 2: Environment Configuration

1. Copy `env.example` to `.env`:

   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your Google OAuth credentials:

   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   ```

3. Configure other environment variables as needed:
   ```env
   BASE_URL=http://localhost:3000
   FRONTEND_URL=http://localhost:3000
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

## Step 3: Start Required Services

### Redis (using Docker)

```bash
docker run -d -p 6379:6379 redis:alpine
```

### PostgreSQL (using Docker, optional)

```bash
docker run -d \
  -e POSTGRES_DB=simplify \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine
```

## Step 4: Start the Application

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

## Step 5: Test OAuth Flow

1. Open your browser to `http://localhost:3000`
2. Navigate to `http://localhost:3000/auth/google` to start OAuth flow
3. You should be redirected to Google for authentication
4. After successful login, you'll be redirected back to your app

## API Endpoints

### Authentication Endpoints

- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Handle OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/user` - Get current user info
- `POST /auth/refresh` - Refresh session

### Protected API Endpoints

- `GET /api/user/profile` - Get user profile (requires auth)
- `GET /api/user/settings` - Get user settings (requires auth)
- `PUT /api/user/settings` - Update user settings (requires auth + CSRF)

### Public API Endpoints

- `GET /api/hello` - Public hello endpoint
- `GET /api/search` - Search endpoint (rate limited, optional auth)

## Frontend Integration

### Check Authentication Status

```typescript
const checkAuth = async () => {
  const response = await fetch("/auth/user", {
    credentials: "include",
  });
  const data = await response.json();
  return data.user;
};
```

### Make Authenticated Requests

```typescript
const fetchUserProfile = async () => {
  const response = await fetch("/api/user/profile", {
    credentials: "include",
    headers: {
      "X-CSRF-Token": "XMLHttpRequest", // For CSRF protection
    },
  });
  return response.json();
};
```

### Logout

```typescript
const logout = async () => {
  const response = await fetch("/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRF-Token": "XMLHttpRequest",
    },
  });
  return response.json();
};
```

## Security Features

- **Session Management**: Secure sessions stored in Redis with TTL
- **CSRF Protection**: Required for state-changing operations
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Secure Cookies**: HTTP-only, secure cookies in production
- **State Validation**: OAuth state parameter for CSRF protection

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**

   - Check that the redirect URI in Google Cloud Console matches exactly
   - Include protocol (http/https) and port number for localhost

2. **Redis connection errors**

   - Ensure Redis is running on the specified host/port
   - Check Redis credentials if authentication is enabled

3. **Session not persisting**

   - Check that cookies are being sent with requests (`credentials: 'include'`)
   - Verify BASE_URL matches your development server URL

4. **CSRF errors**
   - Include `X-CSRF-Token` or `X-Requested-With` header for POST/PUT/DELETE requests

### Debug Mode

Set `DEBUG=true` in your `.env` file to enable detailed logging.

## Production Deployment

1. Update environment variables for production:

   ```env
   NODE_ENV=production
   BASE_URL=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   SECURE_COOKIES=true
   ```

2. Add production redirect URI to Google Cloud Console

3. Use secure Redis and PostgreSQL instances

4. Consider using Redis Cluster for high availability

5. Set up proper monitoring and logging
