/**
 * User Service - Database operations for users using Drizzle ORM
 * Provides type-safe database operations for user management
 */

import { eq } from "drizzle-orm";
import type { NewUser, User } from "../index";
import { db, schema } from "../index";

export class UserService {
  /**
   * Create a new user in the database
   */
  async createUser(userData: NewUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(userData).returning();

    return user;
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.googleId, googleId)).limit(1);

    return user || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

    return user || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);

    return user || null;
  }

  /**
   * Update user information
   */
  async updateUser(id: number, updates: Partial<NewUser>): Promise<User | null> {
    const [user] = await db
      .update(schema.users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();

    return user || null;
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(id: number): Promise<void> {
    await db
      .update(schema.users)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id));
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id));

    return result.length > 0;
  }

  /**
   * Find or create user (upsert operation)
   * Useful for OAuth flows where user might not exist yet
   */
  async findOrCreateUser(googleId: string, userData: Omit<NewUser, "googleId">): Promise<User> {
    // First try to find the user
    let user = await this.findByGoogleId(googleId);

    if (user) {
      // Update last login
      await this.updateLastLogin(user.id);
      return user;
    }

    // User doesn't exist, create them
    user = await this.createUser({
      ...userData,
      googleId,
    });

    return user;
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(schema.users.createdAt);
  }

  /**
   * Count total users
   */
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: schema.users.id }).from(schema.users);

    return result.length;
  }
}
