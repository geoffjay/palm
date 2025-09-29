CREATE TABLE "data_source_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider_id" varchar(50) NOT NULL,
	"provider_user_id" varchar(255),
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"scopes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sync_at" timestamp with time zone,
	"sync_status" varchar(20) DEFAULT 'active',
	"sync_error" text,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "data_source_connections" ADD CONSTRAINT "data_source_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_data_source_user_provider" ON "data_source_connections" USING btree ("user_id","provider_id");--> statement-breakpoint
CREATE INDEX "idx_data_source_provider" ON "data_source_connections" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_data_source_active" ON "data_source_connections" USING btree ("is_active");