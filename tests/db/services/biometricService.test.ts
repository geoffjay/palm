import { beforeEach, describe, expect, mock, test } from "bun:test";
import { testUtils } from "../../setup";

// Mock the biometric service
mock.module("../../../db/services/biometricService", () => ({
  default: {
    getAllMeasurementTypes: mock(async () => [
      { id: 1, name: "blood_pressure", displayName: "Blood Pressure", unit: "mmHg" },
      { id: 2, name: "heart_rate", displayName: "Heart Rate", unit: "bpm" },
      { id: 3, name: "weight", displayName: "Weight", unit: "kg" },
    ]),

    getSubtypesForType: mock(async (typeId: number) => {
      if (typeId === 1) {
        return [
          { id: 1, name: "systolic", displayName: "Systolic" },
          { id: 2, name: "diastolic", displayName: "Diastolic" },
        ];
      }
      return [];
    }),

    recordSimpleMeasurement: mock(async (userId: number, _typeName: string, value: number) => {
      return {
        ...testUtils.createMockMeasurement(),
        userId,
        value: value.toString(),
      };
    }),

    recordBloodPressure: mock(async (userId: number, data: { systolic: number; diastolic: number }) => {
      return [
        { ...testUtils.createMockMeasurement(), userId, value: data.systolic.toString() },
        { ...testUtils.createMockMeasurement(), userId, value: data.diastolic.toString() },
      ];
    }),

    getUserMeasurementSummary: mock(async (_userId: number) => [
      { type: { name: "heart_rate", displayName: "Heart Rate" }, count: 5 },
      { type: { name: "blood_pressure", displayName: "Blood Pressure" }, count: 3 },
    ]),

    getMeasurementHistory: mock(async (_userId: number, _typeName: string) => [testUtils.createMockMeasurement()]),

    getMeasurementById: mock(async (_id: number) => testUtils.createMockMeasurement()),
  },
}));

describe("BiometricService", () => {
  beforeEach(() => {
    mock.restore();
  });

  test("getAllMeasurementTypes - should return all measurement types", async () => {
    const { default: biometricService } = await import("../../../db/services/biometricService");
    const types = await biometricService.getAllMeasurementTypes();

    expect(types).toHaveLength(3);
    expect(types[0].name).toBe("blood_pressure");
    expect(types[1].name).toBe("heart_rate");
    expect(types[2].name).toBe("weight");
  });

  test("getSubtypesForType - should return subtypes for blood pressure", async () => {
    const { default: biometricService } = await import("../../../db/services/biometricService");
    const subtypes = await biometricService.getSubtypesForType(1);

    expect(subtypes).toHaveLength(2);
    expect(subtypes[0].name).toBe("systolic");
    expect(subtypes[1].name).toBe("diastolic");
  });

  test("getSubtypesForType - should return empty array for simple measurements", async () => {
    const { default: biometricService } = await import("../../../db/services/biometricService");
    const subtypes = await biometricService.getSubtypesForType(2);

    expect(subtypes).toHaveLength(0);
  });

  test("recordSimpleMeasurement - should record heart rate measurement", async () => {
    const { default: biometricService } = await import("../../../db/services/biometricService");
    const measurement = await biometricService.recordSimpleMeasurement(1, "heart_rate", 72);

    expect(measurement.userId).toBe(1);
    expect(measurement.value).toBe("72");
  });

  test("recordBloodPressure - should record both systolic and diastolic", async () => {
    const { default: biometricService } = await import("../../../db/services/biometricService");
    const data = { systolic: 120, diastolic: 80, measuredAt: new Date() };
    const measurements = await biometricService.recordBloodPressure(1, data);

    expect(measurements).toHaveLength(2);
    expect(measurements[0].value).toBe("120");
    expect(measurements[1].value).toBe("80");
  });

  test("getUserMeasurementSummary - should return summary for user", async () => {
    const { default: biometricService } = await import("../../../db/services/biometricService");
    const summary = await biometricService.getUserMeasurementSummary(1);

    expect(summary).toHaveLength(2);
    expect(summary[0].type.name).toBe("heart_rate");
    expect(summary[0].count).toBe(5);
  });

  test("getMeasurementHistory - should return measurement history", async () => {
    const { default: biometricService } = await import("../../../db/services/biometricService");
    const history = await biometricService.getMeasurementHistory(1, "heart_rate");

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(1);
  });
});
