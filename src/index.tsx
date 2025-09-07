import { serve } from "bun";

import { OAuthHandlers } from "./auth/handlers";
import type { AuthenticatedRequest } from "./auth/middleware";
import { AuthMiddleware } from "./auth/middleware";
import index from "./index.html";

// Initialize authentication components
const oauthHandlers = new OAuthHandlers();
const authMiddleware = new AuthMiddleware();

const server = serve({
  routes: {
    // Authentication routes (must come before catch-all)
    "/auth/google": {
      GET: (req: Request) => oauthHandlers.initiateGoogleAuth(req),
    },

    "/auth/google/callback": {
      GET: (req: Request) => oauthHandlers.handleGoogleCallback(req),
    },

    "/auth/logout": {
      POST: (req: AuthenticatedRequest) => oauthHandlers.handleLogout(req),
    },

    "/auth/user": {
      GET: (req: AuthenticatedRequest) => oauthHandlers.getCurrentUser(req),
    },

    "/auth/refresh": {
      POST: (req: AuthenticatedRequest) => oauthHandlers.refreshSession(req),
    },

    // Public API routes
    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    // Protected API routes
    "/api/user/profile": {
      GET: authMiddleware.requireAuth(async (req: AuthenticatedRequest & { user: any }) => {
        return Response.json({
          message: "User profile data",
          user: {
            id: req.user.userId,
            email: req.user.email,
            name: req.user.name,
            picture: req.user.picture,
          },
        });
      }),
    },

    "/api/user/settings": {
      GET: authMiddleware.requireAuth(async (req: AuthenticatedRequest & { user: any }) => {
        return Response.json({
          message: "User settings",
          userId: req.user.userId,
        });
      }),

      PUT: authMiddleware.compose(
        authMiddleware.csrf,
        authMiddleware.requireAuth,
      )(async (req: AuthenticatedRequest & { user: any }) => {
        const body = await req.json();

        return Response.json({
          message: "Settings updated",
          userId: req.user.userId,
          updates: body,
        });
      }),
    },

    // Rate-limited API endpoint example
    "/api/search": {
      GET: authMiddleware.compose(
        authMiddleware.rateLimit(10, 60000), // 10 requests per minute
        authMiddleware.optionalAuth,
      )(async (req: AuthenticatedRequest) => {
        const url = new URL(req.url);
        const query = url.searchParams.get("q");

        return Response.json({
          message: "Search results",
          query,
          authenticated: !!req.user,
          userId: req.user?.userId,
        });
      }),
    },

    // Serve index.html for all unmatched routes (SPA routing) - must be last
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`📱 Frontend available at ${server.url}`);
console.log(`🔐 OAuth login at ${server.url}auth/google`);
