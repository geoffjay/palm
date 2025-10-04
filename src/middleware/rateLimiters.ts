/**
 * Rate limiter instances for different endpoint categories
 * Lazy initialization to avoid Redis connection issues at module load
 */

import { SessionManager } from "../auth/session";
import { createRateLimiter, type RateLimiter } from "./rateLimit";

// Lazy initialization cache
let _strictRateLimit: RateLimiter | null = null;
let _authRateLimit: RateLimiter | null = null;
let _apiRateLimit: RateLimiter | null = null;
let _syncRateLimit: RateLimiter | null = null;

/**
 * Get Redis client lazily
 */
function getRedis() {
  return SessionManager.getInstance().getRedisClient();
}

/**
 * Strict rate limiter for sensitive operations
 * 5 requests per minute
 * Use for: password reset, account deletion, etc.
 */
export const strictRateLimit: RateLimiter = {
  limit: async (identifier: string) => {
    if (!_strictRateLimit) {
      _strictRateLimit = createRateLimiter({
        redis: getRedis(),
        requests: 5,
        windowSeconds: 60,
        prefix: "ratelimit:strict",
      });
    }
    return _strictRateLimit.limit(identifier);
  },
};

/**
 * Auth rate limiter for authentication endpoints
 * 10 requests per minute
 * Use for: login, OAuth initiation, token refresh
 */
export const authRateLimit: RateLimiter = {
  limit: async (identifier: string) => {
    if (!_authRateLimit) {
      _authRateLimit = createRateLimiter({
        redis: getRedis(),
        requests: 10,
        windowSeconds: 60,
        prefix: "ratelimit:auth",
      });
    }
    return _authRateLimit.limit(identifier);
  },
};

/**
 * API rate limiter for general API endpoints
 * 100 requests per minute
 * Use for: data fetching, CRUD operations
 */
export const apiRateLimit: RateLimiter = {
  limit: async (identifier: string) => {
    if (!_apiRateLimit) {
      _apiRateLimit = createRateLimiter({
        redis: getRedis(),
        requests: 100,
        windowSeconds: 60,
        prefix: "ratelimit:api",
      });
    }
    return _apiRateLimit.limit(identifier);
  },
};

/**
 * Sync rate limiter for data synchronization
 * 5 requests per 5 minutes (expensive operations)
 * Use for: integration sync, bulk data operations
 */
export const syncRateLimit: RateLimiter = {
  limit: async (identifier: string) => {
    if (!_syncRateLimit) {
      _syncRateLimit = createRateLimiter({
        redis: getRedis(),
        requests: 5,
        windowSeconds: 300,
        prefix: "ratelimit:sync",
      });
    }
    return _syncRateLimit.limit(identifier);
  },
};
