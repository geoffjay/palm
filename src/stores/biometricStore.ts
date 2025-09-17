/**
 * Biometric Data Store using Zustand
 * Manages biometric measurements, types, and related state
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { BiometricMeasurement, BiometricMeasurementSubtype, BiometricMeasurementType } from "../../db/index";

export interface BiometricDataPoint {
  x: string | number; // Date or timestamp
  y: number; // Measurement value
  measurement: BiometricMeasurement;
}

export interface BloodPressureDataPoint {
  x: string | number;
  systolic: number;
  diastolic: number;
  measuredAt: Date;
  notes?: string;
}

export interface BiometricChartData {
  id: string;
  data: BiometricDataPoint[];
}

interface BiometricState {
  // Data
  measurements: BiometricMeasurement[];
  measurementTypes: BiometricMeasurementType[];
  measurementSubtypes: BiometricMeasurementSubtype[];

  // Loading states
  loading: {
    measurements: boolean;
    types: boolean;
    adding: boolean;
  };

  // Filters
  filters: {
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    selectedTypes: string[];
  };

  // UI state
  isAddDialogOpen: boolean;

  // Error handling
  error: string | null;
}

interface BiometricActions {
  // Data loading
  setMeasurements: (measurements: BiometricMeasurement[]) => void;
  setMeasurementTypes: (types: BiometricMeasurementType[]) => void;
  setMeasurementSubtypes: (subtypes: BiometricMeasurementSubtype[]) => void;
  addMeasurement: (measurement: BiometricMeasurement) => void;

  // Loading states
  setLoading: (key: keyof BiometricState["loading"], loading: boolean) => void;

  // Filters
  setDateRange: (start: Date | null, end: Date | null) => void;
  setSelectedTypes: (types: string[]) => void;
  toggleType: (typeId: string) => void;
  clearFilters: () => void;

  // UI actions
  openAddDialog: () => void;
  closeAddDialog: () => void;

  // Error handling
  setError: (error: string | null) => void;

  // Computed getters
  getFilteredMeasurements: () => BiometricMeasurement[];
  getChartDataForType: (typeName: string) => BiometricChartData[];
  getBloodPressureData: () => BloodPressureDataPoint[];
  getMeasurementTypeByName: (name: string) => BiometricMeasurementType | undefined;
  getSubtypesForType: (typeId: number) => BiometricMeasurementSubtype[];
}

type BiometricStore = BiometricState & BiometricActions;

export const useBiometricStore = create<BiometricStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    measurements: [],
    measurementTypes: [],
    measurementSubtypes: [],
    loading: {
      measurements: false,
      types: false,
      adding: false,
    },
    filters: {
      dateRange: {
        start: null,
        end: null,
      },
      selectedTypes: [],
    },
    isAddDialogOpen: false,
    error: null,

    // Actions
    setMeasurements: (measurements) => set({ measurements }),

    setMeasurementTypes: (measurementTypes) => set({ measurementTypes }),

    setMeasurementSubtypes: (measurementSubtypes) => set({ measurementSubtypes }),

    addMeasurement: (measurement) =>
      set((state) => ({
        measurements: [measurement, ...state.measurements],
      })),

    setLoading: (key, loading) =>
      set((state) => ({
        loading: { ...state.loading, [key]: loading },
      })),

    setDateRange: (start, end) =>
      set((state) => ({
        filters: {
          ...state.filters,
          dateRange: { start, end },
        },
      })),

    setSelectedTypes: (selectedTypes) =>
      set((state) => ({
        filters: { ...state.filters, selectedTypes },
      })),

    toggleType: (typeId) =>
      set((state) => {
        const selectedTypes = state.filters.selectedTypes.includes(typeId)
          ? state.filters.selectedTypes.filter((id) => id !== typeId)
          : [...state.filters.selectedTypes, typeId];

        return {
          filters: { ...state.filters, selectedTypes },
        };
      }),

    clearFilters: () =>
      set((state) => ({
        filters: {
          dateRange: { start: null, end: null },
          selectedTypes: [],
        },
      })),

    openAddDialog: () => set({ isAddDialogOpen: true }),

    closeAddDialog: () => set({ isAddDialogOpen: false }),

    setError: (error) => set({ error }),

    // Computed getters
    getFilteredMeasurements: () => {
      const { measurements, filters } = get();
      let filtered = [...measurements];

      // Filter by date range
      if (filters.dateRange.start) {
        filtered = filtered.filter((m) => new Date(m.measuredAt) >= filters.dateRange.start!);
      }
      if (filters.dateRange.end) {
        filtered = filtered.filter((m) => new Date(m.measuredAt) <= filters.dateRange.end!);
      }

      // Filter by selected types
      if (filters.selectedTypes.length > 0) {
        filtered = filtered.filter((m) => filters.selectedTypes.includes(m.measurementTypeId.toString()));
      }

      return filtered.sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
    },

    getChartDataForType: (typeName) => {
      const { measurementTypes } = get();
      const type = measurementTypes.find((t) => t.name === typeName);
      if (!type) return [];

      const filtered = get().getFilteredMeasurements();
      const typeData = filtered.filter((m) => m.measurementTypeId === type.id);

      if (type.requiresSubtype) {
        // Group by subtype for complex measurements like blood pressure
        const subtypeGroups = new Map<number, BiometricDataPoint[]>();

        typeData.forEach((measurement) => {
          if (measurement.measurementSubtypeId) {
            if (!subtypeGroups.has(measurement.measurementSubtypeId)) {
              subtypeGroups.set(measurement.measurementSubtypeId, []);
            }
            subtypeGroups.get(measurement.measurementSubtypeId)!.push({
              x: new Date(measurement.measuredAt).toISOString(),
              y: parseFloat(measurement.value),
              measurement,
            });
          }
        });

        return Array.from(subtypeGroups.entries()).map(([subtypeId, data]) => {
          const { measurementSubtypes } = get();
          const subtype = measurementSubtypes.find((s) => s.id === subtypeId);
          return {
            id: subtype?.displayName || `Subtype ${subtypeId}`,
            data: data.sort((a, b) => new Date(a.x as string).getTime() - new Date(b.x as string).getTime()),
          };
        });
      } else {
        // Simple measurement type
        return [
          {
            id: type.displayName,
            data: typeData
              .map((measurement) => ({
                x: new Date(measurement.measuredAt).toISOString(),
                y: parseFloat(measurement.value),
                measurement,
              }))
              .sort((a, b) => new Date(a.x as string).getTime() - new Date(b.x as string).getTime()),
          },
        ];
      }
    },

    getBloodPressureData: () => {
      const chartData = get().getChartDataForType("blood_pressure");
      if (chartData.length !== 2) return [];

      const systolicData = chartData.find((d) => d.id === "Systolic")?.data || [];
      const diastolicData = chartData.find((d) => d.id === "Diastolic")?.data || [];

      // Group by timestamp to create blood pressure readings
      const readingsMap = new Map<string, BloodPressureDataPoint>();

      systolicData.forEach((point) => {
        const key = point.x as string;
        if (!readingsMap.has(key)) {
          readingsMap.set(key, {
            x: key,
            systolic: point.y,
            diastolic: 0,
            measuredAt: new Date(key),
            notes: point.measurement.notes || undefined,
          });
        } else {
          readingsMap.get(key)!.systolic = point.y;
        }
      });

      diastolicData.forEach((point) => {
        const key = point.x as string;
        if (!readingsMap.has(key)) {
          readingsMap.set(key, {
            x: key,
            systolic: 0,
            diastolic: point.y,
            measuredAt: new Date(key),
            notes: point.measurement.notes || undefined,
          });
        } else {
          readingsMap.get(key)!.diastolic = point.y;
        }
      });

      return Array.from(readingsMap.values())
        .filter((reading) => reading.systolic > 0 && reading.diastolic > 0)
        .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());
    },

    getMeasurementTypeByName: (name) => {
      const { measurementTypes } = get();
      return measurementTypes.find((type) => type.name === name);
    },

    getSubtypesForType: (typeId) => {
      const { measurementSubtypes } = get();
      return measurementSubtypes.filter((subtype) => subtype.measurementTypeId === typeId);
    },
  })),
);
