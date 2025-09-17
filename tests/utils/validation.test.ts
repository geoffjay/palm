import { describe, expect, test } from "bun:test";

// Simple validation utilities to test
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const formatMeasurementValue = (value: string, unit: string): string => {
  return `${value} ${unit}`;
};

describe("Utility Functions", () => {
  describe("isValidEmail", () => {
    test("should return true for valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("email+tag@example.org")).toBe(true);
    });

    test("should return false for invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    test("should return true for valid URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
      expect(isValidUrl("https://api.example.com/v1/endpoint")).toBe(true);
    });

    test("should return false for invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("just-text")).toBe(false);
    });
  });

  describe("formatMeasurementValue", () => {
    test("should format measurement values correctly", () => {
      expect(formatMeasurementValue("120", "mmHg")).toBe("120 mmHg");
      expect(formatMeasurementValue("72", "bpm")).toBe("72 bpm");
      expect(formatMeasurementValue("70.5", "kg")).toBe("70.5 kg");
    });

    test("should handle edge cases", () => {
      expect(formatMeasurementValue("0", "units")).toBe("0 units");
      expect(formatMeasurementValue("", "units")).toBe(" units");
    });
  });
});
