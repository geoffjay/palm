/**
 * Integration service for managing data source connections
 */

import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import type { DataSourceConnection, NewDataSourceConnection } from "../../db/schema";
import { dataSourceConnections, users } from "../../db/schema";
import { GoogleFitIntegration } from "./googleFit";
import type { BiometricDataPoint, DataSourceIntegration } from "./types";

export class IntegrationService {
  private integrations: Map<string, DataSourceIntegration> = new Map();

  constructor() {
    // Register available integrations
    this.registerIntegration(new GoogleFitIntegration());
  }

  /**
   * Register a new data source integration
   */
  private registerIntegration(integration: DataSourceIntegration): void {
    this.integrations.set(integration.providerId, integration);
  }

  /**
   * Get all available integrations
   */
  getAvailableIntegrations(): Array<{ id: string; name: string }> {
    return Array.from(this.integrations.entries()).map(([id, integration]) => ({
      id,
      name: integration.name,
    }));
  }

  /**
   * Get user's connected data sources
   */
  async getUserConnections(userId: number): Promise<DataSourceConnection[]> {
    return db.select().from(dataSourceConnections).where(eq(dataSourceConnections.userId, userId));
  }

  /**
   * Initiate OAuth flow for a data source
   */
  async initiateConnection(userId: number, providerId: string): Promise<string> {
    const integration = this.integrations.get(providerId);
    if (!integration) {
      throw new Error(`Integration ${providerId} not found`);
    }

    return integration.authenticate(userId.toString());
  }

  /**
   * Handle OAuth callback and create connection
   */
  async handleCallback(code: string, providerId: string, userId: number): Promise<DataSourceConnection> {
    const integration = this.integrations.get(providerId);
    if (!integration) {
      throw new Error(`Integration ${providerId} not found`);
    }

    // Get connection details from integration
    const connectionData = await integration.handleCallback(code, userId.toString());

    // Save to database
    const newConnection: NewDataSourceConnection = {
      userId,
      providerId,
      accessToken: connectionData.accessToken,
      refreshToken: connectionData.refreshToken,
      expiresAt: connectionData.expiresAt,
      isActive: true,
      connectedAt: new Date(),
    };

    const [savedConnection] = await db.insert(dataSourceConnections).values(newConnection).returning();

    return savedConnection;
  }

  /**
   * Sync data from a specific connection
   */
  async syncConnection(connectionId: number, since?: Date): Promise<BiometricDataPoint[]> {
    const connection = await db
      .select()
      .from(dataSourceConnections)
      .where(eq(dataSourceConnections.id, connectionId))
      .limit(1);

    if (!connection[0]) {
      throw new Error("Connection not found");
    }

    const integration = this.integrations.get(connection[0].providerId);
    if (!integration) {
      throw new Error(`Integration ${connection[0].providerId} not found`);
    }

    try {
      const result = await integration.syncData(connection[0], since);

      // Update last sync time
      await db
        .update(dataSourceConnections)
        .set({
          lastSyncAt: new Date(),
          syncStatus: result.success ? "active" : "error",
          syncError: result.errors?.join("; ") || null,
        })
        .where(eq(dataSourceConnections.id, connectionId));

      return result.dataPoints;
    } catch (error) {
      // Update error status
      await db
        .update(dataSourceConnections)
        .set({
          syncStatus: "error",
          syncError: error instanceof Error ? error.message : "Unknown sync error",
        })
        .where(eq(dataSourceConnections.id, connectionId));

      throw error;
    }
  }

  /**
   * Sync all active connections for a user
   */
  async syncUserConnections(userId: number, since?: Date): Promise<BiometricDataPoint[]> {
    const connections = await db
      .select()
      .from(dataSourceConnections)
      .where(and(eq(dataSourceConnections.userId, userId), eq(dataSourceConnections.isActive, true)));

    const allDataPoints: BiometricDataPoint[] = [];

    for (const connection of connections) {
      try {
        const dataPoints = await this.syncConnection(connection.id, since);
        allDataPoints.push(...dataPoints);
      } catch (error) {
        console.error(`Failed to sync connection ${connection.id}:`, error);
      }
    }

    return allDataPoints;
  }

  /**
   * Disconnect a data source
   */
  async disconnectSource(connectionId: number, userId: number): Promise<void> {
    const connection = await db
      .select()
      .from(dataSourceConnections)
      .where(and(eq(dataSourceConnections.id, connectionId), eq(dataSourceConnections.userId, userId)))
      .limit(1);

    if (!connection[0]) {
      throw new Error("Connection not found");
    }

    const integration = this.integrations.get(connection[0].providerId);
    if (integration) {
      try {
        await integration.disconnect(connection[0]);
      } catch (error) {
        console.error("Failed to disconnect from provider:", error);
      }
    }

    // Mark as inactive in database
    await db.update(dataSourceConnections).set({ isActive: false }).where(eq(dataSourceConnections.id, connectionId));
  }

  /**
   * Convert external data points to biometric measurements
   */
  async saveBiometricData(userId: number, dataPoints: BiometricDataPoint[]): Promise<void> {
    const { biometricService } = await import("../../db/services");

    for (const point of dataPoints) {
      try {
        // Map external data types to our measurement types
        const measurementType = this.mapDataTypeToMeasurementType(point.type);
        if (!measurementType) {
          console.warn(`Unknown data type: ${point.type}`);
          continue;
        }

        // Save the measurement
        await biometricService.recordSimpleMeasurement(
          userId,
          measurementType,
          point.value,
          point.timestamp,
          `Imported from ${point.source}`,
        );
      } catch (error) {
        console.error(`Failed to save biometric data point:`, error);
      }
    }
  }

  /**
   * Map external data types to our measurement types
   */
  private mapDataTypeToMeasurementType(externalType: string): string | null {
    const typeMap: Record<string, string> = {
      steps: "steps",
      heart_rate: "heart_rate",
      weight: "weight",
      calories: "calories_burned",
      sleep_duration: "sleep_duration",
    };

    return typeMap[externalType] || null;
  }
}
