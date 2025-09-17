import { beforeEach, describe, expect, mock, test } from "bun:test";
import { testUtils } from "../setup";

// Mock Redis
const mockRedis = {
  set: mock(async () => "OK"),
  get: mock(async (key: string) => {
    if (key.includes("test_session")) {
      return JSON.stringify(testUtils.createMockSessionData());
    }
    return null;
  }),
  del: mock(async () => 1),
  exists: mock(async () => 1),
  expire: mock(async () => 1),
  disconnect: mock(async () => {}),
};

// Mock Redis constructor
mock.module("ioredis", () => ({
  default: mock(() => mockRedis),
}));

describe("SessionManager", () => {
  let SessionManager: { new (): unknown };

  beforeEach(async () => {
    mock.restore();
    const module = await import("../../src/auth/session");
    SessionManager = module.SessionManager;
  });

  test("constructor - should initialize Redis connection", () => {
    const sessionManager = new SessionManager();
    expect(sessionManager).toBeTruthy();
  });

  test("createSession - should create new session", async () => {
    const sessionManager = new SessionManager();
    const sessionData = testUtils.createMockSessionData();

    const sessionId = await sessionManager.createSession(sessionData);

    expect(sessionId).toBeTruthy();
    expect(sessionId).toHaveLength(32); // UUID without hyphens
  });

  test("getSession - should retrieve existing session", async () => {
    const sessionManager = new SessionManager();
    const session = await sessionManager.getSession("test_session_id");

    expect(session).toBeTruthy();
    expect(session?.userId).toBe("test_google_id");
    expect(session?.email).toBe("test@example.com");
  });

  test("getSession - should return null for non-existent session", async () => {
    mockRedis.get = mock(async () => null);

    const sessionManager = new SessionManager();
    const session = await sessionManager.getSession("non_existent_session");

    expect(session).toBeNull();
  });

  test("updateSession - should update existing session", async () => {
    const sessionManager = new SessionManager();
    const updates = { lastActivity: Date.now() + 1000 };

    const result = await sessionManager.updateSession("test_session_id", updates);

    expect(result).toBe(true);
  });

  test("deleteSession - should delete session", async () => {
    const sessionManager = new SessionManager();

    const result = await sessionManager.deleteSession("test_session_id");

    expect(result).toBe(true);
  });

  test("validateSession - should validate active session", async () => {
    const sessionManager = new SessionManager();

    const isValid = await sessionManager.validateSession("test_session_id");

    expect(isValid).toBe(true);
  });

  test("validateSession - should reject expired session", async () => {
    const expiredSessionData = {
      ...testUtils.createMockSessionData(),
      createdAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    };
    mockRedis.get = mock(async () => JSON.stringify(expiredSessionData));

    const sessionManager = new SessionManager();
    const isValid = await sessionManager.validateSession("expired_session");

    expect(isValid).toBe(false);
  });

  test("extractSessionId - should extract session ID from cookie", () => {
    const sessionManager = new SessionManager();
    const mockRequest = {
      headers: {
        get: (name: string) => {
          if (name === "cookie") {
            return "session_id=test_session_123; other_cookie=value";
          }
          return null;
        },
      },
    } as Request;

    const sessionId = sessionManager.extractSessionId(mockRequest);

    expect(sessionId).toBe("test_session_123");
  });

  test("extractSessionId - should return null if no session cookie", () => {
    const sessionManager = new SessionManager();
    const mockRequest = {
      headers: {
        get: () => null,
      },
    } as Request;

    const sessionId = sessionManager.extractSessionId(mockRequest);

    expect(sessionId).toBeNull();
  });
});
