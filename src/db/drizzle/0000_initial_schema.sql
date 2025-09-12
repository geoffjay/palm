-- Initial schema migration
-- This matches the existing database structure from your custom migrations

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"given_name" varchar(255),
	"family_name" varchar(255),
	"picture" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login" timestamp with time zone,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip_address" inet,
	"last_activity" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_id_unique" UNIQUE("session_id")
);

DO $$ BEGIN
 ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_users_google_id" ON "users" ("google_id");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_session_id" ON "user_sessions" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions" ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_last_activity" ON "user_sessions" ("last_activity");
