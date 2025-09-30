/**
 * Custom hooks for biometric data management
 * Uses API endpoints instead of direct database access to work in browser
 */

import { useCallback, useEffect } from "react";
import { useBiometricStore } from "../stores/biometricStore";

// API helper functions
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Main hook for biometric data management
 */
export function useBiometrics() {
  const {
    measurementTypes,
    measurementSubtypes,
    loading,
    error,
    setMeasurements,
    setMeasurementTypes,
    setMeasurementSubtypes,
    setLoading,
    setError,
    getFilteredMeasurements,
    getChartDataForType,
    getBloodPressureData,
  } = useBiometricStore();

  // Load measurement types
  const loadMeasurementTypes = useCallback(async () => {
    try {
      setLoading("types", true);
      setError(null);

      const data = await fetchWithAuth("/api/biometrics/types");
      setMeasurementTypes(data.types);

      // Load subtypes for each type
      const allSubtypes = [];
      for (const type of data.types) {
        if (type.requiresSubtype) {
          try {
            const subtypeData = await fetchWithAuth(`/api/biometrics/subtypes/${type.id}`);
            allSubtypes.push(...subtypeData.subtypes);
          } catch (err) {
            console.warn(`Failed to load subtypes for type ${type.id}:`, err);
          }
        }
      }
      setMeasurementSubtypes(allSubtypes);
    } catch (err) {
      console.error("Failed to load measurement types:", err);
      setError("Failed to load measurement types");
    } finally {
      setLoading("types", false);
    }
  }, [setLoading, setError, setMeasurementTypes, setMeasurementSubtypes]);

  // Load user measurements
  const loadMeasurements = useCallback(async () => {
    try {
      setLoading("measurements", true);
      setError(null);

      const data = await fetchWithAuth("/api/biometrics/measurements");
      setMeasurements(data.measurements);
    } catch (err) {
      console.error("Failed to load measurements:", err);
      setError("Failed to load measurements");
    } finally {
      setLoading("measurements", false);
    }
  }, [setLoading, setError, setMeasurements]);

  // Initialize data on mount
  useEffect(() => {
    loadMeasurementTypes();
    loadMeasurements();
  }, [loadMeasurementTypes, loadMeasurements]);

  return {
    // Data
    measurements: getFilteredMeasurements(),
    measurementTypes,
    measurementSubtypes,

    // Loading states
    loading,
    error,

    // Chart data
    getChartDataForType,
    getBloodPressureData,

    // Actions
    refetch: () => {
      loadMeasurementTypes();
      loadMeasurements();
    },
    refetchMeasurements: loadMeasurements,
  };
}

/**
 * Hook for adding new measurements
 */
export function useAddMeasurement() {
  const { addMeasurement, setLoading, setError, closeAddDialog } = useBiometricStore();

  const addSimpleMeasurement = useCallback(
    async (typeName: string, value: number, measuredAt: Date = new Date(), notes?: string) => {
      try {
        setLoading("adding", true);
        setError(null);

        const data = await fetchWithAuth("/api/biometrics/measurements", {
          method: "POST",
          body: JSON.stringify({
            typeName,
            value,
            measuredAt: measuredAt.toISOString(),
            notes,
          }),
        });

        addMeasurement(data.measurement);
        closeAddDialog();

        return data.measurement;
      } catch (err) {
        console.error("Failed to add measurement:", err);
        setError(err instanceof Error ? err.message : "Failed to add measurement");
        throw err;
      } finally {
        setLoading("adding", false);
      }
    },
    [addMeasurement, setLoading, setError, closeAddDialog],
  );

  const addBloodPressure = useCallback(
    async (reading: { systolic: number; diastolic: number; measuredAt?: Date; notes?: string }) => {
      try {
        setLoading("adding", true);
        setError(null);

        const data = await fetchWithAuth("/api/biometrics/measurements", {
          method: "POST",
          body: JSON.stringify({
            typeName: "blood_pressure",
            systolic: reading.systolic,
            diastolic: reading.diastolic,
            measuredAt: (reading.measuredAt || new Date()).toISOString(),
            notes: reading.notes,
          }),
        });

        // Add both systolic and diastolic measurements
        for (const measurement of data.measurements) {
          addMeasurement(measurement);
        }
        closeAddDialog();

        return data.measurements;
      } catch (err) {
        console.error("Failed to add blood pressure:", err);
        setError(err instanceof Error ? err.message : "Failed to add blood pressure");
        throw err;
      } finally {
        setLoading("adding", false);
      }
    },
    [addMeasurement, setLoading, setError, closeAddDialog],
  );

  return {
    addSimpleMeasurement,
    addBloodPressure,
    isAdding: useBiometricStore((state) => state.loading.adding),
  };
}

/**
 * Hook for heart rate specific data
 */
export function useHeartRate() {
  const { getChartDataForType } = useBiometricStore();

  return {
    chartData: getChartDataForType("heart_rate"),
  };
}

/**
 * Hook for blood pressure specific data
 */
export function useBloodPressure() {
  const { getChartDataForType, getBloodPressureData } = useBiometricStore();

  return {
    chartData: getChartDataForType("blood_pressure"),
    combinedData: getBloodPressureData(),
  };
}

/**
 * Hook for step count specific data
 */
export function useSteps() {
  const { getFilteredMeasurements, getMeasurementTypeByName } = useBiometricStore();

  const stepsType = getMeasurementTypeByName("steps");
  const stepMeasurements = getFilteredMeasurements().filter((m) => stepsType && m.measurementTypeId === stepsType.id);

  // Transform data for calendar chart
  const calendarData = stepMeasurements.map((m) => ({
    day: m.measuredAt.toISOString().split("T")[0], // YYYY-MM-DD format
    value: Number(m.value),
  }));

  return {
    stepMeasurements,
    calendarData,
  };
}

/**
 * Hook for calories burned specific data
 */
export function useCalories() {
  const { getFilteredMeasurements, getMeasurementTypeByName } = useBiometricStore();

  const caloriesType = getMeasurementTypeByName("calories_burned");
  const calorieMeasurements = getFilteredMeasurements().filter(
    (m) => caloriesType && m.measurementTypeId === caloriesType.id,
  );

  // Get last 7 days of data for bar chart
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentCalories = calorieMeasurements.filter((m) => new Date(m.measuredAt) >= sevenDaysAgo);

  // Group by date and create bar chart data
  const groupedByDate: { [key: string]: number[] } = {};
  recentCalories.forEach((m) => {
    const date = m.measuredAt.toISOString().split("T")[0];
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(Number(m.value));
  });

  // Transform for stacked bar chart
  const barData = Object.entries(groupedByDate).map(([date, values]) => {
    const dayData: { [key: string]: string | number } = { date };
    values.forEach((value, index) => {
      dayData[`measurement_${index + 1}`] = value;
    });
    return dayData;
  });

  return {
    calorieMeasurements,
    recentCalories,
    barData,
  };
}

/**
 * Hook for filtering biometric data
 */
export function useBiometricFilters() {
  const { filters, setDateRange, setSelectedTypes, toggleType, clearFilters, measurementTypes } = useBiometricStore();

  return {
    filters,
    measurementTypes,
    setDateRange,
    setSelectedTypes,
    toggleType,
    clearFilters,
  };
}
