import { beforeEach, describe, expect, mock, test } from "bun:test";

// Mock fetch globally
global.fetch = mock(async (url: string) => {
  if (url.includes("token")) {
    return new Response(
      JSON.stringify({
        access_token: "mock_access_token",
        id_token: "mock_id_token",
        refresh_token: "mock_refresh_token",
        expires_in: 3600,
        token_type: "Bearer",
      }),
      { status: 200 },
    );
  }

  if (url.includes("userinfo")) {
    return new Response(
      JSON.stringify({
        id: "mock_google_id",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        given_name: "Test",
        family_name: "User",
      }),
      { status: 200 },
    );
  }

  return new Response("Not Found", { status: 404 });
});

describe("GoogleOAuth", () => {
  let GoogleOAuth: { new (): unknown };

  beforeEach(async () => {
    mock.restore();
    // Reset the module
    const module = await import("../../src/auth/oauth");
    GoogleOAuth = module.GoogleOAuth;
  });

  test("constructor - should initialize with environment variables", () => {
    const oauth = new GoogleOAuth();
    expect(oauth).toBeTruthy();
  });

  test("constructor - should throw error if missing CLIENT_ID", () => {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    expect(() => new GoogleOAuth()).toThrow("GOOGLE_CLIENT_ID environment variable is required");

    process.env.GOOGLE_CLIENT_ID = originalClientId;
  });

  test("constructor - should throw error if missing CLIENT_SECRET", () => {
    const originalSecret = process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_SECRET;

    expect(() => new GoogleOAuth()).toThrow("GOOGLE_CLIENT_SECRET environment variable is required");

    process.env.GOOGLE_CLIENT_SECRET = originalSecret;
  });

  test("getAuthorizationUrl - should return valid auth URL", () => {
    const oauth = new GoogleOAuth();
    const state = "test_state";
    const authUrl = oauth.getAuthorizationUrl(state);

    expect(authUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(authUrl).toContain("client_id=");
    expect(authUrl).toContain("state=test_state");
    expect(authUrl).toContain("scope=openid");
  });

  test("exchangeCodeForTokens - should exchange code for tokens", async () => {
    const oauth = new GoogleOAuth();
    const tokens = await oauth.exchangeCodeForTokens("test_code", "test_state");

    expect(tokens.access_token).toBe("mock_access_token");
    expect(tokens.id_token).toBe("mock_id_token");
    expect(tokens.refresh_token).toBe("mock_refresh_token");
  });

  test("getUserInfo - should fetch user info with access token", async () => {
    const oauth = new GoogleOAuth();
    const userInfo = await oauth.getUserInfo("mock_access_token");

    expect(userInfo.id).toBe("mock_google_id");
    expect(userInfo.email).toBe("test@example.com");
    expect(userInfo.name).toBe("Test User");
  });

  test("verifyIdToken - should decode ID token", async () => {
    const oauth = new GoogleOAuth();
    // Create a mock JWT token (header.payload.signature)
    const mockPayload = {
      id: "mock_google_id",
      email: "test@example.com",
      name: "Test User",
      aud: process.env.GOOGLE_CLIENT_ID, // Use the actual client ID from environment
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };
    const encodedPayload = btoa(JSON.stringify(mockPayload));
    const mockToken = `eyJhbGciOiJSUzI1NiJ9.${encodedPayload}.signature`;

    const decoded = await oauth.verifyIdToken(mockToken);

    expect(decoded.id).toBe("mock_google_id");
    expect(decoded.email).toBe("test@example.com");
  });

  test("verifyIdToken - should throw error for invalid token", async () => {
    const oauth = new GoogleOAuth();

    expect(async () => {
      await oauth.verifyIdToken("invalid.token");
    }).toThrow("Invalid ID token format");
  });
});
