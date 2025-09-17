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
          const body = await req.json();
          const { typeName, value, systolic, diastolic, measuredAt, notes } = body;

          // Get database user ID from Google ID
          const dbUser = await userService.findByGoogleId(req.user.userId);
          if (!dbUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          const measurementDate = measuredAt ? new Date(measuredAt) : new Date();

          if (typeName === "blood_pressure" && systolic && diastolic) {
            // Blood pressure measurement
            const measurements = await biometricService.recordBloodPressure(dbUser.id, {
              systolic: parseFloat(systolic),
              diastolic: parseFloat(diastolic),
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
          console.error("Error adding measurement:", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Failed to add measurement" },
            { status: 500 },
          );
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
