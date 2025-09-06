/**
 * Database Migration System using postgres library with Bun
 * TypeScript-first migration runner with state tracking
 */

import postgres from "postgres";

interface Migration {
	id: string;
	name: string;
	up: string;
	down?: string;
	createdAt: Date;
}

interface MigrationRecord {
	id: string;
	name: string;
	executed_at: Date;
	batch: number;
}

export interface MigrationConfig {
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
}

export class DatabaseMigrator {
  private db: postgres.Sql;
  private config: MigrationConfig;

  constructor(config?: Partial<MigrationConfig>) {
    this.config = {
      host: config?.host || process.env.DB_HOST || "localhost",
      port: config?.port || parseInt(process.env.DB_PORT || "5432"),
      database: config?.database || process.env.DB_NAME || "simplify",
      username: config?.username || process.env.DB_USER || "user",
      password: config?.password || process.env.DB_PASSWORD || "password",
    };

    // Initialize postgres connection
    this.db = postgres({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      username: this.config.username,
      password: this.config.password,
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

	/**
	 * Initialize the migrations table
	 */
	async initialize(): Promise<void> {
		console.log("🔧 Initializing migration system...");

		    try {
      await this.db`
        CREATE TABLE IF NOT EXISTS migrations (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          batch INTEGER NOT NULL
        );
      `;
      
      await this.db`
        CREATE INDEX IF NOT EXISTS idx_migrations_batch ON migrations(batch);
      `;
      
      await this.db`
        CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON migrations(executed_at);
      `;
      
      console.log("✅ Migration system initialized");
    } catch (error) {
      console.error("❌ Failed to initialize migration system:", error);
      throw error;
    }
	}

	/**
	 * Load migration files from the migrations directory
	 */
	  async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = "./src/db/migrations";
    const glob = new Bun.Glob("*.ts");
    const files = Array.from(glob.scanSync(migrationsDir)).sort();
    
    const migrations: Migration[] = [];
    
    for (const file of files) {
      const filePath = new URL(`./migrations/${file}`, import.meta.url).pathname;
      
      try {
        // Dynamic import of migration file
        const migrationModule = await import(filePath);

				// Extract migration ID and name from filename
				const match = file.match(/^(\d{3})_(.+)\.ts$/);
				if (!match) {
					console.warn(`⚠️ Skipping invalid migration filename: ${file}`);
					continue;
				}

				const [, id, name] = match;
				const createdAt = new Date(Bun.file(filePath).lastModified);

				migrations.push({
					id,
					name: name.replace(/_/g, " "),
					up: migrationModule.up,
					down: migrationModule.down,
					createdAt,
				});
			} catch (error) {
				console.error(`❌ Failed to load migration ${file}:`, error);
				throw error;
			}
		}

		return migrations;
	}

	/**
	 * Get executed migrations from the database
	 */
	  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    try {
      const result = await this.db`
        SELECT id, name, executed_at, batch 
        FROM migrations 
        ORDER BY batch ASC, executed_at ASC
      `;
      
      return result || [];
    } catch (error) {
      console.error("❌ Failed to get executed migrations:", error);
      throw error;
    }
  }

	/**
	 * Get pending migrations
	 */
	async getPendingMigrations(): Promise<Migration[]> {
		const allMigrations = await this.loadMigrations();
		const executedMigrations = await this.getExecutedMigrations();
		const executedIds = new Set(executedMigrations.map((m) => m.id));

		return allMigrations.filter((migration) => !executedIds.has(migration.id));
	}

	/**
	 * Get the next batch number
	 */
	  async getNextBatch(): Promise<number> {
    try {
      const result = await this.db`
        SELECT COALESCE(MAX(batch), 0) + 1 as next_batch 
        FROM migrations
      `;
      
      return result[0]?.next_batch || 1;
    } catch (error) {
      console.error("❌ Failed to get next batch number:", error);
      throw error;
    }
  }

	/**
	 * Run pending migrations
	 */
	async migrate(): Promise<void> {
		await this.initialize();

		const pendingMigrations = await this.getPendingMigrations();

		if (pendingMigrations.length === 0) {
			console.log("✅ No pending migrations");
			return;
		}

		console.log(`🚀 Running ${pendingMigrations.length} migration(s)...`);

		const batch = await this.getNextBatch();

		try {
			// Use transaction
			await this.db.begin(async sql => {
				for (const migration of pendingMigrations) {
					console.log(
						`⏳ Running migration: ${migration.id}_${migration.name.replace(/ /g, "_")}`,
					);

					// Execute migration
					await sql.unsafe(migration.up);

					// Record migration
					await sql`
						INSERT INTO migrations (id, name, batch) 
						VALUES (${migration.id}, ${migration.name}, ${batch})
					`;

					console.log(
						`✅ Completed migration: ${migration.id}_${migration.name.replace(/ /g, "_")}`,
					);
				}
			});

			console.log(
				`🎉 Successfully ran ${pendingMigrations.length} migration(s) in batch ${batch}`,
			);
		} catch (error) {
			console.error("❌ Migration failed, transaction rolled back:", error);
			throw error;
		}
	}

	/**
	 * Rollback the last batch of migrations
	 */
	async rollback(): Promise<void> {
		await this.initialize();

		try {
			// Get the latest batch
			const result = await this.db`
        SELECT MAX(batch) as latest_batch 
        FROM migrations
      `;

			const latestBatch = result[0]?.latest_batch;

			if (!latestBatch) {
				console.log("✅ No migrations to rollback");
				return;
			}

			// Get migrations from the latest batch
			const batchMigrations = await this.db`
        SELECT id, name 
        FROM migrations 
        WHERE batch = ${latestBatch} 
        ORDER BY executed_at DESC
      `;

			if (!batchMigrations || batchMigrations.length === 0) {
				console.log("✅ No migrations to rollback");
				return;
			}

			console.log(
				`🔄 Rolling back batch ${latestBatch} (${batchMigrations.length} migration(s))...`,
			);

			// Load all migrations to get down scripts
			const allMigrations = await this.loadMigrations();
			const migrationMap = new Map(allMigrations.map((m) => [m.id, m]));

			// Use transaction
			await this.db.begin(async sql => {

			for (const record of batchMigrations) {
				const migration = migrationMap.get(record.id);

				if (!migration?.down) {
					console.warn(`⚠️ No down migration for: ${record.id}_${record.name}`);
					continue;
				}

				console.log(
					`⏳ Rolling back: ${record.id}_${record.name.replace(/ /g, "_")}`,
				);

				// Execute rollback
				await sql.unsafe(migration.down);

				// Remove migration record
				await sql`
          DELETE FROM migrations 
          WHERE id = ${record.id}
        `;

				console.log(
					`✅ Rolled back: ${record.id}_${record.name.replace(/ /g, "_")}`,
				);
			}

						});

			console.log(`🎉 Successfully rolled back batch ${latestBatch}`);
		} catch (error) {
			console.error("❌ Rollback failed, transaction rolled back:", error);
			throw error;
		}
	}

	/**
	 * Get migration status
	 */
	async status(): Promise<void> {
		await this.initialize();

		const allMigrations = await this.loadMigrations();
		const executedMigrations = await this.getExecutedMigrations();
		const executedIds = new Set(executedMigrations.map((m) => m.id));

		console.log("\n📊 Migration Status:");
		console.log("===================");

		if (allMigrations.length === 0) {
			console.log("No migrations found");
			return;
		}

		for (const migration of allMigrations) {
			const isExecuted = executedIds.has(migration.id);
			const status = isExecuted ? "✅ Executed" : "⏳ Pending";
			const executedInfo = isExecuted
				? ` (batch: ${executedMigrations.find((m) => m.id === migration.id)?.batch})`
				: "";

			console.log(
				`${status} ${migration.id}_${migration.name.replace(/ /g, "_")}${executedInfo}`,
			);
		}

		const pendingCount = allMigrations.length - executedMigrations.length;
		console.log(
			`\nTotal: ${allMigrations.length} | Executed: ${executedMigrations.length} | Pending: ${pendingCount}`,
		);
	}

	/**
	 * Reset all migrations (WARNING: destructive)
	 */
	async reset(): Promise<void> {
		console.log(
			"⚠️ WARNING: This will reset all migrations and may cause data loss!",
		);

		try {
			await this.db.begin(async sql => {
				// Drop migrations table
				await sql`DROP TABLE IF EXISTS migrations`;

				console.log("✅ Migration table dropped");
			});

			// Re-initialize
			await this.initialize();

			console.log("🎉 Migration system reset complete");
		} catch (error) {
			console.error("❌ Reset failed:", error);
			throw error;
		}
	}

	/**
	 * Close database connection
	 */
	async close(): Promise<void> {
		if (this.db) {
			await this.db.end();
		}
	}
}
