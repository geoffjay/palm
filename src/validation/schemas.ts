/**
 * Validation schemas using Zod for API request validation
 */

import { z } from "zod";

/**
 * Schema for creating a biometric measurement
 */
export const createMeasurementSchema = z
  .object({
    typeName: z
      .string()
      .min(1, "Measurement type is required")
      .max(100, "Measurement type too long")
      .regex(/^[a-z_]+$/, "Invalid measurement type format"),
    value: z.string().optional(),
    systolic: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), "Systolic must be a valid number")
      .refine((val) => val >= 40 && val <= 300, "Systolic must be between 40 and 300")
      .optional(),
    diastolic: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), "Diastolic must be a valid number")
      .refine((val) => val >= 20 && val <= 200, "Diastolic must be between 20 and 200")
      .optional(),
    measuredAt: z
      .union([z.string().datetime(), z.date(), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        const date = new Date(val);
        if (isNaN(date.getTime())) throw new Error("Invalid date format");
        return date;
      }),
    notes: z.string().max(1000, "Notes too long (max 1000 characters)").optional(),
  })
  .refine(
    (data) => {
      // Either value OR both systolic and diastolic must be provided
      const hasValue = data.value !== undefined && data.value !== "";
      const hasBloodPressure = data.systolic !== undefined && data.diastolic !== undefined;
      return hasValue || hasBloodPressure;
    },
    {
      message: "Either value or blood pressure readings (systolic and diastolic) required",
    },
  )
  .refine(
    (data) => {
      // For blood pressure, both systolic and diastolic must be provided together
      if (data.systolic !== undefined || data.diastolic !== undefined) {
        return data.systolic !== undefined && data.diastolic !== undefined;
      }
      return true;
    },
    {
      message: "Both systolic and diastolic values required for blood pressure",
    },
  );

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;

/**
 * Schema for updating a biometric measurement
 */
export const updateMeasurementSchema = z.object({
  value: z.string().optional(),
  systolic: z
    .number()
    .min(40, "Systolic must be at least 40")
    .max(300, "Systolic cannot exceed 300")
    .optional(),
  diastolic: z
    .number()
    .min(20, "Diastolic must be at least 20")
    .max(200, "Diastolic cannot exceed 200")
    .optional(),
  measuredAt: z.union([z.string().datetime(), z.date()]).optional(),
  notes: z.string().max(1000, "Notes too long (max 1000 characters)").optional(),
});

export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;

/**
 * Schema for deleting a measurement (ID validation)
 */
export const deleteMeasurementSchema = z.object({
  id: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => !isNaN(val) && val > 0, "Invalid measurement ID"),
});

export type DeleteMeasurementInput = z.infer<typeof deleteMeasurementSchema>;

/**
 * Schema for updating user profile
 */
export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  email: z.string().email("Invalid email format").optional(),
  givenName: z.string().max(50, "Given name too long").optional(),
  familyName: z.string().max(50, "Family name too long").optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

/**
 * Schema for integration sync parameters
 */
export const syncIntegrationSchema = z.object({
  since: z
    .union([z.string().datetime(), z.date()])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (val instanceof Date) return val;
      return new Date(val);
    }),
});

export type SyncIntegrationInput = z.infer<typeof syncIntegrationSchema>;

/**
 * Schema for pagination parameters
 */
export const paginationSchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => !isNaN(val) && val >= 1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, "Limit must be between 1 and 100")
    .optional()
    .default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
