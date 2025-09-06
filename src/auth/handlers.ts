/**
 * OAuth route handlers for Google authentication
 */

import { GoogleOAuth } from "./oauth";
import { SessionManager } from "./session";
import type { AuthenticatedRequest } from "./middleware";

export class OAuthHandlers {
	private oauth: GoogleOAuth;
	private sessionManager: SessionManager;

	constructor() {
		this.oauth = new GoogleOAuth();
		this.sessionManager = new SessionManager();
	}

	/**
	 * Initiate Google OAuth flow
	 * GET /auth/google
	 */
	async initiateGoogleAuth(req: Request): Promise<Response> {
		try {
			// Generate a state parameter for CSRF protection
			const state = crypto.randomUUID();

			// Store state in a short-lived cache or session
			// For simplicity, we'll include it in the URL and verify on callback
			const authUrl = this.oauth.getAuthorizationUrl(state);

			// For production, you might want to store the state server-side
			// and validate it in the callback

			return Response.redirect(authUrl, 302);
		} catch (error) {
			console.error("Failed to initiate Google auth:", error);

			return new Response(
				JSON.stringify({
					error: "Authentication failed",
					message: "Failed to initiate Google authentication",
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
			const url = new URL(req.url);
			const code = url.searchParams.get("code");
			const state = url.searchParams.get("state");
			const error = url.searchParams.get("error");

			// Check for OAuth errors
			if (error) {
				console.error("OAuth error:", error);
				return this.redirectWithError(
					"OAuth authentication was cancelled or failed",
				);
			}

			if (!code) {
				return this.redirectWithError("No authorization code received");
			}

			// TODO: Validate state parameter for CSRF protection
			// In production, compare with stored state

			// Exchange code for tokens
			const tokens = await this.oauth.exchangeCodeForTokens(code);

			// Get user information
			const userInfo = await this.oauth.getUserInfo(tokens.access_token);

			// Verify ID token
			const idTokenPayload = await this.oauth.verifyIdToken(tokens.id_token);

			// Create user session
			const sessionId = await this.sessionManager.createSession({
				userId: userInfo.id,
				email: userInfo.email,
				name: userInfo.name,
				picture: userInfo.picture,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
			});

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
			console.error("OAuth callback error:", error);
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
			console.error("Logout error:", error);

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
			const { accessToken, refreshToken, ...userData } = sessionData;

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
			console.error("Get current user error:", error);

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
			console.error("Session refresh error:", error);

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
