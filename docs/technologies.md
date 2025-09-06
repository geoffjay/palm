# Technology Stack

## Frontend Technologies (Confirmed)

### Core Framework & Runtime

- **React v19+** - UI framework with latest features including concurrent rendering
- **TypeScript** - Type-safe JavaScript development
- **Bun** - Fast JavaScript package manager and runtime
- **Bun Build** - Native bundling and building (replaces Vite for unified tooling)

### Routing & State Management

- **React Router** - Declarative routing for React applications
- **Zustand** - Lightweight state management solution

### Styling & UI

- **Tailwind CSS v4** - Utility-first CSS framework (latest version)
- **Heroicons** - Beautiful hand-crafted SVG icons by Tailwind team
- **Framer Motion** - Production-ready motion library for React animations

### Forms & Validation

- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** - Schema validation library
- **@hookform/resolvers** - Validation resolvers for React Hook Form

### Testing

- **Bun Test** - Built-in testing framework
- **Vitest** - Test runner
- **React Testing Library** - Testing library for React
- **Playwright** - End-to-end testing framework

## Backend Technology (Bun Full Stack)

**Selected: Bun for unified frontend and backend development**

### Why Bun Full Stack

**Advantages:**

- **Unified tooling**: Single runtime for package management, building, testing, and serving
- **Excellent developer experience**: Hot reload for both frontend and backend code
- **High performance**: Fast startup, low memory usage, built-in bundling
- **TypeScript native**: Direct TypeScript execution without compilation steps
- **Modern APIs**: Built-in support for PostgreSQL (`Bun.sql`), Redis (`Bun.redis`), WebSockets
- **Simple deployment**: Single process, single container, fewer moving parts
- **Cost effective**: Reduced infrastructure complexity

**Trade-offs:**

- Newer ecosystem with fewer third-party libraries
- Manual OAuth implementation required (using native fetch API)
- Less community resources compared to mature frameworks

### Backend Architecture

```typescript
// Main server setup with Bun.serve()
import { serve } from "bun";

const server = serve({
  routes: {
    // Frontend routes
    "/*": index, // Serve React app for unmatched routes

    // Authentication routes
    "/auth/google": googleOAuthHandler,
    "/auth/google/callback": googleCallbackHandler,
    "/auth/logout": logoutHandler,

    // API routes
    "/api/user": userApiRoutes,
    "/api/protected/*": authenticatedApiRoutes,
  },

  // WebSocket support for real-time features
  websocket: {
    open: (ws) => handleWebSocketConnection(ws),
    message: (ws, message) => handleWebSocketMessage(ws, message),
    close: (ws) => handleWebSocketClose(ws),
  },

  development: {
    hmr: true, // Hot module reload
    console: true, // Browser console logging
  },
});
```

## Database & Caching

- **PostgreSQL** - Primary database using `Bun.sql` native driver
- **Redis** - Session storage and caching using `Bun.redis` native client

## OAuth Integration Architecture

### Authentication Flow

1. Frontend redirects to `/auth/google` endpoint
2. Backend redirects to Google OAuth with proper parameters
3. Google redirects back to `/auth/google/callback` with authorization code
4. Backend exchanges code for tokens using native fetch API
5. Backend creates user session in Redis with TTL
6. Backend redirects to frontend with session cookie
7. Frontend API requests include session cookie for authentication
8. Backend middleware validates session on protected routes

### Session Management

- Sessions stored in Redis with configurable TTL
- Secure HTTP-only cookies for session tokens
- CSRF protection for state-changing operations
- Session cleanup on logout

### Implementation Strategy

- Use native fetch API for OAuth token exchange
- Implement custom middleware for session validation
- Build reusable authentication abstractions
- Design with potential future migration in mind
