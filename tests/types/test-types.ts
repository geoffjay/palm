/**
 * Type definitions for test files
 */

// Mock types for testing
export type MockRouteHandler = (req: MockRequest) => Promise<Response> | Response;

export interface MockRequest extends Request {
  user?: MockSessionData;
  params?: Record<string, string>;
}

export interface MockSessionData {
  userId: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
  createdAt: number;
  lastActivity: number;
}

export interface MockUserData {
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  picture: string;
}

export interface MockBloodPressureData {
  systolic: number;
  diastolic: number;
  measuredAt: Date;
  notes?: string;
}

export interface MockAuthMiddleware {
  requireAuth: (handler: MockRouteHandler) => MockRouteHandler;
}

export interface MockModule {
  default: unknown;
}

export interface MockFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface MockLocation {
  href: string;
  assign: () => void;
  replace: () => void;
}

export interface MockWindow {
  location: MockLocation;
}

export interface DbMockResult {
  [key: string]: unknown;
}

export type MockTransactionCallback = (tx: unknown) => Promise<unknown>;
