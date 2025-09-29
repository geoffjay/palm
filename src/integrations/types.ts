/**
 * Data source integration types
 */

export interface DataSourceProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  authUrl: string;
  scopes: string[];
}

export interface DataSourceConnection {
  id: string;
  userId: string;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  isActive: boolean;
  connectedAt: Date;
  lastSyncAt?: Date;
}

export interface BiometricDataPoint {
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

export interface DataSyncResult {
  success: boolean;
  dataPoints: BiometricDataPoint[];
  errors?: string[];
  nextSyncToken?: string;
}

export abstract class DataSourceIntegration {
  abstract providerId: string;
  abstract name: string;

  abstract authenticate(userId: string): Promise<string>;
  abstract handleCallback(code: string, userId: string): Promise<DataSourceConnection>;
  abstract syncData(connection: DataSourceConnection, since?: Date): Promise<DataSyncResult>;
  abstract disconnect(connection: DataSourceConnection): Promise<void>;
  abstract refreshToken(connection: DataSourceConnection): Promise<DataSourceConnection>;
}
