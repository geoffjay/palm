/**
 * Session Service - Database operations for user sessions using Drizzle ORM
 * Optional service for database-backed session tracking (you're using Redis)
 * This can be used for audit trails, analytics, or multi-device session management
 */

import { and, eq, gt, lt } from "drizzle-orm";
import type { NewUserSession, UserSession } from "../index";
import { db, schema } from "../index";

export class SessionService {
  /**
   * Create a new session record in the database
   */
  async createSession(sessionData: NewUserSession): Promise<UserSession> {
    const [session] = await db.insert(schema.userSessions).values(sessionData).returning();

    return session;
  }

  /**
   * Find session by session ID
   */
  async findBySessionId(sessionId: string): Promise<UserSession | null> {
    const [session] = await db
      .select()
      .from(schema.userSessions)
      .where(eq(schema.userSessions.sessionId, sessionId))
      .limit(1);

    return session || null;
  }

  /**
   * Find all sessions for a user
   */
  async findUserSessions(userId: number): Promise<UserSession[]> {
    return await db
      .select()
      .from(schema.userSessions)
      .where(eq(schema.userSessions.userId, userId))
      .orderBy(schema.userSessions.lastActivity);
  }

  /**
   * Update session last activity
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    await db
      .update(schema.userSessions)
      .set({
        lastActivity: new Date(),
      })
      .where(eq(schema.userSessions.sessionId, sessionId));
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db.delete(schema.userSessions).where(eq(schema.userSessions.sessionId, sessionId));

    return result.length > 0;
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: number): Promise<number> {
    const result = await db.delete(schema.userSessions).where(eq(schema.userSessions.userId, userId));

    return result.length;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await db.delete(schema.userSessions).where(lt(schema.userSessions.expiresAt, now));

    return result.length;
  }

  /**
   * Get active session count for a user
   */
  async getActiveSessionCount(userId: number): Promise<number> {
    const now = new Date();
    const sessions = await db
      .select()
      .from(schema.userSessions)
      .where(and(eq(schema.userSessions.userId, userId), gt(schema.userSessions.expiresAt, now)));

    return sessions.length;
  }

  /**
   * Update session expiry
   */
  async extendSession(sessionId: string, newExpiryDate: Date): Promise<boolean> {
    const result = await db
      .update(schema.userSessions)
      .set({
        expiresAt: newExpiryDate,
        lastActivity: new Date(),
      })
      .where(eq(schema.userSessions.sessionId, sessionId));

    return result.length > 0;
  }

  /**
   * Get session analytics for a user
   */
  async getUserSessionAnalytics(userId: number) {
    const sessions = await this.findUserSessions(userId);

    return {
      totalSessions: sessions.length,
      activeSessions: await this.getActiveSessionCount(userId),
      lastActivity: sessions[0]?.lastActivity || null,
      devices: [...new Set(sessions.map((s) => s.userAgent))].length,
    };
  }
}
