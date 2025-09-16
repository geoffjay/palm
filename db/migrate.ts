#!/usr/bin/env bun

/**
 * Drizzle Migration Runner
 * Simple script to run migrations using Drizzle ORM
 */

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, db } from "./index";
import { seedMeasurementTypes } from "./seed";

async function runMigrations() {
  console.log("🚀 Running database migrations...");

  try {
    await migrate(db, {
      migrationsFolder: "./db/drizzle",
    });

    console.log("✅ Migrations completed successfully!");

    // Run seed data after migrations
    console.log("🌱 Running seed data...");
    await seedMeasurementTypes();
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
