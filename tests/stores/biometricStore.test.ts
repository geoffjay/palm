import { beforeEach, describe, expect, test } from "bun:test";

describe("BiometricStore", () => {
  let useBiometricStore: { getState: () => unknown };

  beforeEach(async () => {
    // Reset the store before each test
    const module = await import("../../src/stores/biometricStore");
    useBiometricStore = module.useBiometricStore;

    // Reset the store state
    const store = useBiometricStore.getState();
    store.setMeasurements([]);
    store.setMeasurementTypes([]);
    store.setError(null);
    store.closeAddDialog();
  });

  test("should initialize with expected state", () => {
    const store = useBiometricStore.getState();

    expect(store.measurements).toEqual([]);
    expect(store.measurementTypes).toEqual([]);
    expect(store.measurementSubtypes).toEqual([]);
    expect(store.isAddDialogOpen).toBe(false);
    expect(store.loading.measurements).toBe(false);
    expect(store.loading.types).toBe(false);
  });

  test("should open and close add dialog", () => {
    const store = useBiometricStore.getState();

    store.openAddDialog();
    expect(useBiometricStore.getState().isAddDialogOpen).toBe(true);

    store.closeAddDialog();
    expect(useBiometricStore.getState().isAddDialogOpen).toBe(false);
  });

  test("should set loading states", () => {
    const store = useBiometricStore.getState();

    store.setLoading("measurements", true);
    expect(useBiometricStore.getState().loading.measurements).toBe(true);

    store.setLoading("types", true);
    expect(useBiometricStore.getState().loading.types).toBe(true);

    store.setLoading("measurements", false);
    expect(useBiometricStore.getState().loading.measurements).toBe(false);
  });

  test("should set and clear error messages", () => {
    const store = useBiometricStore.getState();

    store.setError("Test error message");
    expect(useBiometricStore.getState().error).toBe("Test error message");

    store.setError(null);
    expect(useBiometricStore.getState().error).toBeNull();
  });

  test("should add measurements", () => {
    const store = useBiometricStore.getState();
    const mockMeasurements = [
      {
        id: 1,
        userId: 1,
        measurementTypeId: 1,
        measurementSubtypeId: null,
        value: "120",
        notes: null,
        measuredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    store.setMeasurements(mockMeasurements);
    expect(useBiometricStore.getState().measurements).toHaveLength(1);
    expect(useBiometricStore.getState().measurements[0].value).toBe("120");
  });

  test("should add measurement types", () => {
    const store = useBiometricStore.getState();
    const mockTypes = [
      { id: 1, name: "heart_rate", displayName: "Heart Rate", unit: "bpm" },
      { id: 2, name: "blood_pressure", displayName: "Blood Pressure", unit: "mmHg" },
    ];

    store.setMeasurementTypes(mockTypes);
    expect(useBiometricStore.getState().measurementTypes).toHaveLength(2);
    expect(useBiometricStore.getState().measurementTypes[0].name).toBe("heart_rate");
  });

  test("should filter measurements by type", () => {
    const store = useBiometricStore.getState();
    const mockMeasurements = [
      {
        id: 1,
        userId: 1,
        measurementTypeId: 1,
        measurementSubtypeId: null,
        value: "72",
        notes: null,
        measuredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        measurementTypeId: 2,
        measurementSubtypeId: null,
        value: "120",
        notes: null,
        measuredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    store.setMeasurements(mockMeasurements);
    store.setSelectedTypes(["1"]);

    const filtered = store.getFilteredMeasurements();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].measurementTypeId).toBe(1);
  });

  test("should clear all measurements", () => {
    const store = useBiometricStore.getState();
    const mockMeasurements = [
      {
        id: 1,
        userId: 1,
        measurementTypeId: 1,
        measurementSubtypeId: null,
        value: "72",
        notes: null,
        measuredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    store.setMeasurements(mockMeasurements);
    expect(useBiometricStore.getState().measurements).toHaveLength(1);

    store.setMeasurements([]);
    expect(useBiometricStore.getState().measurements).toHaveLength(0);
  });
});
