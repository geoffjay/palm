#!/usr/bin/env bun

/**
 * Database Migration CLI using Bun
 * Command-line interface for managing database migrations
 */

import { DatabaseMigrator } from "./migrator";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

/**
 * Generate a new migration file
 */
async function createMigration(name: string): Promise<void> {
  if (!name) {
    log.error("Migration name is required");
    log.info("Usage: bun migrate:create <migration_name>");
    process.exit(1);
  }

  // Create migrations directory if it doesn't exist
  const migrationsDir = "./src/db/migrations";

  try {
    await Bun.$`mkdir -p ${migrationsDir}`;
  } catch (error) {
    // Directory might already exist, that's fine
  }

  // Generate migration ID (3-digit sequence)
  const existingFiles = await Bun.$`ls ${migrationsDir} 2>/dev/null | grep -E '^[0-9]{3}_' | sort`
    .text()
    .catch(() => "");
  const files = existingFiles
    .trim()
    .split("\n")
    .filter((f) => f.length > 0);

  let nextId = "001";
  if (files.length > 0) {
    const lastFile = files[files.length - 1];
    const lastId = parseInt(lastFile.substring(0, 3));
    nextId = String(lastId + 1).padStart(3, "0");
  }

  // Sanitize migration name
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const fileName = `${nextId}_${safeName}.ts`;
  const filePath = `${migrationsDir}/${fileName}`;

  // Migration template
  const template = `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

export const up = \`
  -- Add your migration SQL here
  -- Example:
  -- CREATE TABLE example_table (
  --   id SERIAL PRIMARY KEY,
  --   name VARCHAR(255) NOT NULL,
  --   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  -- );
\`;

export const down = \`
  -- Add your rollback SQL here
  -- Example:
  -- DROP TABLE example_table;
\`;
`;

  try {
    await Bun.write(filePath, template);
    log.success(`Created migration: ${fileName}`);
    log.info(`Edit the file at: ${filePath}`);
  } catch (error) {
    log.error(`Failed to create migration: ${error}`);
    process.exit(1);
  }
}

/**
 * Run migrations
 */
async function runMigrations(): Promise<void> {
  const migrator = new DatabaseMigrator();

  try {
    await migrator.migrate();
  } catch (error) {
    log.error(`Migration failed: ${error}`);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

/**
 * Rollback migrations
 */
async function rollbackMigrations(): Promise<void> {
  const migrator = new DatabaseMigrator();

  try {
    await migrator.rollback();
  } catch (error) {
    log.error(`Rollback failed: ${error}`);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

/**
 * Show migration status
 */
async function showStatus(): Promise<void> {
  const migrator = new DatabaseMigrator();

  try {
    await migrator.status();
  } catch (error) {
    log.error(`Status check failed: ${error}`);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

/**
 * Reset all migrations
 */
async function resetMigrations(): Promise<void> {
  log.warning("This will reset all migrations and may cause data loss!");

  // Simple confirmation prompt
  const response = prompt("Are you sure you want to reset all migrations? (yes/no): ");

  if (response?.toLowerCase() !== "yes") {
    log.info("Reset cancelled");
    return;
  }

  const migrator = new DatabaseMigrator();

  try {
    await migrator.reset();
  } catch (error) {
    log.error(`Reset failed: ${error}`);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

/**
 * Initialize migration system
 */
async function initializeMigrations(): Promise<void> {
  const migrator = new DatabaseMigrator();

  try {
    await migrator.initialize();
    log.success("Migration system initialized");
  } catch (error) {
    log.error(`Initialization failed: ${error}`);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
${colors.cyan}Database Migration CLI${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun migrate <command> [options]

${colors.yellow}Commands:${colors.reset}
  ${colors.green}create <name>${colors.reset}     Create a new migration file
  ${colors.green}up${colors.reset}               Run all pending migrations
  ${colors.green}down${colors.reset}             Rollback the last batch of migrations
  ${colors.green}status${colors.reset}           Show migration status
  ${colors.green}reset${colors.reset}            Reset all migrations (WARNING: destructive)
  ${colors.green}init${colors.reset}             Initialize the migration system
  ${colors.green}help${colors.reset}             Show this help message

${colors.yellow}Examples:${colors.reset}
  bun migrate create add_users_table
  bun migrate up
  bun migrate down
  bun migrate status

${colors.yellow}Environment Variables:${colors.reset}
  DB_HOST       Database host (default: localhost)
  DB_PORT       Database port (default: 5432)
  DB_NAME       Database name (default: simplify)
  DB_USER       Database username (default: user)
  DB_PASSWORD   Database password (default: password)

${colors.yellow}Migration File Format:${colors.reset}
  Migrations are numbered sequentially: 001_migration_name.ts
  Each migration exports 'up' and 'down' SQL strings.
`);
}

/**
 * Main CLI handler
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const name = args[1];

  switch (command) {
    case "create":
      await createMigration(name);
      break;

    case "up":
    case "migrate":
      await runMigrations();
      break;

    case "down":
    case "rollback":
      await rollbackMigrations();
      break;

    case "status":
      await showStatus();
      break;

    case "reset":
      await resetMigrations();
      break;

    case "init":
      await initializeMigrations();
      break;

    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;

    default:
      if (command) {
        log.error(`Unknown command: ${command}`);
      }
      showHelp();
      process.exit(1);
  }
}

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  log.error(`Unhandled rejection: ${error}`);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  log.error(`Uncaught exception: ${error}`);
  process.exit(1);
});

// Run the CLI
if (import.meta.main) {
  main().catch((error) => {
    log.error(`CLI error: ${error}`);
    process.exit(1);
  });
}
