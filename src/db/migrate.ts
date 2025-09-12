#!/usr/bin/env bun

/**
 * Drizzle Migration Runner
 * Simple script to run migrations using Drizzle ORM
 */

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, db } from "./index";

async function runMigrations() {
  console.log("🚀 Running database migrations...");

  try {
    await migrate(db, {
      migrationsFolder: "./src/db/drizzle",
    });

    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

// Run migrations if this file is executed directly
if (import.meta.main) {
  runMigrations();
}
