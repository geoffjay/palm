import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { logger, sanitizeForLogging, isSensitive } from "../../src/utils/logger";

describe("Logger Utilities", () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleDebug: typeof console.debug;

  beforeEach(() => {
    // Save original console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalConsoleDebug = console.debug;

    // Mock console methods
    console.log = mock(() => {});
    console.error = mock(() => {});
    console.warn = mock(() => {});
    console.debug = mock(() => {});
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.debug = originalConsoleDebug;
  });

  describe("sanitizeForLogging", () => {
    test("should redact password field", () => {
      const data = { username: "user123", password: "secret123" };
      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.username).toBe("user123");
      expect(sanitized.password).toBe("[REDACTED]");
    });

    test("should redact access token", () => {
      const data = { userId: "123", accessToken: "sensitive_token_abc" };
      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.userId).toBe("123");
      expect(sanitized.accessToken).toBe("[REDACTED]");
    });

    test("should redact refresh token", () => {
      const data = { refreshToken: "refresh_abc123" };
      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.refreshToken).toBe("[REDACTED]");
    });

    test("should redact authorization code", () => {
      const data = { code: "auth_code_xyz" };
      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.code).toBe("[REDACTED]");
    });

    test("should redact API keys", () => {
      const data = { apiKey: "sk_live_abc123", clientSecret: "secret_xyz" };
      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.clientSecret).toBe("[REDACTED]");
    });

    test("should redact session ID", () => {
      const data = { sessionId: "session_abc123" };
      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.sessionId).toBe("[REDACTED]");
    });

    test("should handle nested objects", () => {
      const data = {
        user: {
          id: "123",
          email: "test@example.com",
          settings: {
            password: "secret",
            apiKey: "key123",
            theme: "dark",
          },
        },
      };

      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.user.id).toBe("123");
      expect(sanitized.user.email).toBe("test@example.com");
      expect(sanitized.user.settings.password).toBe("[REDACTED]");
      expect(sanitized.user.settings.apiKey).toBe("[REDACTED]");
      expect(sanitized.user.settings.theme).toBe("dark");
    });

    test("should handle arrays", () => {
      const data = {
        tokens: [
          { type: "access", token: "access_token_123" },
          { type: "refresh", token: "refresh_token_456" },
        ],
      };

      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.tokens[0].type).toBe("access");
      expect(sanitized.tokens[0].token).toBe("[REDACTED]");
      expect(sanitized.tokens[1].type).toBe("refresh");
      expect(sanitized.tokens[1].token).toBe("[REDACTED]");
    });

    test("should handle null and undefined", () => {
      expect(sanitizeForLogging(null)).toBeNull();
      expect(sanitizeForLogging(undefined)).toBeUndefined();
    });

    test("should handle primitive values", () => {
      expect(sanitizeForLogging("string")).toBe("string");
      expect(sanitizeForLogging(123)).toBe(123);
      expect(sanitizeForLogging(true)).toBe(true);
    });

    test("should redact fields with underscores and hyphens", () => {
      const data = {
        access_token: "token123",
        "refresh-token": "refresh123",
        client_secret: "secret123",
      };

      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.access_token).toBe("[REDACTED]");
      expect(sanitized["refresh-token"]).toBe("[REDACTED]");
      expect(sanitized.client_secret).toBe("[REDACTED]");
    });

    test("should not redact non-sensitive fields", () => {
      const data = {
        userId: "123",
        email: "test@example.com",
        name: "John Doe",
        timestamp: Date.now(),
      };

      const sanitized = sanitizeForLogging(data) as any;

      expect(sanitized.userId).toBe("123");
      expect(sanitized.email).toBe("test@example.com");
      expect(sanitized.name).toBe("John Doe");
      expect(sanitized.timestamp).toBe(data.timestamp);
    });
  });

  describe("isSensitive", () => {
    test("should identify password as sensitive", () => {
      expect(isSensitive("password")).toBe(true);
      expect(isSensitive("PASSWORD")).toBe(true);
    });

    test("should identify tokens as sensitive", () => {
      expect(isSensitive("token")).toBe(true);
      expect(isSensitive("accessToken")).toBe(true);
      expect(isSensitive("refreshToken")).toBe(true);
      expect(isSensitive("idToken")).toBe(true);
    });

    test("should identify secrets as sensitive", () => {
      expect(isSensitive("secret")).toBe(true);
      expect(isSensitive("clientSecret")).toBe(true);
      expect(isSensitive("apiSecret")).toBe(true);
    });

    test("should identify keys as sensitive", () => {
      expect(isSensitive("apiKey")).toBe(true);
      expect(isSensitive("privateKey")).toBe(true);
    });

    test("should identify auth-related fields as sensitive", () => {
      expect(isSensitive("authorization")).toBe(true);
      expect(isSensitive("cookie")).toBe(true);
      expect(isSensitive("sessionId")).toBe(true);
    });

    test("should not identify non-sensitive fields", () => {
      expect(isSensitive("userId")).toBe(false);
      expect(isSensitive("email")).toBe(false);
      expect(isSensitive("name")).toBe(false);
      expect(isSensitive("timestamp")).toBe(false);
    });
  });

  describe("logger.info", () => {
    test("should log message without metadata", () => {
      logger.info("Test message");

      expect(console.log).toHaveBeenCalledWith("Test message");
    });

    test("should log message with sanitized metadata", () => {
      logger.info("User login", { userId: "123", password: "secret" });

      expect(console.log).toHaveBeenCalled();
      const call = (console.log as any).mock.calls[0];
      expect(call[0]).toBe("User login");
      expect(call[1].userId).toBe("123");
      expect(call[1].password).toBe("[REDACTED]");
    });
  });

  describe("logger.error", () => {
    test("should log error with stack trace", () => {
      const error = new Error("Test error");
      logger.error("Something failed", error);

      expect(console.error).toHaveBeenCalled();
      const call = (console.error as any).mock.calls[0];
      expect(call[0]).toBe("Something failed");
      expect(call[1]).toBe("Test error");
    });

    test("should sanitize metadata in error logs", () => {
      logger.error("Auth failed", null, { token: "abc123", userId: "123" });

      expect(console.error).toHaveBeenCalled();
      const call = (console.error as any).mock.calls[0];
      expect(call[2].token).toBe("[REDACTED]");
      expect(call[2].userId).toBe("123");
    });
  });

  describe("logger.warn", () => {
    test("should log warning with sanitized metadata", () => {
      logger.warn("Deprecated API", { apiKey: "old_key", method: "GET" });

      expect(console.warn).toHaveBeenCalled();
      const call = (console.warn as any).mock.calls[0];
      expect(call[1].apiKey).toBe("[REDACTED]");
      expect(call[1].method).toBe("GET");
    });
  });

  describe("logger.debug", () => {
    test("should only log in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      logger.debug("Debug message", { detail: "info" });

      expect(console.debug).toHaveBeenCalledWith("Debug message", { detail: "info" });

      process.env.NODE_ENV = originalEnv;
    });

    test("should not log in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      const originalDebug = process.env.DEBUG;
      process.env.NODE_ENV = "production";
      delete process.env.DEBUG;

      logger.debug("Debug message", { detail: "info" });

      expect(console.debug).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      if (originalDebug) process.env.DEBUG = originalDebug;
    });

    test("should sanitize metadata in debug logs", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      logger.debug("OAuth flow", { state: "abc123", token: "secret_token" });

      expect(console.debug).toHaveBeenCalled();
      const call = (console.debug as any).mock.calls[0];
      expect(call[1].state).toBe("abc123");
      expect(call[1].token).toBe("[REDACTED]");

      process.env.NODE_ENV = originalEnv;
    });
  });
});
