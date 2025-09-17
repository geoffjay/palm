import { describe, expect, test } from "bun:test";
import { testUtils } from "./setup";

describe("Basic Tests", () => {
  test("should pass a simple test", () => {
    expect(1 + 1).toBe(2);
  });

  test("should create mock user data", () => {
    const user = testUtils.createMockUser();
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Test User");
  });

  test("should create mock session data", () => {
    const session = testUtils.createMockSessionData();
    expect(session.userId).toBe("test_google_id");
    expect(session.accessToken).toBe("mock_access_token");
  });

  test("should create mock measurement data", () => {
    const measurement = testUtils.createMockMeasurement();
    expect(measurement.value).toBe("120");
    expect(measurement.userId).toBe(1);
  });

  test("should have environment variables set", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.GOOGLE_CLIENT_ID).toBe("test_client_id");
  });
});
