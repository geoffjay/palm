/**
 * Drizzle ORM Database Schema
 * Replaces custom migration system with type-safe schema definitions
 */

import { relations } from "drizzle-orm";
import { index, inet, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Users table for storing OAuth user information
 */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    googleId: varchar("google_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    givenName: varchar("given_name", { length: 255 }),
    familyName: varchar("family_name", { length: 255 }),
    picture: varchar("picture", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
  },
  (table) => {
    return {
      googleIdIdx: index("idx_users_google_id").on(table.googleId),
      emailIdx: index("idx_users_email").on(table.email),
    };
  },
);

/**
 * User sessions table for storing session metadata
 * Optional since Redis is used for session storage
 */
export const userSessions = pgTable(
  "user_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: inet("ip_address"),
    lastActivity: timestamp("last_activity", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      sessionIdIdx: index("idx_user_sessions_session_id").on(table.sessionId),
      userIdIdx: index("idx_user_sessions_user_id").on(table.userId),
      expiresAtIdx: index("idx_user_sessions_expires_at").on(table.expiresAt),
      lastActivityIdx: index("idx_user_sessions_last_activity").on(table.lastActivity),
    };
  },
);

/**
 * Define relationships between tables
 */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

/**
 * Type exports for use throughout the application
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
