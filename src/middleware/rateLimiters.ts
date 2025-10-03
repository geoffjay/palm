/**
 * Rate limiter instances for different endpoint categories
 */

import { SessionManager } from "../auth/session";
import { createRateLimiter } from "./rateLimit";

// Get Redis client from SessionManager
const redis = SessionManager.getInstance().getRedisClient();

/**
 * Strict rate limiter for sensitive operations
 * 5 requests per minute
 * Use for: password reset, account deletion, etc.
 */
export const strictRateLimit = createRateLimiter({
  redis,
  requests: 5,
  windowSeconds: 60,
  prefix: "ratelimit:strict",
});

/**
 * Auth rate limiter for authentication endpoints
 * 10 requests per minute
 * Use for: login, OAuth initiation, token refresh
 */
export const authRateLimit = createRateLimiter({
  redis,
  requests: 10,
  windowSeconds: 60,
  prefix: "ratelimit:auth",
});

/**
 * API rate limiter for general API endpoints
 * 100 requests per minute
 * Use for: data fetching, CRUD operations
 */
export const apiRateLimit = createRateLimiter({
  redis,
  requests: 100,
  windowSeconds: 60,
  prefix: "ratelimit:api",
});

/**
 * Sync rate limiter for data synchronization
 * 5 requests per 5 minutes (expensive operations)
 * Use for: integration sync, bulk data operations
 */
export const syncRateLimit = createRateLimiter({
  redis,
  requests: 5,
  windowSeconds: 300,
  prefix: "ratelimit:sync",
});
