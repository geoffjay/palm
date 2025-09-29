/**
 * Drizzle ORM Database Schema
 * Replaces custom migration system with type-safe schema definitions
 */

import { relations } from "drizzle-orm";
import { boolean, decimal, index, inet, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Users table for storing OAuth user information
 */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    googleId: varchar("google_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    givenName: varchar("given_name", { length: 255 }),
    familyName: varchar("family_name", { length: 255 }),
    picture: varchar("picture", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
  },
  (table) => {
    return {
      googleIdIdx: index("idx_users_google_id").on(table.googleId),
      emailIdx: index("idx_users_email").on(table.email),
    };
  },
);

/**
 * User sessions table for storing session metadata
 * Optional since Redis is used for session storage
 */
export const userSessions = pgTable(
  "user_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: inet("ip_address"),
    lastActivity: timestamp("last_activity", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      sessionIdIdx: index("idx_user_sessions_session_id").on(table.sessionId),
      userIdIdx: index("idx_user_sessions_user_id").on(table.userId),
      expiresAtIdx: index("idx_user_sessions_expires_at").on(table.expiresAt),
      lastActivityIdx: index("idx_user_sessions_last_activity").on(table.lastActivity),
    };
  },
);

/**
 * Biometric measurement types table
 * Defines what types of measurements can be recorded
 */
export const biometricMeasurementTypes = pgTable(
  "biometric_measurement_types",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    requiresSubtype: boolean("requires_subtype").notNull().default(false),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      nameIdx: index("idx_biometric_measurement_types_name").on(table.name),
    };
  },
);

/**
 * Biometric measurement subtypes table
 * For complex measurements like blood pressure (systolic/diastolic)
 */
export const biometricMeasurementSubtypes = pgTable(
  "biometric_measurement_subtypes",
  {
    id: serial("id").primaryKey(),
    measurementTypeId: integer("measurement_type_id")
      .notNull()
      .references(() => biometricMeasurementTypes.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      typeIdIdx: index("idx_biometric_measurement_subtypes_type_id").on(table.measurementTypeId),
      nameIdx: index("idx_biometric_measurement_subtypes_name").on(table.name),
    };
  },
);

/**
 * Biometric measurements table
 * Stores actual measurement values with timestamps
 */
export const biometricMeasurements = pgTable(
  "biometric_measurements",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    measurementTypeId: integer("measurement_type_id")
      .notNull()
      .references(() => biometricMeasurementTypes.id, { onDelete: "restrict" }),
    measurementSubtypeId: integer("measurement_subtype_id").references(() => biometricMeasurementSubtypes.id, {
      onDelete: "restrict",
    }),
    value: decimal("value", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("idx_biometric_measurements_user_id").on(table.userId),
      typeIdIdx: index("idx_biometric_measurements_type_id").on(table.measurementTypeId),
      measuredAtIdx: index("idx_biometric_measurements_measured_at").on(table.measuredAt),
      userTypeIdx: index("idx_biometric_measurements_user_type").on(table.userId, table.measurementTypeId),
    };
  },
);

/**
 * Define relationships between tables
 */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  biometricMeasurements: many(biometricMeasurements),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const biometricMeasurementTypesRelations = relations(biometricMeasurementTypes, ({ many }) => ({
  subtypes: many(biometricMeasurementSubtypes),
  measurements: many(biometricMeasurements),
}));

export const biometricMeasurementSubtypesRelations = relations(biometricMeasurementSubtypes, ({ one, many }) => ({
  measurementType: one(biometricMeasurementTypes, {
    fields: [biometricMeasurementSubtypes.measurementTypeId],
    references: [biometricMeasurementTypes.id],
  }),
  measurements: many(biometricMeasurements),
}));

export const biometricMeasurementsRelations = relations(biometricMeasurements, ({ one }) => ({
  user: one(users, {
    fields: [biometricMeasurements.userId],
    references: [users.id],
  }),
  measurementType: one(biometricMeasurementTypes, {
    fields: [biometricMeasurements.measurementTypeId],
    references: [biometricMeasurementTypes.id],
  }),
  measurementSubtype: one(biometricMeasurementSubtypes, {
    fields: [biometricMeasurements.measurementSubtypeId],
    references: [biometricMeasurementSubtypes.id],
  }),
}));

/**
 * Data source connections table for storing external integrations
 */
export const dataSourceConnections = pgTable(
  "data_source_connections",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id", { length: 50 }).notNull(), // 'google_fit', 'apple_health', etc.
    providerUserId: varchar("provider_user_id", { length: 255 }), // External user ID if available
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    scopes: text("scopes"), // JSON array of granted scopes
    isActive: boolean("is_active").default(true).notNull(),
    connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    syncStatus: varchar("sync_status", { length: 20 }).default("active"), // 'active', 'error', 'paused'
    syncError: text("sync_error"), // Last sync error message
    metadata: text("metadata"), // JSON for provider-specific data
  },
  (table) => {
    return {
      userProviderIdx: index("idx_data_source_user_provider").on(table.userId, table.providerId),
      providerIdx: index("idx_data_source_provider").on(table.providerId),
      activeIdx: index("idx_data_source_active").on(table.isActive),
    };
  },
);

/**
 * Type exports for use throughout the application
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type BiometricMeasurementType = typeof biometricMeasurementTypes.$inferSelect;
export type NewBiometricMeasurementType = typeof biometricMeasurementTypes.$inferInsert;
export type BiometricMeasurementSubtype = typeof biometricMeasurementSubtypes.$inferSelect;
export type NewBiometricMeasurementSubtype = typeof biometricMeasurementSubtypes.$inferInsert;
export type BiometricMeasurement = typeof biometricMeasurements.$inferSelect;
export type NewBiometricMeasurement = typeof biometricMeasurements.$inferInsert;

export type DataSourceConnection = typeof dataSourceConnections.$inferSelect;
export type NewDataSourceConnection = typeof dataSourceConnections.$inferInsert;
