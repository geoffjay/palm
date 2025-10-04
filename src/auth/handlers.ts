/**
 * OAuth route handlers for Google authentication
 */

import { userService } from "../../db/services";
import { logger } from "../utils/logger";
import type { AuthenticatedRequest } from "./middleware";
import { GoogleOAuth } from "./oauth";
import { SessionManager } from "./session";

export class OAuthHandlers {
  private oauth: GoogleOAuth;
  private sessionManager: SessionManager;

  constructor() {
    this.oauth = new GoogleOAuth();
    this.sessionManager = SessionManager.getInstance();
  }

  /**
   * Initiate Google OAuth flow
   * GET /auth/google
   */
  async initiateGoogleAuth(_req: Request): Promise<Response> {
    try {
      logger.debug("Starting OAuth initiation");

      // Generate cryptographically secure state parameter for CSRF protection
      const state = crypto.randomUUID();
      const nonce = crypto.randomUUID();

      // Store state in Redis with 10-minute expiration
      const stateData = {
        nonce,
        createdAt: Date.now(),
      };

      const redis = this.sessionManager.getRedisClient();
      logger.debug("Got Redis client", { status: redis.status });

      logger.debug("Storing state in Redis");
      await redis.setex(
        `oauth:state:${state}`,
        600, // 10 minutes
        JSON.stringify(stateData),
      );
      logger.debug("State stored successfully");

      const authUrl = this.oauth.getAuthorizationUrl(state);
      logger.debug("Redirecting to Google OAuth", { authUrl });

      return Response.redirect(authUrl, 302);
    } catch (error) {
      logger.error("Failed to initiate Google auth", error, {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        redisStatus: this.sessionManager.getRedisClient().status,
      });

      return new Response(
        JSON.stringify({
          error: "Authentication failed",
          message: "Failed to initiate Google authentication",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  /**
   * Handle Google OAuth callback
   * GET /auth/google/callback
   */
  async handleGoogleCallback(req: Request): Promise<Response> {
    try {
      logger.debug("OAuth callback started");
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      logger.debug("OAuth callback params received", {
        hasCode: !!code,
        hasState: !!state,
        hasError: !!error,
      });

      // Check for OAuth errors
      if (error) {
        logger.warn("OAuth error received", { error });
        return this.redirectWithError("OAuth authentication was cancelled or failed");
      }

      if (!code) {
        logger.error("No authorization code received in OAuth callback");
        return this.redirectWithError("No authorization code received");
      }

      // Validate state parameter for CSRF protection
      if (!state) {
        logger.error("Missing state parameter in OAuth callback - possible CSRF attack");
        return this.redirectWithError("Missing state parameter - possible CSRF attack");
      }

      const redis = this.sessionManager.getRedisClient();
      const storedStateData = await redis.get(`oauth:state:${state}`);

      if (!storedStateData) {
        logger.error("Invalid or expired state parameter - possible CSRF attack");
        return this.redirectWithError("Invalid or expired state parameter - possible CSRF attack");
      }

      // Delete state to prevent replay attacks
      await redis.del(`oauth:state:${state}`);

      logger.debug("OAuth state validated successfully");

      logger.debug("Exchanging authorization code for tokens");
      // Exchange code for tokens
      const tokens = await this.oauth.exchangeCodeForTokens(code);
      logger.debug("OAuth tokens received");

      logger.debug("Fetching user info from Google");
      // Get user information
      const userInfo = await this.oauth.getUserInfo(tokens.access_token);
      logger.info("User authenticated via OAuth", { email: userInfo.email, userId: userInfo.id });

      logger.debug("Verifying ID token");
      // Verify ID token
      const _idTokenPayload = await this.oauth.verifyIdToken(tokens.id_token);
      logger.debug("ID token verified successfully");

      logger.debug("Creating or updating user in database");
      // Create or update user in database
      await this.createOrUpdateUser(userInfo);
      logger.debug("User record updated");

      // Session fixation protection: Delete any existing session before creating new one
      const oldSessionId = this.sessionManager.extractSessionId(req);
      if (oldSessionId) {
        logger.debug("Deleting old session for security (session fixation protection)");
        await this.sessionManager.deleteSession(oldSessionId);
      }

      logger.debug("Creating new authenticated session");
      // Create new user session with fresh session ID
      const sessionId = await this.sessionManager.createSession({
        userId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      logger.info("New session created for authenticated user", { userId: userInfo.id });

      // Create session cookie
      const sessionCookie = this.sessionManager.createSessionCookie(sessionId);

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || "/";

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${frontendUrl}?auth=success`,
          "Set-Cookie": sessionCookie,
        },
      });
    } catch (error) {
      logger.error("OAuth callback failed", error, {
        hasError: !!error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });
      return this.redirectWithError("Authentication failed");
    }
  }

  /**
   * Handle logout
   * POST /auth/logout
   */
  async handleLogout(req: AuthenticatedRequest): Promise<Response> {
    try {
      const sessionId = this.sessionManager.extractSessionId(req);

      if (sessionId) {
        await this.sessionManager.deleteSession(sessionId);
      }

      const deleteCookie = this.sessionManager.createDeleteCookie();

      return new Response(
        JSON.stringify({
          message: "Logged out successfully",
          success: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": deleteCookie,
          },
        },
      );
    } catch (error) {
      logger.error("Logout failed", error);

      return new Response(
        JSON.stringify({
          error: "Logout failed",
          message: "An error occurred during logout",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  /**
   * Get current user information
   * GET /auth/user
   */
  async getCurrentUser(req: AuthenticatedRequest): Promise<Response> {
    try {
      const sessionId = this.sessionManager.extractSessionId(req);

      if (!sessionId) {
        return new Response(JSON.stringify({ user: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sessionData = await this.sessionManager.getSession(sessionId);

      if (!sessionData) {
        return new Response(JSON.stringify({ user: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Return user data without sensitive information
      const { accessToken: _accessToken, refreshToken: _refreshToken, ...userData } = sessionData;

      return new Response(
        JSON.stringify({
          user: userData,
          authenticated: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      logger.error("Failed to get current user", error);

      return new Response(
        JSON.stringify({
          error: "Failed to get user information",
          user: null,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  /**
   * Refresh user session
   * POST /auth/refresh
   */
  async refreshSession(req: AuthenticatedRequest): Promise<Response> {
    try {
      const sessionId = this.sessionManager.extractSessionId(req);

      if (!sessionId) {
        return new Response(
          JSON.stringify({
            error: "No session found",
            message: "Please log in again",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const sessionData = await this.sessionManager.getSession(sessionId);

      if (!sessionData || !sessionData.refreshToken) {
        return new Response(
          JSON.stringify({
            error: "Invalid session",
            message: "Please log in again",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // TODO: Implement token refresh with Google
      // For now, just update the session timestamp
      await this.sessionManager.updateSession(sessionId, {
        lastActivity: Date.now(),
      });

      return new Response(
        JSON.stringify({
          message: "Session refreshed successfully",
          success: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      logger.error("Session refresh failed", error);

      return new Response(
        JSON.stringify({
          error: "Failed to refresh session",
          message: "Please log in again",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  /**
   * Create or update user in database
   */
  private async createOrUpdateUser(userInfo: {
    id: string;
    email: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
  }): Promise<void> {
    try {
      await userService.findOrCreateUser(userInfo.id, {
        email: userInfo.email,
        name: userInfo.name,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        picture: userInfo.picture,
      });
    } catch (error) {
      logger.error("Failed to create/update user in database", error);
      // Don't throw error to avoid breaking OAuth flow
    }
  }

  /**
   * Helper method to redirect with error message
   */
  private redirectWithError(message: string): Response {
    const frontendUrl = process.env.FRONTEND_URL || "/";
    const errorUrl = `${frontendUrl}?auth=error&message=${encodeURIComponent(message)}`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: errorUrl,
      },
    });
  }
}
