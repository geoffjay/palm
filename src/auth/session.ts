/**
 * Session management using ioredis client
 */

import Redis from "ioredis";

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  picture: string;
  accessToken?: string;
  refreshToken?: string;
  createdAt: number;
  lastActivity: number;
}

interface SessionConfig {
  ttl: number; // Time to live in seconds
  cookieName: string;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    path: string;
  };
}

export class SessionManager {
  private static instance: SessionManager;
  private redis: Redis;
  private config: SessionConfig;
  private redisHealthy: boolean = false;

  private constructor() {
    // Initialize Redis connection using ioredis
    // Support both REDIS_URL (production) and individual environment variables (development)
    console.log("🔧 SessionManager constructor called");
    console.log("🔧 Redis config - REDIS_URL exists:", !!process.env.REDIS_URL);
    console.log("🔧 Redis config - REDIS_URL length:", process.env.REDIS_URL?.length || 0);

    if (process.env.REDIS_URL) {
      const redisUrl = process.env.REDIS_URL;
      console.log("🔧 Redis URL (masked):", redisUrl.replace(/:[^:@]+@/, ':***@'));

      // Parse URL to check if it needs TLS
      const needsTLS = redisUrl.includes('upstash.io') || redisUrl.startsWith('rediss://');
      console.log("🔧 TLS required:", needsTLS);

      console.log("🔧 Creating Redis connection with URL and TLS");
      this.redis = new Redis(redisUrl, {
        family: 0, // Allow both IPv4 and IPv6
        connectTimeout: 10000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        enableAutoPipelining: true,
        tls: needsTLS ? {
          rejectUnauthorized: true,
        } : undefined,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          console.log(`🔧 Redis retry attempt ${times}, delay ${delay}ms`);
          return delay;
        },
        reconnectOnError(err) {
          console.error("🔧 Redis reconnect on error:", err.message);
          return true;
        },
      });
    } else {
      console.log("🔧 Creating Redis connection with individual vars");
      console.log("🔧 Redis host:", process.env.REDIS_HOST || "localhost");
      console.log("🔧 Redis port:", process.env.REDIS_PORT || "6379");
      this.redis = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || "0", 10),
        family: 0,
        connectTimeout: 10000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          console.log(`🔧 Redis retry attempt ${times}, delay ${delay}ms`);
          return delay;
        },
      });
    }

    console.log("🔧 Redis client created, status:", this.redis.status);

    // Add error handling for Redis connection
    this.redis.on("error", (error) => {
      console.error("Redis connection error:", error);
      this.redisHealthy = false;
    });

    this.redis.on("connect", () => {
      console.log("Redis connected successfully");
      this.redisHealthy = true;
    });

    this.redis.on("ready", () => {
      console.log("Redis connection ready");
      this.redisHealthy = true;
    });

    this.redis.on("close", () => {
      console.warn("Redis connection closed");
      this.redisHealthy = false;
    });

    this.config = {
      ttl: parseInt(process.env.SESSION_TTL || "86400", 10), // 24 hours default
      cookieName: "session_id",
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    };
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Ensure Redis connection is available and healthy
   */
  private async ensureRedisConnected(): Promise<void> {
    try {
      // Try to connect if not connected
      if (this.redis.status === "wait" || this.redis.status === "end") {
        await this.redis.connect();
      }

      // Verify connection with a ping
      await this.redis.ping();
      this.redisHealthy = true;
    } catch (error) {
      this.redisHealthy = false;
      throw new Error(
        "Session store unavailable - Redis connection required. Please ensure Redis is running.",
      );
    }
  }

  /**
   * Generate a cryptographically secure session ID
   */
  private generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Create a new session
   */
  async createSession(userData: Omit<SessionData, "createdAt" | "lastActivity">): Promise<string> {
    // Ensure Redis is connected before creating session
    await this.ensureRedisConnected();

    const sessionId = this.generateSessionId();
    const now = Date.now();

    const sessionData: SessionData = {
      ...userData,
      createdAt: now,
      lastActivity: now,
    };

    const key = `session:${sessionId}`;

    try {
      await this.redis.setex(key, this.config.ttl, JSON.stringify(sessionData));
      console.log("✅ Session saved to Redis successfully");
      return sessionId;
    } catch (error) {
      console.error("❌ Failed to save session to Redis:", error);
      throw new Error("Failed to create session - service unavailable");
    }
  }

  /**
   * Get session data by session ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!sessionId) return null;

    // Ensure Redis is connected
    await this.ensureRedisConnected();

    const key = `session:${sessionId}`;

    try {
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      const sessionData = JSON.parse(data) as SessionData;

      // Update last activity
      sessionData.lastActivity = Date.now();
      await this.redis.setex(key, this.config.ttl, JSON.stringify(sessionData));

      return sessionData;
    } catch (error) {
      console.error("❌ Failed to get session from Redis:", error);
      throw new Error("Failed to retrieve session - service unavailable");
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    // Ensure Redis is connected
    await this.ensureRedisConnected();

    const existing = await this.getSession(sessionId);
    if (!existing) return false;

    const updated = {
      ...existing,
      ...updates,
      lastActivity: Date.now(),
    };

    const key = `session:${sessionId}`;

    try {
      await this.redis.setex(key, this.config.ttl, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error("❌ Failed to update session in Redis:", error);
      throw new Error("Failed to update session - service unavailable");
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!sessionId) return false;

    // Ensure Redis is connected
    await this.ensureRedisConnected();

    const key = `session:${sessionId}`;

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error("❌ Failed to delete session from Redis:", error);
      throw new Error("Failed to delete session - service unavailable");
    }
  }

  /**
   * Validate if a session is still active and not expired
   */
  async validateSession(sessionId: string): Promise<boolean> {
    if (!sessionId) return false;

    const sessionData = await this.getSession(sessionId);
    if (!sessionData) return false;

    // Check if session is expired (beyond TTL)
    const now = Date.now();
    const sessionAge = now - sessionData.createdAt;
    const maxAge = this.config.ttl * 1000; // Convert to milliseconds

    return sessionAge <= maxAge;
  }

  /**
   * Create session cookie header
   */
  createSessionCookie(sessionId: string): string {
    const { cookieName, cookieOptions } = this.config;
    const expires = new Date(Date.now() + this.config.ttl * 1000);

    let cookie = `${cookieName}=${sessionId}; Expires=${expires.toUTCString()}; Path=${cookieOptions.path}`;

    if (cookieOptions.httpOnly) {
      cookie += "; HttpOnly";
    }

    if (cookieOptions.secure) {
      cookie += "; Secure";
    }

    cookie += `; SameSite=${cookieOptions.sameSite}`;

    return cookie;
  }

  /**
   * Create session deletion cookie
   */
  createDeleteCookie(): string {
    const { cookieName, cookieOptions } = this.config;
    return `${cookieName}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${cookieOptions.path}; HttpOnly`;
  }

  /**
   * Extract session ID from request cookies
   */
  extractSessionId(request: Request): string | null {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return cookies[this.config.cookieName] || null;
  }

  /**
   * Get Redis client for direct access (use with caution)
   */
  getRedisClient(): Redis {
    return this.redis;
  }

  /**
   * Clean up expired sessions (can be called periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    // This is a simplified cleanup - in production you might want a more sophisticated approach
    // Redis with TTL handles most cleanup automatically, but this can clean up any orphaned data

    const pattern = "session:*";
    const keys = await this.redis.keys(pattern);
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        // Key exists but has no TTL set
        await this.redis.del(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
