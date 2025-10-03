/**
 * Redis-based rate limiting middleware using sliding window algorithm
 * Compatible with existing ioredis connection
 */

import type Redis from "ioredis";

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  redis: Redis;
  requests: number;
  windowSeconds: number;
  prefix: string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Redis-based rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private redis: Redis;
  private maxRequests: number;
  private windowSeconds: number;
  private prefix: string;

  constructor(config: RateLimiterConfig) {
    this.redis = config.redis;
    this.maxRequests = config.requests;
    this.windowSeconds = config.windowSeconds;
    this.prefix = config.prefix;
  }

  /**
   * Check rate limit for identifier using sliding window
   */
  async limit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowSeconds * 1000;

    try {
      // Use Lua script for atomic operations
      const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window_start = tonumber(ARGV[2])
        local max_requests = tonumber(ARGV[3])
        local window_seconds = tonumber(ARGV[4])

        -- Remove old entries outside the window
        redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

        -- Count current requests in window
        local current = redis.call('ZCARD', key)

        if current < max_requests then
          -- Add new request
          redis.call('ZADD', key, now, now)
          redis.call('EXPIRE', key, window_seconds)
          return {1, max_requests - current - 1, now + (window_seconds * 1000)}
        else
          -- Get reset time (oldest entry + window)
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local reset = tonumber(oldest[2]) + (window_seconds * 1000)
          return {0, 0, reset}
        end
      `;

      const result = (await this.redis.eval(
        script,
        1,
        key,
        now.toString(),
        windowStart.toString(),
        this.maxRequests.toString(),
        this.windowSeconds.toString(),
      )) as [number, number, number];

      const [allowed, remaining, reset] = result;

      return {
        success: allowed === 1,
        limit: this.maxRequests,
        remaining: remaining || 0,
        reset: reset || now + this.windowSeconds * 1000,
      };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow request on error
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests,
        reset: now + this.windowSeconds * 1000,
      };
    }
  }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Get client identifier from request
 * Prefers authenticated user ID, falls back to IP address
 */
export function getClientIdentifier(req: Request): string {
  // Use authenticated user ID if available
  const user = (req as any).user;
  if (user?.userId) {
    return `user:${user.userId}`;
  }

  // Fall back to IP address with proper proxy handling
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take first IP from X-Forwarded-For header
    const ip = forwardedFor.split(",")[0].trim();
    return `ip:${ip}`;
  }

  // Cloudflare-specific header
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return `ip:${cfConnectingIp}`;
  }

  // Fallback to "unknown" (should rarely happen)
  return "ip:unknown";
}

/**
 * Rate limit middleware factory
 */
export function rateLimitMiddleware(limiter: RateLimiter) {
  return async (req: Request): Promise<Response | null> => {
    const identifier = getClientIdentifier(req);
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          limit,
          remaining: 0,
          reset: new Date(reset).toISOString(),
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    // Rate limit passed - continue to handler
    return null;
  };
}

/**
 * Combine rate limit check with handler
 */
export function withRateLimit(limiter: RateLimiter, handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const rateLimitResponse = await rateLimitMiddleware(limiter)(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(req);
  };
}
