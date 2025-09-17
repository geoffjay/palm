import { beforeEach, describe, expect, mock, test } from "bun:test";
import { testUtils } from "../setup";

// Mock SessionManager
const mockSessionManager = {
  extractSessionId: mock((req: Request) => {
    const cookie = req.headers.get("cookie");
    if (cookie?.includes("session_id=valid_session")) {
      return "valid_session";
    }
    return null;
  }),
  getSession: mock(async (sessionId: string) => {
    if (sessionId === "valid_session") {
      return testUtils.createMockSessionData();
    }
    return null;
  }),
  validateSession: mock(async (sessionId: string) => {
    return sessionId === "valid_session";
  }),
  updateSession: mock(async () => true),
};

mock.module("../../src/auth/session", () => ({
  SessionManager: mock(() => mockSessionManager),
}));

describe("AuthMiddleware", () => {
  let AuthMiddleware: { new (): unknown };

  beforeEach(async () => {
    mock.restore();
    const module = await import("../../src/auth/middleware");
    AuthMiddleware = module.AuthMiddleware;
  });

  test("authenticate - should add user data to request for valid session", async () => {
    const middleware = new AuthMiddleware();
    const mockRequest = new Request("http://localhost/test", {
      headers: { cookie: "session_id=valid_session" },
    });

    const authenticatedRequest = await middleware.authenticate(mockRequest);

    expect(authenticatedRequest.user).toBeTruthy();
    expect(authenticatedRequest.user?.userId).toBe("test_google_id");
    expect(authenticatedRequest.sessionId).toBe("valid_session");
  });

  test("authenticate - should not add user data for invalid session", async () => {
    const middleware = new AuthMiddleware();
    const mockRequest = new Request("http://localhost/test", {
      headers: { cookie: "session_id=invalid_session" },
    });

    const authenticatedRequest = await middleware.authenticate(mockRequest);

    expect(authenticatedRequest.user).toBeUndefined();
    expect(authenticatedRequest.sessionId).toBeNull();
  });

  test("requireAuth - should return 401 for unauthenticated request", async () => {
    const middleware = new AuthMiddleware();
    const mockHandler = mock(async () => new Response("success"));
    const protectedHandler = middleware.requireAuth(mockHandler);

    const mockRequest = new Request("http://localhost/test");
    const response = await protectedHandler(mockRequest);

    expect(response.status).toBe(401);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test("requireAuth - should call handler for authenticated request", async () => {
    const middleware = new AuthMiddleware();
    const mockHandler = mock(async () => new Response("success"));
    const protectedHandler = middleware.requireAuth(mockHandler);

    const mockRequest = new Request("http://localhost/test", {
      headers: { cookie: "session_id=valid_session" },
    });
    const response = await protectedHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  test("optionalAuth - should call handler regardless of authentication", async () => {
    const middleware = new AuthMiddleware();
    const mockHandler = mock(async (req: { user?: unknown }) => {
      return Response.json({ authenticated: !!req.user });
    });
    const optionalHandler = middleware.optionalAuth(mockHandler);

    // Test unauthenticated request
    const unauthRequest = new Request("http://localhost/test");
    const unauthResponse = await optionalHandler(unauthRequest);
    const unauthData = await unauthResponse.json();

    expect(unauthData.authenticated).toBe(false);

    // Test authenticated request
    const authRequest = new Request("http://localhost/test", {
      headers: { cookie: "session_id=valid_session" },
    });
    const authResponse = await optionalHandler(authRequest);
    const authData = await authResponse.json();

    expect(authData.authenticated).toBe(true);
  });

  test("csrf - should reject requests without CSRF header", async () => {
    const middleware = new AuthMiddleware();
    const mockHandler = mock(async () => new Response("success"));
    const csrfProtectedHandler = middleware.csrf(mockHandler);

    const mockRequest = new Request("http://localhost/test", {
      method: "POST",
      headers: { cookie: "session_id=valid_session" },
    });

    const response = await csrfProtectedHandler(mockRequest);

    expect(response.status).toBe(403);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test("csrf - should allow requests with valid CSRF header", async () => {
    const middleware = new AuthMiddleware();
    const mockHandler = mock(async () => new Response("success"));
    const csrfProtectedHandler = middleware.csrf(mockHandler);

    const mockRequest = new Request("http://localhost/test", {
      method: "POST",
      headers: {
        cookie: "session_id=valid_session",
        "X-CSRF-Token": "XMLHttpRequest",
      },
    });

    const response = await csrfProtectedHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  test("compose - should chain multiple middleware functions", async () => {
    const middleware = new AuthMiddleware();
    const mockHandler = mock(async () => new Response("success"));

    const composedHandler = middleware.compose(middleware.csrf, middleware.requireAuth)(mockHandler);

    const mockRequest = new Request("http://localhost/test", {
      method: "POST",
      headers: {
        cookie: "session_id=valid_session",
        "X-CSRF-Token": "XMLHttpRequest",
      },
    });

    const response = await composedHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });
});
