/**
 * Biometric Measurements Service
 * Database operations for biometric measurements using Drizzle ORM
 */

import { and, desc, eq, gte, lte } from "drizzle-orm";
import type {
  BiometricMeasurement,
  BiometricMeasurementSubtype,
  BiometricMeasurementType,
  NewBiometricMeasurement,
} from "../index";
import { db, schema } from "../index";

export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  measuredAt: Date;
  notes?: string;
}

export interface MeasurementWithDetails extends BiometricMeasurement {
  measurementType: BiometricMeasurementType;
  measurementSubtype?: BiometricMeasurementSubtype;
}

export class BiometricService {
  /**
   * Record a simple measurement (heart rate, weight, etc.)
   */
  async recordSimpleMeasurement(
    userId: number,
    measurementTypeName: string,
    value: number,
    measuredAt: Date = new Date(),
    notes?: string,
  ): Promise<BiometricMeasurement> {
    // Find the measurement type
    const measurementType = await this.getMeasurementTypeByName(measurementTypeName);
    if (!measurementType) {
      throw new Error(`Measurement type '${measurementTypeName}' not found`);
    }

    if (measurementType.requiresSubtype) {
      throw new Error(
        `Measurement type '${measurementTypeName}' requires subtype. Use recordComplexMeasurement instead.`,
      );
    }

    const [measurement] = await db
      .insert(schema.biometricMeasurements)
      .values({
        userId,
        measurementTypeId: measurementType.id,
        measurementSubtypeId: null,
        value: value.toString(),
        notes,
        measuredAt,
      })
      .returning();

    return measurement;
  }

  /**
   * Record blood pressure (systolic and diastolic)
   */
  async recordBloodPressure(userId: number, reading: BloodPressureReading): Promise<BiometricMeasurement[]> {
    const measurementType = await this.getMeasurementTypeByName("blood_pressure");
    if (!measurementType) {
      throw new Error("Blood pressure measurement type not found");
    }

    // Get subtypes
    const systolicSubtype = await this.getMeasurementSubtypeByName("systolic");
    const diastolicSubtype = await this.getMeasurementSubtypeByName("diastolic");

    if (!systolicSubtype || !diastolicSubtype) {
      throw new Error("Blood pressure subtypes not found");
    }

    // Insert both measurements
    const measurements = await db
      .insert(schema.biometricMeasurements)
      .values([
        {
          userId,
          measurementTypeId: measurementType.id,
          measurementSubtypeId: systolicSubtype.id,
          value: reading.systolic.toString(),
          notes: reading.notes,
          measuredAt: reading.measuredAt,
        },
        {
          userId,
          measurementTypeId: measurementType.id,
          measurementSubtypeId: diastolicSubtype.id,
          value: reading.diastolic.toString(),
          notes: reading.notes,
          measuredAt: reading.measuredAt,
        },
      ])
      .returning();

    return measurements;
  }

  /**
   * Get latest measurement for a user and type
   */
  async getLatestMeasurement(userId: number, measurementTypeName: string): Promise<MeasurementWithDetails | null> {
    const measurementType = await this.getMeasurementTypeByName(measurementTypeName);
    if (!measurementType) {
      return null;
    }

    const [measurement] = await db
      .select()
      .from(schema.biometricMeasurements)
      .innerJoin(
        schema.biometricMeasurementTypes,
        eq(schema.biometricMeasurements.measurementTypeId, schema.biometricMeasurementTypes.id),
      )
      .leftJoin(
        schema.biometricMeasurementSubtypes,
        eq(schema.biometricMeasurements.measurementSubtypeId, schema.biometricMeasurementSubtypes.id),
      )
      .where(
        and(
          eq(schema.biometricMeasurements.userId, userId),
          eq(schema.biometricMeasurements.measurementTypeId, measurementType.id),
        ),
      )
      .orderBy(desc(schema.biometricMeasurements.measuredAt))
      .limit(1);

    if (!measurement) return null;

    return {
      ...measurement.biometric_measurements,
      measurementType: measurement.biometric_measurement_types,
      measurementSubtype: measurement.biometric_measurement_subtypes || undefined,
    };
  }

  /**
   * Get latest blood pressure reading (both systolic and diastolic)
   */
  async getLatestBloodPressure(userId: number): Promise<BloodPressureReading | null> {
    const measurementType = await this.getMeasurementTypeByName("blood_pressure");
    if (!measurementType) {
      return null;
    }

    const measurements = await db
      .select()
      .from(schema.biometricMeasurements)
      .innerJoin(
        schema.biometricMeasurementSubtypes,
        eq(schema.biometricMeasurements.measurementSubtypeId, schema.biometricMeasurementSubtypes.id),
      )
      .where(
        and(
          eq(schema.biometricMeasurements.userId, userId),
          eq(schema.biometricMeasurements.measurementTypeId, measurementType.id),
        ),
      )
      .orderBy(desc(schema.biometricMeasurements.measuredAt))
      .limit(2);

    if (measurements.length < 2) return null;

    // Group by measured_at to get the latest complete reading
    const latestMeasuredAt = measurements[0].biometric_measurements.measuredAt;
    const latestReadings = measurements.filter(
      (m) => m.biometric_measurements.measuredAt.getTime() === latestMeasuredAt.getTime(),
    );

    if (latestReadings.length < 2) return null;

    const systolic = latestReadings.find((m) => m.biometric_measurement_subtypes.name === "systolic");
    const diastolic = latestReadings.find((m) => m.biometric_measurement_subtypes.name === "diastolic");

    if (!systolic || !diastolic) return null;

    return {
      systolic: parseFloat(systolic.biometric_measurements.value),
      diastolic: parseFloat(diastolic.biometric_measurements.value),
      measuredAt: systolic.biometric_measurements.measuredAt,
      notes: systolic.biometric_measurements.notes || undefined,
    };
  }

  /**
   * Get measurement history for a user and type within a date range
   */
  async getMeasurementHistory(
    userId: number,
    measurementTypeName: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100,
  ): Promise<MeasurementWithDetails[]> {
    const measurementType = await this.getMeasurementTypeByName(measurementTypeName);
    if (!measurementType) {
      return [];
    }

    const whereConditions = [
      eq(schema.biometricMeasurements.userId, userId),
      eq(schema.biometricMeasurements.measurementTypeId, measurementType.id),
    ];

    if (startDate) {
      whereConditions.push(gte(schema.biometricMeasurements.measuredAt, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(schema.biometricMeasurements.measuredAt, endDate));
    }

    const measurements = await db
      .select()
      .from(schema.biometricMeasurements)
      .innerJoin(
        schema.biometricMeasurementTypes,
        eq(schema.biometricMeasurements.measurementTypeId, schema.biometricMeasurementTypes.id),
      )
      .leftJoin(
        schema.biometricMeasurementSubtypes,
        eq(schema.biometricMeasurements.measurementSubtypeId, schema.biometricMeasurementSubtypes.id),
      )
      .where(and(...whereConditions))
      .orderBy(desc(schema.biometricMeasurements.measuredAt))
      .limit(limit);

    return measurements.map((m) => ({
      ...m.biometric_measurements,
      measurementType: m.biometric_measurement_types,
      measurementSubtype: m.biometric_measurement_subtypes || undefined,
    }));
  }

  /**
   * Get all measurement types
   */
  async getAllMeasurementTypes(): Promise<BiometricMeasurementType[]> {
    return await db
      .select()
      .from(schema.biometricMeasurementTypes)
      .orderBy(schema.biometricMeasurementTypes.displayName);
  }

  /**
   * Get measurement type by name
   */
  async getMeasurementTypeByName(name: string): Promise<BiometricMeasurementType | null> {
    const [type] = await db
      .select()
      .from(schema.biometricMeasurementTypes)
      .where(eq(schema.biometricMeasurementTypes.name, name))
      .limit(1);

    return type || null;
  }

  /**
   * Get measurement subtype by name
   */
  async getMeasurementSubtypeByName(name: string): Promise<BiometricMeasurementSubtype | null> {
    const [subtype] = await db
      .select()
      .from(schema.biometricMeasurementSubtypes)
      .where(eq(schema.biometricMeasurementSubtypes.name, name))
      .limit(1);

    return subtype || null;
  }

  /**
   * Delete a measurement
   */
  async deleteMeasurement(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(schema.biometricMeasurements)
      .where(and(eq(schema.biometricMeasurements.id, id), eq(schema.biometricMeasurements.userId, userId)));

    return result.length > 0;
  }

  /**
   * Get user's measurement summary (latest values for each type)
   */
  async getUserMeasurementSummary(userId: number): Promise<
    Array<{
      type: BiometricMeasurementType;
      latestValue?: number;
      latestMeasuredAt?: Date;
      count: number;
    }>
  > {
    const types = await this.getAllMeasurementTypes();
    const summary = [];

    for (const type of types) {
      // Get count of measurements for this type
      const measurements = await db
        .select()
        .from(schema.biometricMeasurements)
        .where(
          and(
            eq(schema.biometricMeasurements.userId, userId),
            eq(schema.biometricMeasurements.measurementTypeId, type.id),
          ),
        );

      const count = measurements.length;
      let latestValue: number | undefined;
      let latestMeasuredAt: Date | undefined;

      if (count > 0) {
        const latest = measurements.sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())[0];
        latestValue = parseFloat(latest.value);
        latestMeasuredAt = latest.measuredAt;
      }

      summary.push({
        type,
        latestValue,
        latestMeasuredAt,
        count,
      });
    }

    return summary;
  }
}
