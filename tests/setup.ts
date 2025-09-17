/**
 * Test setup and global configuration
 */

// Mock DOM environment for React testing
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
  resources: "usable",
});

global.document = dom.window.document;
global.window = dom.window as Window & typeof globalThis;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test_user";
process.env.DB_PASSWORD = "test_password";
process.env.DB_NAME = "palm_test";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.REDIS_DB = "1"; // Use different DB for tests
process.env.SESSION_TTL = "3600";
process.env.GOOGLE_CLIENT_ID = "test_client_id";
process.env.GOOGLE_CLIENT_SECRET = "test_client_secret";
process.env.BASE_URL = "http://localhost:3000";

// Global test utilities can be added here
export const testUtils = {
  createMockUser: () => ({
    id: 1,
    googleId: "test_google_id",
    email: "test@example.com",
    name: "Test User",
    givenName: "Test",
    familyName: "User",
    picture: "https://example.com/avatar.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
  }),

  createMockSessionData: () => ({
    userId: "test_google_id",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/avatar.jpg",
    accessToken: "mock_access_token",
    refreshToken: "mock_refresh_token",
    createdAt: Date.now(),
    lastActivity: Date.now(),
  }),

  createMockMeasurement: () => ({
    id: 1,
    userId: 1,
    measurementTypeId: 1,
    measurementSubtypeId: null,
    value: "120",
    notes: "Test measurement",
    measuredAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};
