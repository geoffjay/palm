import { describe, expect, test, mock, beforeEach } from "bun:test";
import { createRateLimiter, rateLimitMiddleware, getClientIdentifier } from "../../src/middleware/rateLimit";

describe("Rate Limiting", () => {
  describe("getClientIdentifier", () => {
    test("should use authenticated user ID when available", () => {
      const req = {
        user: { userId: "user123" },
        headers: {
          get: () => null,
        },
      } as any;

      const identifier = getClientIdentifier(req);
      expect(identifier).toBe("user:user123");
    });

    test("should use X-Forwarded-For IP when no user", () => {
      const req = {
        headers: {
          get: (name: string) => {
            if (name === "x-forwarded-for") return "203.0.113.1, 198.51.100.2";
            return null;
          },
        },
      } as any;

      const identifier = getClientIdentifier(req);
      expect(identifier).toBe("ip:203.0.113.1");
    });

    test("should use CF-Connecting-IP when available", () => {
      const req = {
        headers: {
          get: (name: string) => {
            if (name === "cf-connecting-ip") return "203.0.113.5";
            return null;
          },
        },
      } as any;

      const identifier = getClientIdentifier(req);
      expect(identifier).toBe("ip:203.0.113.5");
    });

    test("should prefer X-Forwarded-For over CF-Connecting-IP", () => {
      const req = {
        headers: {
          get: (name: string) => {
            if (name === "x-forwarded-for") return "203.0.113.1";
            if (name === "cf-connecting-ip") return "203.0.113.5";
            return null;
          },
        },
      } as any;

      const identifier = getClientIdentifier(req);
      expect(identifier).toBe("ip:203.0.113.1");
    });

    test("should handle missing IP headers", () => {
      const req = {
        headers: {
          get: () => null,
        },
      } as any;

      const identifier = getClientIdentifier(req);
      expect(identifier).toBe("ip:unknown");
    });

    test("should trim whitespace from forwarded IP", () => {
      const req = {
        headers: {
          get: (name: string) => {
            if (name === "x-forwarded-for") return "  203.0.113.1  , 198.51.100.2";
            return null;
          },
        },
      } as any;

      const identifier = getClientIdentifier(req);
      expect(identifier).toBe("ip:203.0.113.1");
    });
  });

  describe("createRateLimiter", () => {
    let mockRedis: any;

    beforeEach(() => {
      mockRedis = {
        sadd: mock(async () => 1),
        eval: mock(async () => [1, 9, Date.now() + 60000]), // [allowed, remaining, resetTime]
      };
    });

    test("should create rate limiter with correct configuration", () => {
      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      expect(limiter).toBeDefined();
    });

    test("should allow requests within limit", async () => {
      // Mock Redis to indicate request is allowed
      mockRedis.eval = mock(async () => [1, 9, Date.now() + 60000]); // allowed=1, remaining=9

      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      const result = await limiter.limit("test-identifier");

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    test("should reject requests exceeding limit", async () => {
      // Mock Redis to indicate limit exceeded
      mockRedis.eval = mock(async () => [0, 0, Date.now() + 30000]); // allowed=0, remaining=0

      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      const result = await limiter.limit("test-identifier");

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("rateLimitMiddleware", () => {
    let mockRedis: any;

    beforeEach(() => {
      mockRedis = {
        eval: mock(async () => [1, 9, Date.now() + 60000]),
      };
    });

    test("should return null when rate limit not exceeded", async () => {
      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      const req = new Request("http://localhost:3000/api/test");
      const middleware = rateLimitMiddleware(limiter);
      const result = await middleware(req);

      expect(result).toBeNull();
    });

    test("should return 429 response when rate limit exceeded", async () => {
      // Mock limit exceeded
      mockRedis.eval = mock(async () => [0, 0, Date.now() + 30000]);

      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      const req = new Request("http://localhost:3000/api/test");
      const middleware = rateLimitMiddleware(limiter);
      const result = await middleware(req);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
    });

    test("should include rate limit headers in 429 response", async () => {
      mockRedis.eval = mock(async () => [0, 0, Date.now() + 30000]);

      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      const req = new Request("http://localhost:3000/api/test");
      const middleware = rateLimitMiddleware(limiter);
      const result = await middleware(req);

      expect(result?.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(result?.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(result?.headers.get("Retry-After")).toBeTruthy();
    });

    test("should include error details in response body", async () => {
      mockRedis.eval = mock(async () => [0, 0, Date.now() + 30000]);

      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      const req = new Request("http://localhost:3000/api/test");
      const middleware = rateLimitMiddleware(limiter);
      const result = await middleware(req);

      const body = await result?.json();
      expect(body.error).toBe("Rate limit exceeded");
      expect(body.message).toContain("Too many requests");
      expect(body.limit).toBe(10);
      expect(body.remaining).toBe(0);
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    test("should fail open on Redis errors", async () => {
      // Mock Redis error
      mockRedis.eval = mock(async () => {
        throw new Error("Redis connection failed");
      });

      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      const req = new Request("http://localhost:3000/api/test");
      const middleware = rateLimitMiddleware(limiter);
      const result = await middleware(req);

      // Should allow request even though Redis failed (fail open)
      expect(result).toBeNull();
    });

    test("should use user ID for authenticated requests", async () => {
      mockRedis.eval = mock(async () => [1, 9, Date.now() + 60000]);

      const limiter = createRateLimiter({
        redis: mockRedis as any,
        requests: 10,
        windowSeconds: 60,
        prefix: "test:ratelimit",
      });

      const req = {
        user: { userId: "user456" },
        headers: {
          get: () => "203.0.113.1",
        },
      } as any;

      const middleware = rateLimitMiddleware(limiter);
      await middleware(req);

      // Should have called Redis eval with user-based identifier in the key
      expect(mockRedis.eval).toHaveBeenCalled();
      const callArgs = mockRedis.eval.mock.calls[0];
      // The key should contain user456
      expect(callArgs[2]).toContain("user:user456");
    });
  });
});
