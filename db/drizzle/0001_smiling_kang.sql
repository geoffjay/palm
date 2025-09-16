CREATE TABLE "biometric_measurement_subtypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"measurement_type_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biometric_measurement_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"requires_subtype" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "biometric_measurement_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "biometric_measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"measurement_type_id" integer NOT NULL,
	"measurement_subtype_id" integer,
	"value" numeric(10, 2) NOT NULL,
	"notes" text,
	"measured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biometric_measurement_subtypes" ADD CONSTRAINT "biometric_measurement_subtypes_measurement_type_id_biometric_measurement_types_id_fk" FOREIGN KEY ("measurement_type_id") REFERENCES "public"."biometric_measurement_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometric_measurements" ADD CONSTRAINT "biometric_measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometric_measurements" ADD CONSTRAINT "biometric_measurements_measurement_type_id_biometric_measurement_types_id_fk" FOREIGN KEY ("measurement_type_id") REFERENCES "public"."biometric_measurement_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometric_measurements" ADD CONSTRAINT "biometric_measurements_measurement_subtype_id_biometric_measurement_subtypes_id_fk" FOREIGN KEY ("measurement_subtype_id") REFERENCES "public"."biometric_measurement_subtypes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_biometric_measurement_subtypes_type_id" ON "biometric_measurement_subtypes" USING btree ("measurement_type_id");--> statement-breakpoint
CREATE INDEX "idx_biometric_measurement_subtypes_name" ON "biometric_measurement_subtypes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_biometric_measurement_types_name" ON "biometric_measurement_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_biometric_measurements_user_id" ON "biometric_measurements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_biometric_measurements_type_id" ON "biometric_measurements" USING btree ("measurement_type_id");--> statement-breakpoint
CREATE INDEX "idx_biometric_measurements_measured_at" ON "biometric_measurements" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "idx_biometric_measurements_user_type" ON "biometric_measurements" USING btree ("user_id","measurement_type_id");