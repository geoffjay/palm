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

  // Debug: Log connection info (without sensitive data)
  const isProduction = process.env.NODE_ENV === "production";
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Using DATABASE_URL: ${!!process.env.DATABASE_URL}`);
  console.log(`Using individual DB vars: ${!!process.env.DB_HOST}`);
  console.log(`Production mode: ${isProduction}`);

  if (process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      console.log(`Database host: ${dbUrl.hostname}`);
      console.log(`Database port: ${dbUrl.port || "5432"}`);
    } catch (e) {
      console.log(`Database URL parse error: ${e}`);
    }
  }

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
