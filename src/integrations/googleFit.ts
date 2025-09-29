/**
 * Google Fit API Integration
 */

import type { BiometricDataPoint, DataSourceConnection, DataSourceIntegration, DataSyncResult } from "./types";

interface GoogleFitTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleFitDataPoint {
  dataTypeName: string;
  startTimeNanos: string;
  endTimeNanos: string;
  value: Array<{
    intVal?: number;
    fpVal?: number;
    stringVal?: string;
  }>;
  originDataSourceId: string;
}

export class GoogleFitIntegration implements DataSourceIntegration {
  providerId = "google_fit";
  name = "Google Fit";

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID!;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    this.redirectUri = `${process.env.BASE_URL || "http://localhost:3000"}/api/integrations/google_fit/callback`;
  }

  /**
   * Generate OAuth URL for Google Fit authentication
   */
  async authenticate(userId: string): Promise<string> {
    const scopes = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.sleep.read",
    ].join(" ");

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      state: userId, // Pass user ID in state for callback
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, userId: string): Promise<DataSourceConnection> {
    const tokenResponse = await this.exchangeCodeForTokens(code);

    const connection: DataSourceConnection = {
      id: crypto.randomUUID(),
      userId,
      providerId: this.providerId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      isActive: true,
      connectedAt: new Date(),
    };

    return connection;
  }

  /**
   * Sync data from Google Fit
   */
  async syncData(connection: DataSourceConnection, since?: Date): Promise<DataSyncResult> {
    try {
      // Ensure token is valid
      const validConnection = await this.ensureValidToken(connection);

      const endTime = new Date();
      const startTime = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

      const dataPoints: BiometricDataPoint[] = [];

      // Fetch different data types
      const dataTypes = [
        "com.google.step_count.delta",
        "com.google.heart_rate.bpm",
        "com.google.weight",
        "com.google.calories.expended",
        "com.google.sleep.segment",
      ];

      for (const dataType of dataTypes) {
        try {
          const typeData = await this.fetchDataType(validConnection, dataType, startTime, endTime);
          dataPoints.push(...typeData);
        } catch (error) {
          console.error(`Failed to fetch ${dataType}:`, error);
        }
      }

      return {
        success: true,
        dataPoints,
      };
    } catch (error) {
      console.error("Google Fit sync error:", error);
      return {
        success: false,
        dataPoints: [],
        errors: [error instanceof Error ? error.message : "Unknown sync error"],
      };
    }
  }

  /**
   * Disconnect Google Fit integration
   */
  async disconnect(connection: DataSourceConnection): Promise<void> {
    try {
      // Revoke the token with Google
      await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.accessToken}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to revoke Google Fit token:", error);
    }
  }

  /**
   * Refresh expired access token
   */
  async refreshToken(connection: DataSourceConnection): Promise<DataSourceConnection> {
    if (!connection.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: connection.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const tokenData: GoogleFitTokenResponse = await response.json();

    return {
      ...connection,
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    };
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<GoogleFitTokenResponse> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Ensure the access token is valid, refresh if needed
   */
  private async ensureValidToken(connection: DataSourceConnection): Promise<DataSourceConnection> {
    if (connection.expiresAt && connection.expiresAt > new Date()) {
      return connection; // Token is still valid
    }

    return this.refreshToken(connection);
  }

  /**
   * Fetch specific data type from Google Fit
   */
  private async fetchDataType(
    connection: DataSourceConnection,
    dataType: string,
    startTime: Date,
    endTime: Date,
  ): Promise<BiometricDataPoint[]> {
    const startTimeNanos = (startTime.getTime() * 1000000).toString();
    const endTimeNanos = (endTime.getTime() * 1000000).toString();

    const response = await fetch(`https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: dataType }],
        bucketByTime: { durationMillis: 86400000 }, // Daily buckets
        startTimeMillis: startTime.getTime(),
        endTimeMillis: endTime.getTime(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${dataType}: ${response.statusText}`);
    }

    const data = await response.json();
    return this.convertGoogleFitData(data, dataType);
  }

  /**
   * Convert Google Fit data to our BiometricDataPoint format
   */
  private convertGoogleFitData(data: any, dataType: string): BiometricDataPoint[] {
    const dataPoints: BiometricDataPoint[] = [];

    for (const bucket of data.bucket || []) {
      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          const timestamp = new Date(parseInt(point.startTimeNanos) / 1000000);
          const value = point.value?.[0];

          if (!value) continue;

          let biometricPoint: BiometricDataPoint | null = null;

          switch (dataType) {
            case "com.google.step_count.delta":
              biometricPoint = {
                type: "steps",
                value: value.intVal || 0,
                unit: "count",
                timestamp,
                source: "google_fit",
              };
              break;

            case "com.google.heart_rate.bpm":
              biometricPoint = {
                type: "heart_rate",
                value: value.fpVal || 0,
                unit: "bpm",
                timestamp,
                source: "google_fit",
              };
              break;

            case "com.google.weight":
              biometricPoint = {
                type: "weight",
                value: value.fpVal || 0,
                unit: "kg",
                timestamp,
                source: "google_fit",
              };
              break;

            case "com.google.calories.expended":
              biometricPoint = {
                type: "calories",
                value: value.fpVal || 0,
                unit: "cal",
                timestamp,
                source: "google_fit",
              };
              break;

            case "com.google.sleep.segment":
              biometricPoint = {
                type: "sleep_duration",
                value: (parseInt(point.endTimeNanos) - parseInt(point.startTimeNanos)) / 1000000 / 1000 / 60, // Convert to minutes
                unit: "minutes",
                timestamp,
                source: "google_fit",
              };
              break;
          }

          if (biometricPoint) {
            dataPoints.push(biometricPoint);
          }
        }
      }
    }

    return dataPoints;
  }
}
