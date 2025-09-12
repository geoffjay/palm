/**
 * Database connection and Drizzle setup
 * Replaces custom database code with Drizzle ORM
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database configuration from environment variables
 */
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "simplify",
  username: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "password",
};

/**
 * Create PostgreSQL connection
 */
const queryClient = postgres({
  host: config.host,
  port: config.port,
  database: config.database,
  username: config.username,
  password: config.password,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Drizzle database instance with schema
 */
export const db = drizzle(queryClient, { schema });

/**
 * Export schema for use in other files
 */
export { schema };

/**
 * Export types
 */
export type { NewUser, NewUserSession, User, UserSession } from "./schema";

/**
 * Close database connection (for cleanup)
 */
export async function closeDb() {
  await queryClient.end();
}
