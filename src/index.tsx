import { serve } from "bun";

import { OAuthHandlers } from "./auth/handlers";
import type { AuthenticatedRequest } from "./auth/middleware";
import { AuthMiddleware } from "./auth/middleware";
import { validateBody, handleValidationError } from "./middleware/validation";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { authRateLimit, apiRateLimit, syncRateLimit } from "./middleware/rateLimiters";
import { securityHeaders } from "./middleware/security";
import { createMeasurementSchema } from "./validation/schemas";
import index from "./index.html";

// Initialize authentication components
const oauthHandlers = new OAuthHandlers();
const authMiddleware = new AuthMiddleware();

// Cache to prevent duplicate authorization code usage
const usedAuthCodes = new Set<string>();

// Clear cache on startup (helpful for development)
usedAuthCodes.clear();

// Helper to wrap handlers with security headers
const withSecurity = (handler: (req: Request) => Promise<Response>) => {
  return async (req: Request) => {
    const response = await handler(req);
    return securityHeaders(response);
  };
};

const server = serve({
  routes: {
    // Authentication routes with rate limiting (must come before catch-all)
    "/auth/google": {
      GET: withSecurity(async (req: Request) => {
        const rateLimitResponse = await rateLimitMiddleware(authRateLimit)(req);
        if (rateLimitResponse) return rateLimitResponse;
        return oauthHandlers.initiateGoogleAuth(req);
      }),
    },

    "/auth/google/callback": {
      GET: withSecurity(async (req: Request) => {
        const rateLimitResponse = await rateLimitMiddleware(authRateLimit)(req);
        if (rateLimitResponse) return rateLimitResponse;
        return oauthHandlers.handleGoogleCallback(req);
      }),
    },

    "/auth/logout": {
      POST: withSecurity(async (req: AuthenticatedRequest) => {
        const rateLimitResponse = await rateLimitMiddleware(apiRateLimit)(req);
        if (rateLimitResponse) return rateLimitResponse;
        return oauthHandlers.handleLogout(req);
      }),
    },

    "/auth/user": {
      GET: withSecurity(async (req: AuthenticatedRequest) => {
        const rateLimitResponse = await rateLimitMiddleware(apiRateLimit)(req);
        if (rateLimitResponse) return rateLimitResponse;
        return oauthHandlers.getCurrentUser(req);
      }),
    },

    "/auth/refresh": {
      POST: withSecurity(async (req: AuthenticatedRequest) => {
        const rateLimitResponse = await rateLimitMiddleware(authRateLimit)(req);
        if (rateLimitResponse) return rateLimitResponse;
        return oauthHandlers.refreshSession(req);
      }),
    },

    // Public API routes
    "/api/hello": {
      async GET(_req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(_req) {
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
      GET: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
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
      GET: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
        return Response.json({
          message: "User settings",
          userId: req.user.userId,
        });
      }),

      PUT: authMiddleware.compose(
        authMiddleware.csrf,
        authMiddleware.requireAuth,
      )(async (req: AuthenticatedRequest) => {
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

    // Biometric API endpoints
    "/api/biometrics/types": {
      GET: authMiddleware.requireAuth(async (_req: AuthenticatedRequest) => {
        const { biometricService } = await import("../db/services");
        try {
          const types = await biometricService.getAllMeasurementTypes();
          return Response.json({ types });
        } catch (error) {
          console.error("Error fetching measurement types:", error);
          return Response.json({ error: "Failed to fetch measurement types" }, { status: 500 });
        }
      }),
    },

    "/api/biometrics/subtypes/:typeId": {
      GET: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
        const { biometricService } = await import("../db/services");
        try {
          const url = new URL(req.url);
          const typeId = parseInt(url.pathname.split("/").pop() || "0", 10);
          const subtypes = await biometricService.getSubtypesForType(typeId);
          return Response.json({ subtypes });
        } catch (error) {
          console.error("Error fetching measurement subtypes:", error);
          return Response.json({ error: "Failed to fetch measurement subtypes" }, { status: 500 });
        }
      }),
    },

    "/api/biometrics/measurements": {
      GET: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
        const { biometricService, userService } = await import("../db/services");
        try {
          // Get database user ID from Google ID
          const dbUser = await userService.findByGoogleId(req.user.userId);
          if (!dbUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          const summary = await biometricService.getUserMeasurementSummary(dbUser.id);
          const allMeasurements = [];

          // Load detailed history for each type that has measurements
          for (const item of summary) {
            if (item.count > 0) {
              const history = await biometricService.getMeasurementHistory(
                dbUser.id,
                item.type.name,
                undefined, // start date
                undefined, // end date
                50, // limit to recent 50 measurements per type
              );
              allMeasurements.push(...history);
            }
          }

          // Sort by measured date, newest first
          allMeasurements.sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());

          return Response.json({ measurements: allMeasurements });
        } catch (error) {
          console.error("Error fetching measurements:", error);
          return Response.json({ error: "Failed to fetch measurements" }, { status: 500 });
        }
      }),
      POST: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
        const { biometricService, userService } = await import("../db/services");
        try {
          // Validate request body
          const validatedData = await validateBody(createMeasurementSchema)(req);
          const { typeName, value, systolic, diastolic, measuredAt, notes } = validatedData;

          // Get database user ID from Google ID
          const dbUser = await userService.findByGoogleId(req.user.userId);
          if (!dbUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          const measurementDate = measuredAt || new Date();

          if (typeName === "blood_pressure" && systolic !== undefined && diastolic !== undefined) {
            // Blood pressure measurement (values already validated and converted by Zod)
            const measurements = await biometricService.recordBloodPressure(dbUser.id, {
              systolic,
              diastolic,
              measuredAt: measurementDate,
              notes: notes || undefined,
            });

            // Get the full measurement details with type information
            const fullMeasurements = await Promise.all(
              measurements.map((m) => biometricService.getMeasurementById(m.id)),
            );
            return Response.json({ measurements: fullMeasurements.filter((m) => m !== null) });
          } else if (value) {
            // Simple measurement
            const measurement = await biometricService.recordSimpleMeasurement(
              dbUser.id,
              typeName,
              parseFloat(value),
              measurementDate,
              notes || undefined,
            );

            // Get the full measurement details with type information
            const fullMeasurement = await biometricService.getMeasurementById(measurement.id);
            return Response.json({ measurement: fullMeasurement });
          } else {
            return Response.json({ error: "Invalid measurement data" }, { status: 400 });
          }
        } catch (error) {
          // Handle validation errors
          if (error instanceof Error && error.name === "ValidationError") {
            return handleValidationError(error);
          }
          console.error("Error adding measurement:", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Failed to add measurement" },
            { status: 500 },
          );
        }
      }),
    },

    // Data source integration endpoints
    "/api/integrations": {
      GET: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
        const { IntegrationService } = await import("./integrations/integrationService");
        const integrationService = new IntegrationService();

        try {
          const available = integrationService.getAvailableIntegrations();
          const { userService } = await import("../db/services");
          const dbUser = await userService.findByGoogleId(req.user?.userId || "");

          if (!dbUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          const connected = await integrationService.getUserConnections(dbUser.id);

          return Response.json({
            available,
            connected: connected.map((conn) => ({
              id: conn.id,
              providerId: conn.providerId,
              isActive: conn.isActive,
              connectedAt: conn.connectedAt,
              lastSyncAt: conn.lastSyncAt,
              syncStatus: conn.syncStatus,
            })),
          });
        } catch (error) {
          console.error("Error fetching integrations:", error);
          return Response.json({ error: "Failed to fetch integrations" }, { status: 500 });
        }
      }),
    },

    "/api/integrations/:providerId/connect": {
      POST: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
        const { IntegrationService } = await import("./integrations/integrationService");
        const integrationService = new IntegrationService();

        try {
          const url = new URL(req.url);
          const providerId = url.pathname.split("/")[3]; // Extract providerId from path
          const { userService } = await import("../db/services");
          const dbUser = await userService.findByGoogleId(req.user?.userId || "");

          if (!dbUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          const authUrl = await integrationService.initiateConnection(dbUser.id, providerId);

          return Response.json({ authUrl });
        } catch (error) {
          console.error("Error initiating connection:", error);
          return Response.json({ error: "Failed to initiate connection" }, { status: 500 });
        }
      }),
    },

    "/api/integrations/:providerId/callback": {
      GET: async (req: Request) => {
        const { IntegrationService } = await import("./integrations/integrationService");
        const integrationService = new IntegrationService();

        try {
          const url = new URL(req.url);
          const providerId = url.pathname.split("/")[3]; // Extract providerId from path
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state"); // userId
          const error = url.searchParams.get("error");

          console.log("🔄 Integration callback received:", {
            providerId,
            hasCode: !!code,
            codePrefix: code?.substring(0, 20) + "...",
            state,
            hasError: !!error,
            fullUrl: req.url,
          });

          if (error) {
            console.error("Integration OAuth error:", error);
            return new Response(null, {
              status: 302,
              headers: {
                Location: `${process.env.FRONTEND_URL || server.url.toString()}/settings?integration=error&message=${encodeURIComponent("Integration failed")}`,
              },
            });
          }

          if (!code || !state) {
            return new Response(null, {
              status: 302,
              headers: {
                Location: `${process.env.FRONTEND_URL || server.url.toString()}/settings?integration=error&message=${encodeURIComponent("Missing authorization code")}`,
              },
            });
          }

          // Check if this authorization code has already been used
          if (usedAuthCodes.has(code)) {
            console.log("⚠️ Authorization code already used, ignoring duplicate request");
            const baseUrl = process.env.FRONTEND_URL || server.url.toString();
            const redirectUrl = `${baseUrl}/integrations?integration=success&provider=${providerId}`;
            console.log("🔄 Redirecting to:", redirectUrl);
            return new Response(null, {
              status: 302,
              headers: {
                Location: redirectUrl,
              },
            });
          }

          // Mark this code as used
          usedAuthCodes.add(code);

          // Clean up old codes (keep only last 100 to prevent memory leak)
          if (usedAuthCodes.size > 100) {
            const codesArray = Array.from(usedAuthCodes);
            usedAuthCodes.clear();
            codesArray.slice(-50).forEach((c) => usedAuthCodes.add(c));
          }

          const userId = parseInt(state, 10);
          await integrationService.handleCallback(code, providerId, userId);

          return new Response(null, {
            status: 302,
            headers: {
              Location: `${process.env.FRONTEND_URL || server.url.toString()}/integrations?integration=success&provider=${providerId}`,
            },
          });
        } catch (error) {
          console.error("Integration callback error:", error);
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${process.env.FRONTEND_URL || server.url.toString()}/integrations?integration=error&message=${encodeURIComponent("Connection failed")}`,
            },
          });
        }
      },
    },

    "/api/integrations/:connectionId/sync": {
      POST: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
        // Apply strict rate limiting for expensive sync operations
        const rateLimitResponse = await rateLimitMiddleware(syncRateLimit)(req);
        if (rateLimitResponse) return rateLimitResponse;

        const { IntegrationService } = await import("./integrations/integrationService");
        const integrationService = new IntegrationService();

        try {
          const url = new URL(req.url);
          const connectionId = parseInt(url.pathname.split("/")[3], 10);
          const { userService } = await import("../db/services");
          const dbUser = await userService.findByGoogleId(req.user?.userId || "");

          if (!dbUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          const dataPoints = await integrationService.syncConnection(connectionId);
          await integrationService.saveBiometricData(dbUser.id, dataPoints);

          return Response.json({
            success: true,
            dataPointsCount: dataPoints.length,
            message: `Imported ${dataPoints.length} data points`,
          });
        } catch (error) {
          console.error("Error syncing connection:", error);
          return Response.json({ error: "Failed to sync data" }, { status: 500 });
        }
      }),
    },

    "/api/integrations/:connectionId/disconnect": {
      DELETE: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
        const { IntegrationService } = await import("./integrations/integrationService");
        const integrationService = new IntegrationService();

        try {
          const url = new URL(req.url);
          const connectionId = parseInt(url.pathname.split("/")[3], 10);
          const { userService } = await import("../db/services");
          const dbUser = await userService.findByGoogleId(req.user?.userId || "");

          if (!dbUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          await integrationService.disconnectSource(connectionId, dbUser.id);

          return Response.json({ success: true, message: "Integration disconnected" });
        } catch (error) {
          console.error("Error disconnecting integration:", error);
          return Response.json({ error: "Failed to disconnect integration" }, { status: 500 });
        }
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
