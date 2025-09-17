# Database Migration System

## Overview

This project uses a custom database migration system built specifically for Bun and PostgreSQL. The system provides TypeScript-first migrations with full transaction support, rollback capabilities, and state tracking.

## Key Features

- **Bun Native**: Uses `Bun.sql` for PostgreSQL connections (no external libraries)
- **TypeScript First**: Migrations written in TypeScript with full type safety
- **Transaction Support**: All migrations run within transactions for data safety
- **Rollback Support**: Complete rollback functionality with down migrations
- **State Tracking**: Tracks applied migrations and batch numbers
- **CLI Interface**: Easy-to-use command-line interface
- **Batch Management**: Groups related migrations for atomic rollbacks

## Migration File Structure

```
db/
├── cli.ts                              # CLI interface
├── migrator.ts                         # Core migration engine
└── migrations/
    ├── 001_create_users_table.ts       # Migration files
    ├── 002_create_user_sessions_table.ts
    └── ...
```

### Migration File Format

Each migration file exports `up` and `down` SQL strings:

```typescript
// db/migrations/001_create_users_table.ts
export const up = `
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

export const down = `
  DROP TABLE users;
`;
```

### Naming Convention

- Files are numbered sequentially: `001_`, `002_`, `003_`, etc.
- Names use snake_case: `create_users_table`, `add_email_index`
- Format: `{3-digit-number}_{descriptive_name}.ts`

## CLI Commands

### Basic Usage

```bash
# Show help
bun run migrate help

# Initialize migration system
bun run migrate:init

# Create a new migration
bun run migrate:create add_users_table

# Run pending migrations
bun run migrate:up

# Check migration status
bun run migrate:status

# Rollback last batch
bun run migrate:down

# Reset all migrations (WARNING: destructive)
bun run migrate:reset
```

### Detailed Command Reference

#### Create Migration

```bash
bun run migrate:create <migration_name>

# Examples:
bun run migrate:create add_users_table
bun run migrate:create add_email_index_to_users
bun run migrate:create create_posts_table
```

Creates a new migration file with the next sequential number.

#### Run Migrations

```bash
bun run migrate:up
# or
bun run migrate
```

Runs all pending migrations in a single batch. If any migration fails, the entire batch is rolled back.

#### Check Status

```bash
bun run migrate:status
```

Shows the status of all migrations:

```
📊 Migration Status:
===================
✅ Executed 001_create_users_table (batch: 1)
✅ Executed 002_create_user_sessions_table (batch: 1)
⏳ Pending 003_add_email_index_to_users

Total: 3 | Executed: 2 | Pending: 1
```

#### Rollback

```bash
bun run migrate:down
```

Rolls back the most recent batch of migrations. Only migrations with `down` scripts can be rolled back.

#### Reset (Destructive)

```bash
bun run migrate:reset
```

⚠️ **WARNING**: This drops the migrations table and resets the entire migration system. Use with extreme caution.

## Environment Configuration

The migration system uses these environment variables:

```env
DB_HOST=localhost        # Database host
DB_PORT=5432             # Database port
DB_NAME=palm             # Database name
DB_USER=user             # Database username
DB_PASSWORD=password     # Database password
```

## Migration Workflow

### 1. Development Workflow

```bash
# 1. Create a new migration
bun run migrate:create add_user_preferences

# 2. Edit the generated file
# db/migrations/003_add_user_preferences.ts

# 3. Run the migration
bun run migrate:up

# 4. Check status
bun run migrate:status
```

### 2. Team Collaboration

```bash
# After pulling changes with new migrations
bun run migrate:status    # Check what's pending
bun run migrate:up        # Run new migrations
```

### 3. Production Deployment

```bash
# 1. Backup database first!
# 2. Run migrations
bun run migrate:up

# 3. Verify status
bun run migrate:status
```

## Migration Best Practices

### 1. Always Include Down Migrations

```typescript
export const up = `
  ALTER TABLE users ADD COLUMN phone VARCHAR(20);
`;

export const down = `
  ALTER TABLE users DROP COLUMN phone;
`;
```

### 2. Use Transactions for Complex Changes

The migration system automatically wraps each batch in a transaction, but you can also use explicit transactions within migrations:

```typescript
export const up = `
  BEGIN;

  ALTER TABLE users ADD COLUMN temp_column TEXT;
  UPDATE users SET temp_column = 'default_value';
  ALTER TABLE users ALTER COLUMN temp_column SET NOT NULL;

  COMMIT;
`;
```

### 3. Handle Data Migrations Carefully

```typescript
export const up = `
  -- Add the new column
  ALTER TABLE users ADD COLUMN full_name VARCHAR(500);

  -- Migrate existing data
  UPDATE users
  SET full_name = CONCAT(given_name, ' ', family_name)
  WHERE given_name IS NOT NULL AND family_name IS NOT NULL;

  -- Add constraints after data migration
  ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
`;
```

### 4. Create Indexes Concurrently (PostgreSQL 11+)

```typescript
export const up = `
  CREATE INDEX CONCURRENTLY idx_users_email_active
  ON users(email) WHERE active = true;
`;

export const down = `
  DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_active;
`;
```

## Advanced Usage

### Custom Migration Configuration

```typescript
import { DatabaseMigrator } from "./db/migrator";

const migrator = new DatabaseMigrator({
  host: "custom-host",
  port: 5433,
  database: "custom-db",
  username: "custom-user",
  password: "custom-pass",
});

await migrator.migrate();
```

### Programmatic Usage

```typescript
import { DatabaseMigrator } from "./db/migrator";

const migrator = new DatabaseMigrator();

// Run migrations
await migrator.migrate();

// Check status
await migrator.status();

// Rollback
await migrator.rollback();

// Clean up
await migrator.close();
```

## Integration with Docker

The migration system works seamlessly with the Docker Compose setup:

```bash
# Start services
./scripts/docker.sh start

# Run migrations
bun run migrate:up

# Check PostgreSQL directly
./scripts/docker.sh psql
```

## Database Schema State Tracking

The system creates a `migrations` table to track state:

```sql
CREATE TABLE migrations (
  id VARCHAR(255) PRIMARY KEY,           -- Migration ID (001, 002, etc.)
  name VARCHAR(255) NOT NULL,            -- Migration name
  executed_at TIMESTAMP WITH TIME ZONE, -- When it was executed
  batch INTEGER NOT NULL                 -- Batch number for rollbacks
);
```

## Troubleshooting

### Migration Fails

```bash
# Check the error message and fix the migration file
# The transaction is automatically rolled back
bun run migrate:status  # Check current state
```

### Out of Sync Migrations

```bash
# Check status first
bun run migrate:status

# If needed, manually mark migrations as executed
# (Connect to database and update migrations table)
```

### Reset Everything (Development Only)

```bash
# WARNING: This destroys all data
bun run migrate:reset
bun run migrate:up
```

## Production Considerations

1. **Always backup before running migrations**
2. **Test migrations on staging first**
3. **Run migrations during maintenance windows**
4. **Monitor migration performance on large tables**
5. **Consider using `CONCURRENTLY` for index creation**
6. **Plan rollback strategies for complex migrations**

## Examples

### Adding a New Table

```typescript
// bun run migrate:create create_posts_table
export const up = `
  CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_posts_user_id ON posts(user_id);
  CREATE INDEX idx_posts_published ON posts(published);
`;

export const down = `
  DROP TABLE posts;
`;
```

### Adding a Column

```typescript
// bun run migrate:create add_avatar_url_to_users
export const up = `
  ALTER TABLE users
  ADD COLUMN avatar_url VARCHAR(500);
`;

export const down = `
  ALTER TABLE users
  DROP COLUMN avatar_url;
`;
```

### Creating an Index

```typescript
// bun run migrate:create add_email_index_to_users
export const up = `
  CREATE INDEX CONCURRENTLY idx_users_email_lower
  ON users(LOWER(email));
`;

export const down = `
  DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_lower;
`;
```
