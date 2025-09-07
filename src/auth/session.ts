/**
 * Session management using ioredis client
 */

import Redis from "ioredis";

interface SessionData {
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
  private redis: Redis;
  private config: SessionConfig;

  constructor() {
    // Initialize Redis connection using ioredis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.config = {
      ttl: parseInt(process.env.SESSION_TTL || "86400"), // 24 hours default
      cookieName: "session_id",
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    };
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
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const sessionData: SessionData = {
      ...userData,
      createdAt: now,
      lastActivity: now,
    };

    const key = `session:${sessionId}`;
    await this.redis.setex(key, this.config.ttl, JSON.stringify(sessionData));

    return sessionId;
  }

  /**
   * Get session data by session ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!sessionId) return null;

    const key = `session:${sessionId}`;
    const data = await this.redis.get(key);

    if (!data) return null;

    try {
      const sessionData = JSON.parse(data) as SessionData;

      // Update last activity
      sessionData.lastActivity = Date.now();
      await this.redis.setex(key, this.config.ttl, JSON.stringify(sessionData));

      return sessionData;
    } catch (error) {
      console.error("Failed to parse session data:", error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    const existing = await this.getSession(sessionId);
    if (!existing) return false;

    const updated = {
      ...existing,
      ...updates,
      lastActivity: Date.now(),
    };

    const key = `session:${sessionId}`;
    await this.redis.setex(key, this.config.ttl, JSON.stringify(updated));

    return true;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!sessionId) return false;

    const key = `session:${sessionId}`;
    const result = await this.redis.del(key);

    return result > 0;
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
