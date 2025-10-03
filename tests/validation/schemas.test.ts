import { describe, expect, test } from "bun:test";
import {
  createMeasurementSchema,
  updateMeasurementSchema,
  deleteMeasurementSchema,
  updateUserProfileSchema,
  paginationSchema,
} from "../../src/validation/schemas";

describe("Validation Schemas", () => {
  describe("createMeasurementSchema", () => {
    test("should validate simple measurement with value", () => {
      const input = {
        typeName: "heart_rate",
        value: "72",
        measuredAt: new Date().toISOString(),
        notes: "Resting heart rate",
      };

      const result = createMeasurementSchema.parse(input);
      expect(result.typeName).toBe("heart_rate");
      expect(result.value).toBe("72");
      expect(result.notes).toBe("Resting heart rate");
    });

    test("should validate blood pressure measurement", () => {
      const input = {
        typeName: "blood_pressure",
        systolic: 120,
        diastolic: 80,
        measuredAt: new Date().toISOString(),
      };

      const result = createMeasurementSchema.parse(input);
      expect(result.typeName).toBe("blood_pressure");
      expect(result.systolic).toBe(120);
      expect(result.diastolic).toBe(80);
    });

    test("should convert string blood pressure values to numbers", () => {
      const input = {
        typeName: "blood_pressure",
        systolic: "120",
        diastolic: "80",
      };

      const result = createMeasurementSchema.parse(input);
      expect(typeof result.systolic).toBe("number");
      expect(typeof result.diastolic).toBe("number");
      expect(result.systolic).toBe(120);
      expect(result.diastolic).toBe(80);
    });

    test("should reject missing both value and blood pressure", () => {
      const input = {
        typeName: "heart_rate",
      };

      expect(() => createMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject invalid measurement type format", () => {
      const input = {
        typeName: "Heart Rate", // Should be lowercase with underscores
        value: "72",
      };

      expect(() => createMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject systolic out of range", () => {
      const input = {
        typeName: "blood_pressure",
        systolic: 350, // Too high
        diastolic: 80,
      };

      expect(() => createMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject diastolic out of range", () => {
      const input = {
        typeName: "blood_pressure",
        systolic: 120,
        diastolic: 250, // Too high
      };

      expect(() => createMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject blood pressure with only systolic", () => {
      const input = {
        typeName: "blood_pressure",
        systolic: 120,
      };

      expect(() => createMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject blood pressure with only diastolic", () => {
      const input = {
        typeName: "blood_pressure",
        diastolic: 80,
      };

      expect(() => createMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject notes exceeding max length", () => {
      const input = {
        typeName: "heart_rate",
        value: "72",
        notes: "a".repeat(1001), // 1001 characters
      };

      expect(() => createMeasurementSchema.parse(input)).toThrow();
    });

    test("should accept notes at max length", () => {
      const input = {
        typeName: "heart_rate",
        value: "72",
        notes: "a".repeat(1000), // Exactly 1000 characters
      };

      const result = createMeasurementSchema.parse(input);
      expect(result.notes?.length).toBe(1000);
    });

    test("should handle date string conversion", () => {
      const dateString = "2024-01-15T10:30:00.000Z";
      const input = {
        typeName: "heart_rate",
        value: "72",
        measuredAt: dateString,
      };

      const result = createMeasurementSchema.parse(input);
      expect(result.measuredAt).toBeInstanceOf(Date);
    });

    test("should reject invalid date format", () => {
      const input = {
        typeName: "heart_rate",
        value: "72",
        measuredAt: "invalid-date",
      };

      expect(() => createMeasurementSchema.parse(input)).toThrow();
    });
  });

  describe("updateMeasurementSchema", () => {
    test("should validate partial update", () => {
      const input = {
        value: "75",
      };

      const result = updateMeasurementSchema.parse(input);
      expect(result.value).toBe("75");
    });

    test("should validate blood pressure update", () => {
      const input = {
        systolic: 125,
        diastolic: 85,
      };

      const result = updateMeasurementSchema.parse(input);
      expect(result.systolic).toBe(125);
      expect(result.diastolic).toBe(85);
    });

    test("should reject systolic below minimum", () => {
      const input = {
        systolic: 30, // Below 40
      };

      expect(() => updateMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject diastolic below minimum", () => {
      const input = {
        diastolic: 15, // Below 20
      };

      expect(() => updateMeasurementSchema.parse(input)).toThrow();
    });
  });

  describe("deleteMeasurementSchema", () => {
    test("should validate numeric ID", () => {
      const input = { id: 123 };
      const result = deleteMeasurementSchema.parse(input);
      expect(result.id).toBe(123);
    });

    test("should convert string ID to number", () => {
      const input = { id: "456" };
      const result = deleteMeasurementSchema.parse(input);
      expect(typeof result.id).toBe("number");
      expect(result.id).toBe(456);
    });

    test("should reject negative ID", () => {
      const input = { id: -1 };
      expect(() => deleteMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject zero ID", () => {
      const input = { id: 0 };
      expect(() => deleteMeasurementSchema.parse(input)).toThrow();
    });

    test("should reject non-numeric string ID", () => {
      const input = { id: "abc" };
      expect(() => deleteMeasurementSchema.parse(input)).toThrow();
    });
  });

  describe("updateUserProfileSchema", () => {
    test("should validate name update", () => {
      const input = { name: "John Doe" };
      const result = updateUserProfileSchema.parse(input);
      expect(result.name).toBe("John Doe");
    });

    test("should validate email update", () => {
      const input = { email: "john@example.com" };
      const result = updateUserProfileSchema.parse(input);
      expect(result.email).toBe("john@example.com");
    });

    test("should reject invalid email format", () => {
      const input = { email: "not-an-email" };
      expect(() => updateUserProfileSchema.parse(input)).toThrow();
    });

    test("should reject empty name", () => {
      const input = { name: "" };
      expect(() => updateUserProfileSchema.parse(input)).toThrow();
    });

    test("should reject name exceeding max length", () => {
      const input = { name: "a".repeat(101) };
      expect(() => updateUserProfileSchema.parse(input)).toThrow();
    });
  });

  describe("paginationSchema", () => {
    test("should use default values when not provided", () => {
      const input = {};
      const result = paginationSchema.parse(input);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    test("should validate custom page and limit", () => {
      const input = { page: 3, limit: 50 };
      const result = paginationSchema.parse(input);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
    });

    test("should convert string values to numbers", () => {
      const input = { page: "2", limit: "30" };
      const result = paginationSchema.parse(input);
      expect(typeof result.page).toBe("number");
      expect(typeof result.limit).toBe("number");
      expect(result.page).toBe(2);
      expect(result.limit).toBe(30);
    });

    test("should reject page less than 1", () => {
      const input = { page: 0 };
      expect(() => paginationSchema.parse(input)).toThrow();
    });

    test("should reject limit less than 1", () => {
      const input = { limit: 0 };
      expect(() => paginationSchema.parse(input)).toThrow();
    });

    test("should reject limit greater than 100", () => {
      const input = { limit: 101 };
      expect(() => paginationSchema.parse(input)).toThrow();
    });

    test("should accept limit at maximum", () => {
      const input = { limit: 100 };
      const result = paginationSchema.parse(input);
      expect(result.limit).toBe(100);
    });
  });
});
