/**
 * Authentication middleware for Bun.serve routes
 */

import { SessionManager, type SessionData } from "./session";

export interface AuthenticatedRequest extends Request {
	user?: SessionData;
	sessionId?: string;
}

export type RouteHandler = (
	req: AuthenticatedRequest,
) => Promise<Response> | Response;
export type AuthenticatedRouteHandler = (
	req: AuthenticatedRequest & { user: SessionData },
) => Promise<Response> | Response;

export class AuthMiddleware {
	private sessionManager: SessionManager;

	constructor() {
		this.sessionManager = new SessionManager();
	}

	/**
	 * Middleware to authenticate requests
	 * Adds user data to request if valid session exists
	 */
	async authenticate(
		request: AuthenticatedRequest,
	): Promise<AuthenticatedRequest> {
		const sessionId = this.sessionManager.extractSessionId(request);

		if (sessionId) {
			const sessionData = await this.sessionManager.getSession(sessionId);
			if (sessionData) {
				request.user = sessionData;
				request.sessionId = sessionId;
			}
		}

		return request;
	}

	/**
	 * Require authentication for a route
	 * Returns 401 if user is not authenticated
	 */
	requireAuth(handler: AuthenticatedRouteHandler): RouteHandler {
		return async (req: AuthenticatedRequest) => {
			const authenticatedReq = await this.authenticate(req);

			if (!authenticatedReq.user) {
				return new Response(
					JSON.stringify({
						error: "Authentication required",
						message: "Please log in to access this resource",
					}),
					{
						status: 401,
						headers: {
							"Content-Type": "application/json",
							"WWW-Authenticate": "Bearer",
						},
					},
				);
			}

			return handler(
				authenticatedReq as AuthenticatedRequest & { user: SessionData },
			);
		};
	}

	/**
	 * Optional authentication for a route
	 * Adds user data if available, but doesn't require it
	 */
	optionalAuth(handler: RouteHandler): RouteHandler {
		return async (req: AuthenticatedRequest) => {
			const authenticatedReq = await this.authenticate(req);
			return handler(authenticatedReq);
		};
	}

	/**
	 * Create a logout response that clears the session
	 */
	async logout(request: AuthenticatedRequest): Promise<Response> {
		const sessionId = this.sessionManager.extractSessionId(request);

		if (sessionId) {
			await this.sessionManager.deleteSession(sessionId);
		}

		const deleteCookie = this.sessionManager.createDeleteCookie();

		return new Response(
			JSON.stringify({ message: "Logged out successfully" }),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Set-Cookie": deleteCookie,
				},
			},
		);
	}

	/**
	 * CSRF protection middleware
	 * Validates CSRF token for state-changing operations
	 */
	csrf(handler: RouteHandler): RouteHandler {
		return async (req: AuthenticatedRequest) => {
			const method = req.method.toUpperCase();

			// Only check CSRF for state-changing methods
			if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
				const csrfToken =
					req.headers.get("X-CSRF-Token") ||
					req.headers.get("X-Requested-With");

				if (!csrfToken) {
					return new Response(
						JSON.stringify({
							error: "CSRF token required",
							message: "Include X-CSRF-Token or X-Requested-With header",
						}),
						{
							status: 403,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			}

			return handler(req);
		};
	}

	/**
	 * Rate limiting middleware (simple implementation)
	 */
	rateLimit(
		maxRequests: number,
		windowMs: number,
	): (handler: RouteHandler) => RouteHandler {
		const requests = new Map<string, { count: number; resetTime: number }>();

		return (handler: RouteHandler) => {
			return async (req: AuthenticatedRequest) => {
				const clientIp =
					req.headers.get("x-forwarded-for") ||
					req.headers.get("x-real-ip") ||
					"unknown";

				const now = Date.now();
				const key = `rate_limit:${clientIp}`;
				const record = requests.get(key);

				if (!record || now > record.resetTime) {
					requests.set(key, {
						count: 1,
						resetTime: now + windowMs,
					});
				} else {
					record.count++;

					if (record.count > maxRequests) {
						const resetIn = Math.ceil((record.resetTime - now) / 1000);

						return new Response(
							JSON.stringify({
								error: "Rate limit exceeded",
								message: `Too many requests. Try again in ${resetIn} seconds.`,
							}),
							{
								status: 429,
								headers: {
									"Content-Type": "application/json",
									"Retry-After": resetIn.toString(),
									"X-RateLimit-Limit": maxRequests.toString(),
									"X-RateLimit-Remaining": "0",
									"X-RateLimit-Reset": Math.ceil(
										record.resetTime / 1000,
									).toString(),
								},
							},
						);
					}
				}

				return handler(req);
			};
		};
	}

	/**
	 * Combine multiple middleware functions
	 */
	compose(...middlewares: Array<(handler: RouteHandler) => RouteHandler>) {
		return (handler: RouteHandler): RouteHandler => {
			return middlewares.reduceRight(
				(acc, middleware) => middleware(acc),
				handler,
			);
		};
	}
}
