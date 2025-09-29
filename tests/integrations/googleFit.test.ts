/**
 * Tests for Google Fit integration
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { GoogleFitIntegration } from "../../src/integrations/googleFit";

// Mock environment variables
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.BASE_URL = "https://test.example.com";

describe("GoogleFitIntegration", () => {
  let integration: GoogleFitIntegration;

  beforeEach(() => {
    integration = new GoogleFitIntegration();
  });

  describe("authenticate", () => {
    it("should generate correct OAuth URL", async () => {
      const userId = "123";
      const authUrl = await integration.authenticate(userId);

      expect(authUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(authUrl).toContain("client_id=test-client-id");
      expect(authUrl).toContain("redirect_uri=https%3A%2F%2Ftest.example.com%2Fintegrations%2Fgoogle-fit%2Fcallback");
      expect(authUrl).toContain("state=123");
      expect(authUrl).toContain("scope=");
      expect(authUrl).toContain("fitness.activity.read");
      expect(authUrl).toContain("fitness.body.read");
      expect(authUrl).toContain("fitness.heart_rate.read");
    });
  });

  describe("handleCallback", () => {
    it("should handle successful OAuth callback", async () => {
      // Mock the token exchange
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: "test-access-token",
              refresh_token: "test-refresh-token",
              expires_in: 3600,
              token_type: "Bearer",
            }),
        }),
      );
      global.fetch = mockFetch as any;

      const connection = await integration.handleCallback("test-code", "123");

      expect(connection.userId).toBe("123");
      expect(connection.providerId).toBe("google_fit");
      expect(connection.accessToken).toBe("test-access-token");
      expect(connection.refreshToken).toBe("test-refresh-token");
      expect(connection.isActive).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("https://oauth2.googleapis.com/token", expect.any(Object));
    });

    it("should handle token exchange failure", async () => {
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: false,
          statusText: "Bad Request",
        }),
      );
      global.fetch = mockFetch as any;

      await expect(integration.handleCallback("invalid-code", "123")).rejects.toThrow(
        "Token exchange failed: Bad Request",
      );
    });
  });

  describe("convertGoogleFitData", () => {
    it("should convert step count data correctly", () => {
      const mockData = {
        bucket: [
          {
            dataset: [
              {
                point: [
                  {
                    startTimeNanos: "1640995200000000000", // 2022-01-01 00:00:00
                    endTimeNanos: "1641081600000000000", // 2022-01-02 00:00:00
                    value: [{ intVal: 10000 }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = (integration as any).convertGoogleFitData(mockData, "com.google.step_count.delta");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "steps",
        value: 10000,
        unit: "count",
        timestamp: new Date(1640995200000),
        source: "google_fit",
      });
    });

    it("should convert heart rate data correctly", () => {
      const mockData = {
        bucket: [
          {
            dataset: [
              {
                point: [
                  {
                    startTimeNanos: "1640995200000000000",
                    endTimeNanos: "1640995260000000000",
                    value: [{ fpVal: 72.5 }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = (integration as any).convertGoogleFitData(mockData, "com.google.heart_rate.bpm");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "heart_rate",
        value: 72.5,
        unit: "bpm",
        timestamp: new Date(1640995200000),
        source: "google_fit",
      });
    });

    it("should handle empty data", () => {
      const mockData = { bucket: [] };
      const result = (integration as any).convertGoogleFitData(mockData, "com.google.step_count.delta");
      expect(result).toHaveLength(0);
    });
  });
});
