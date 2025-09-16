#!/usr/bin/env bun

/**
 * Database Seed Data
 * Populates measurement types and subtypes with initial data
 */

import { eq } from "drizzle-orm";
import { db } from "./index";
import type { BiometricMeasurementType } from "./schema";
import { biometricMeasurementSubtypes, biometricMeasurementTypes } from "./schema";

interface SeedMeasurementType {
  name: string;
  displayName: string;
  unit: string;
  requiresSubtype: boolean;
  description: string;
  subtypes?: Array<{
    name: string;
    displayName: string;
    sortOrder: number;
  }>;
}

const measurementTypesData: SeedMeasurementType[] = [
  {
    name: "heart_rate",
    displayName: "Heart Rate",
    unit: "bpm",
    requiresSubtype: false,
    description: "Resting heart rate measurement in beats per minute",
  },
  {
    name: "blood_pressure",
    displayName: "Blood Pressure",
    unit: "mmHg",
    requiresSubtype: true,
    description: "Systolic and diastolic blood pressure readings",
    subtypes: [
      {
        name: "systolic",
        displayName: "Systolic",
        sortOrder: 1,
      },
      {
        name: "diastolic",
        displayName: "Diastolic",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "weight",
    displayName: "Weight",
    unit: "kg",
    requiresSubtype: false,
    description: "Body weight measurement in kilograms",
  },
  {
    name: "body_temperature",
    displayName: "Body Temperature",
    unit: "°C",
    requiresSubtype: false,
    description: "Core body temperature in Celsius",
  },
  {
    name: "blood_glucose",
    displayName: "Blood Glucose",
    unit: "mg/dL",
    requiresSubtype: false,
    description: "Blood sugar level measurement",
  },
  {
    name: "steps",
    displayName: "Steps",
    unit: "steps",
    requiresSubtype: false,
    description: "Daily step count",
  },
  {
    name: "sleep_duration",
    displayName: "Sleep Duration",
    unit: "hours",
    requiresSubtype: false,
    description: "Total sleep time in hours",
  },
];

async function seedMeasurementTypes() {
  console.log("🌱 Seeding biometric measurement types...");

  for (const typeData of measurementTypesData) {
    try {
      // Check if type already exists
      const existing = await db
        .select()
        .from(biometricMeasurementTypes)
        .where(eq(biometricMeasurementTypes.name, typeData.name))
        .limit(1);

      let measurementType: BiometricMeasurementType;

      if (existing.length === 0) {
        // Create new measurement type
        const [newType] = await db
          .insert(biometricMeasurementTypes)
          .values({
            name: typeData.name,
            displayName: typeData.displayName,
            unit: typeData.unit,
            requiresSubtype: typeData.requiresSubtype,
            description: typeData.description,
          })
          .returning();

        measurementType = newType;
        console.log(`✅ Created measurement type: ${typeData.displayName}`);
      } else {
        measurementType = existing[0];
        console.log(`⏭️  Measurement type already exists: ${typeData.displayName}`);
      }

      // Seed subtypes if they exist
      if (typeData.subtypes && typeData.subtypes.length > 0) {
        for (const subtypeData of typeData.subtypes) {
          // Check if subtype already exists
          const existingSubtype = await db
            .select()
            .from(biometricMeasurementSubtypes)
            .where(eq(biometricMeasurementSubtypes.name, subtypeData.name))
            .limit(1);

          if (existingSubtype.length === 0) {
            await db.insert(biometricMeasurementSubtypes).values({
              measurementTypeId: measurementType.id,
              name: subtypeData.name,
              displayName: subtypeData.displayName,
              sortOrder: subtypeData.sortOrder,
            });

            console.log(`  ✅ Created subtype: ${subtypeData.displayName}`);
          } else {
            console.log(`  ⏭️  Subtype already exists: ${subtypeData.displayName}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error seeding ${typeData.name}:`, error);
      throw error;
    }
  }

  console.log("🎉 Measurement types seeding completed!");
}

async function runSeed() {
  try {
    await seedMeasurementTypes();
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (import.meta.main) {
  runSeed();
}

export { seedMeasurementTypes, runSeed };
