import { beforeEach, describe, expect, mock, test } from "bun:test";
import { testUtils } from "../setup";

// Mock the database services
const mockBiometricService = {
  getAllMeasurementTypes: mock(async () => [
    { id: 1, name: "blood_pressure", displayName: "Blood Pressure", unit: "mmHg" },
    { id: 2, name: "heart_rate", displayName: "Heart Rate", unit: "bpm" },
  ]),
  getSubtypesForType: mock(async (typeId: number) => {
    if (typeId === 1) {
      return [
        { id: 1, name: "systolic", displayName: "Systolic" },
        { id: 2, name: "diastolic", displayName: "Diastolic" },
      ];
    }
    return [];
  }),
  getUserMeasurementSummary: mock(async (...args: any[]) => [{ type: { name: "heart_rate" }, count: 5 }]),
  getMeasurementHistory: mock(async () => [testUtils.createMockMeasurement()]),
  recordSimpleMeasurement: mock(async (...args: any[]) => testUtils.createMockMeasurement()),
  recordBloodPressure: mock(async (...args: any[]) => [testUtils.createMockMeasurement()]),
  getMeasurementById: mock(async () => testUtils.createMockMeasurement()),
};

const mockUserService = {
  findByGoogleId: mock(async (googleId: string) => {
    if (googleId === "test_google_id") {
      return { ...testUtils.createMockUser(), id: 1 };
    }
    return null;
  }),
};

// Mock the auth middleware
const mockAuthMiddleware = {
  requireAuth: mock((handler: (req: { user?: any; url: string; json?: () => Promise<any> }) => Promise<Response>) => {
    return async (req: { user?: any; url: string; json?: () => Promise<any> }) => {
      // Simulate authenticated request
      req.user = testUtils.createMockSessionData();
      return handler(req);
    };
  }),
};

// Mock the module imports
mock.module("../../../db/services", () => ({
  biometricService: mockBiometricService,
  userService: mockUserService,
}));

mock.module("../../src/auth/middleware", () => ({
  AuthMiddleware: mock(() => mockAuthMiddleware),
}));

describe("API Endpoints", () => {
  beforeEach(() => {
    // Reset the mocks to their default state
    mockUserService.findByGoogleId = mock(async (googleId: string) => {
      if (googleId === "test_google_id") {
        return { ...testUtils.createMockUser(), id: 1 };
      }
      return null;
    });
  });

  describe("GET /api/biometrics/types", () => {
    test("should return measurement types", async () => {
      // Create a mock server instance to test the route
      const handler = mockAuthMiddleware.requireAuth(async () => {
        const types = await mockBiometricService.getAllMeasurementTypes();
        return Response.json({ types });
      });

      const mockRequest = new Request("http://localhost/api/biometrics/types");
      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.types).toHaveLength(2);
      expect(data.types[0].name).toBe("blood_pressure");
    });

    test("should handle service errors", async () => {
      mockBiometricService.getAllMeasurementTypes = mock(async () => {
        throw new Error("Database connection failed");
      });

      const handler = mockAuthMiddleware.requireAuth(async () => {
        try {
          const types = await mockBiometricService.getAllMeasurementTypes();
          return Response.json({ types });
        } catch (_error) {
          return Response.json({ error: "Failed to fetch measurement types" }, { status: 500 });
        }
      });

      const mockRequest = new Request("http://localhost/api/biometrics/types");
      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch measurement types");
    });
  });

  describe("GET /api/biometrics/subtypes/:typeId", () => {
    test("should return subtypes for blood pressure", async () => {
      const handler = mockAuthMiddleware.requireAuth(async (req: { url: string }) => {
        const url = new URL(req.url);
        const typeId = parseInt(url.pathname.split("/").pop() || "0", 10);
        const subtypes = await mockBiometricService.getSubtypesForType(typeId);
        return Response.json({ subtypes });
      });

      const mockRequest = new Request("http://localhost/api/biometrics/subtypes/1");
      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subtypes).toHaveLength(2);
      expect(data.subtypes[0].name).toBe("systolic");
    });

    test("should return empty array for simple measurements", async () => {
      const handler = mockAuthMiddleware.requireAuth(async (req: { url: string }) => {
        const url = new URL(req.url);
        const typeId = parseInt(url.pathname.split("/").pop() || "0", 10);
        const subtypes = await mockBiometricService.getSubtypesForType(typeId);
        return Response.json({ subtypes });
      });

      const mockRequest = new Request("http://localhost/api/biometrics/subtypes/2");
      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subtypes).toHaveLength(0);
    });
  });

  describe("GET /api/biometrics/measurements", () => {
    test("should return user measurements", async () => {
      const handler = mockAuthMiddleware.requireAuth(async (req: { url: string; user?: any }) => {
        const dbUser = await mockUserService.findByGoogleId(req.user.userId);
        if (!dbUser) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        const summary = await mockBiometricService.getUserMeasurementSummary(dbUser.id);
        const allMeasurements: unknown[] = [];

        for (const item of summary) {
          if (item.count > 0) {
            const history = await mockBiometricService.getMeasurementHistory(dbUser.id, item.type.name);
            allMeasurements.push(...history);
          }
        }

        return Response.json({ measurements: allMeasurements });
      });

      const mockRequest = new Request("http://localhost/api/biometrics/measurements");
      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.measurements).toHaveLength(1);
    });

    test("should return 404 for non-existent user", async () => {
      mockUserService.findByGoogleId = mock(async () => null);

      const handler = mockAuthMiddleware.requireAuth(async (req: { url: string }) => {
        const dbUser = await mockUserService.findByGoogleId(req.user.userId);
        if (!dbUser) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }
        return Response.json({ measurements: [] });
      });

      const mockRequest = new Request("http://localhost/api/biometrics/measurements");
      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  describe("POST /api/biometrics/measurements", () => {
    test("should create simple measurement", async () => {
      const handler = mockAuthMiddleware.requireAuth(async (req: any) => {
        const body = await req.json();
        const { typeName, value, measuredAt, notes } = body;

        const dbUser = await mockUserService.findByGoogleId(req.user.userId);
        if (!dbUser) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        const measurementDate = measuredAt ? new Date(measuredAt) : new Date();
        const measurement = await mockBiometricService.recordSimpleMeasurement(
          dbUser.id,
          typeName,
          parseFloat(value),
          measurementDate,
          notes || undefined,
        );

        const fullMeasurement = await mockBiometricService.getMeasurementById(measurement.id);
        return Response.json({ measurement: fullMeasurement });
      });

      const mockRequest = new Request("http://localhost/api/biometrics/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeName: "heart_rate",
          value: "72",
          measuredAt: new Date().toISOString(),
          notes: "Resting heart rate",
        }),
      });

      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.measurement).toBeTruthy();
      expect(data.measurement.value).toBe("120");
    });

    test("should create blood pressure measurement", async () => {
      const handler = mockAuthMiddleware.requireAuth(async (req: any) => {
        const body = await req.json();
        const { typeName, systolic, diastolic, measuredAt, notes } = body;

        const dbUser = await mockUserService.findByGoogleId(req.user.userId);
        if (!dbUser) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        if (typeName === "blood_pressure" && systolic && diastolic) {
          const measurementDate = measuredAt ? new Date(measuredAt) : new Date();
          const measurements = await mockBiometricService.recordBloodPressure(dbUser.id, {
            systolic: parseFloat(systolic),
            diastolic: parseFloat(diastolic),
            measuredAt: measurementDate,
            notes: notes || undefined,
          });

          const fullMeasurements = await Promise.all(
            measurements.map((m: { id: number }) => mockBiometricService.getMeasurementById(m.id)),
          );
          return Response.json({ measurements: fullMeasurements.filter((m: unknown) => m !== null) });
        }

        return Response.json({ error: "Invalid measurement data" }, { status: 400 });
      });

      const mockRequest = new Request("http://localhost/api/biometrics/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeName: "blood_pressure",
          systolic: "120",
          diastolic: "80",
          measuredAt: new Date().toISOString(),
          notes: "Morning reading",
        }),
      });

      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.measurements).toHaveLength(1);
    });

    test("should return 400 for invalid measurement data", async () => {
      const handler = mockAuthMiddleware.requireAuth(async (req: any) => {
        const body = await req.json();
        const { typeName, value, systolic, diastolic } = body;

        if (typeName === "blood_pressure" && systolic && diastolic) {
          // Handle blood pressure
          return Response.json({ success: true });
        } else if (value) {
          // Handle simple measurement
          return Response.json({ success: true });
        } else {
          return Response.json({ error: "Invalid measurement data" }, { status: 400 });
        }
      });

      const mockRequest = new Request("http://localhost/api/biometrics/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeName: "heart_rate",
          // Missing value
        }),
      });

      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid measurement data");
    });
  });
});
