# Database Setup with Drizzle ORM

This project now uses [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations, replacing the custom migration system.

## Quick Start

### 1. Database Operations

```bash
# Generate migrations from schema changes
bun run db:generate

# Push schema directly to database (development)
bun run db:push

# Run migrations
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio

# Pull schema from existing database
bun run db:pull
```

### 2. Using the Database in Code

```typescript
// Import the database instance and services
import { db } from "./db";
import { userService } from "./db/services";

// Direct Drizzle queries
const users = await db.select().from(schema.users);

// Or use the service layer (recommended)
const user = await userService.findByEmail("user@example.com");
```

## Schema Management

- **Schema Definition**: `db/schema.ts` - Define your database schema using Drizzle's type-safe schema builder
- **Generated Migrations**: `db/drizzle/` - Auto-generated SQL migrations from schema changes
- **Services**: `db/services/` - Business logic layer for database operations

## Environment Variables

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=palm
DB_USER=user
DB_PASSWORD=password
```

## Migration Workflow

1. **Modify Schema**: Update `db/schema.ts` with your changes
2. **Generate Migration**: Run `bun run db:generate` to create migration files
3. **Apply Migration**: Run `bun run db:migrate` to apply changes to database

## Services

The project includes pre-built services for common operations:

- **UserService**: User management (create, find, update, delete)
- **SessionService**: Session tracking (optional, since Redis is used for sessions)

## Type Safety

All database operations are fully type-safe:

```typescript
// TypeScript will enforce correct types
const newUser: NewUser = {
  googleId: "123456789",
  email: "user@example.com",
  name: "John Doe",
  // TypeScript will error if required fields are missing
};

const user = await userService.createUser(newUser);
// user is typed as User with all fields including id, createdAt, etc.
```

## Drizzle Studio

Access the database GUI at `http://localhost:4983` when running `bun run db:studio`.
