/**
 * User types for the application
 * Now using Drizzle ORM schema types
 */
import type { NewUser as DbNewUser, User as DbUser } from "../db";

// Re-export Drizzle types for database operations
export type { NewUser as DbNewUser, User as DbUser } from "../db";

// Session-compatible user interface (used in Redis sessions)
export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  picture: string;
  createdAt: number;
  lastActivity: number;
}

// Helper function to convert database user to session user
export function dbUserToSessionUser(dbUser: DbUser): Omit<SessionUser, "createdAt" | "lastActivity"> {
  return {
    userId: dbUser.googleId, // Use Google ID as session user ID
    email: dbUser.email,
    name: dbUser.name,
    picture: dbUser.picture || "",
  };
}

// Helper function to convert session user data to database user
export function sessionUserToDbUser(sessionUser: SessionUser): DbNewUser {
  return {
    googleId: sessionUser.userId,
    email: sessionUser.email,
    name: sessionUser.name,
    picture: sessionUser.picture || null,
    givenName: null,
    familyName: null,
    // createdAt, updatedAt, lastLogin will be handled by database defaults
  };
}

// Backward compatibility - alias the SessionUser as User for existing code
export type User = SessionUser;
