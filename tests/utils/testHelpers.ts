/**
 * Test helper utilities and custom matchers
 */

import { expect } from "bun:test";

// Custom matchers for better assertions
export const customMatchers = {
  toBeValidDate: (received: unknown) => {
    const pass = received instanceof Date && !Number.isNaN(received.getTime());
    return {
      pass,
      message: () => `Expected ${received} to be a valid Date`,
    };
  },

  toBeValidEmail: (received: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === "string" && emailRegex.test(received);
    return {
      pass,
      message: () => `Expected ${received} to be a valid email address`,
    };
  },

  toBeValidUrl: (received: string) => {
    try {
      new URL(received);
      return { pass: true, message: () => "" };
    } catch {
      return {
        pass: false,
        message: () => `Expected ${received} to be a valid URL`,
      };
    }
  },

  toBeValidSessionId: (received: string) => {
    const pass = typeof received === "string" && received.length === 32;
    return {
      pass,
      message: () => `Expected ${received} to be a valid session ID (32 characters)`,
    };
  },
};

// Extend expect with custom matchers
expect.extend(customMatchers);

// Mock implementations for common APIs
export const mockApis = {
  createMockRequest: (url: string, options: RequestInit = {}) => {
    return new Request(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  },

  createMockResponse: (data: unknown, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },

  createAuthenticatedRequest: (url: string, sessionId = "valid_session", options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    headers.set("cookie", `session_id=${sessionId}`);

    return new Request(url, {
      ...options,
      headers,
    });
  },
};

// Database test utilities
export const dbTestHelpers = {
  createMockDbConnection: () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
    insert: () => ({ into: () => ({ values: () => ({ returning: () => [] }) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ from: () => ({ where: () => [] }) }),
  }),

  createMockTransaction: (mockResults: unknown[] = []) => {
    let callCount = 0;
    return async (callback: (tx: unknown) => Promise<unknown>) => {
      const mockTx = dbTestHelpers.createMockDbConnection();
      const _result = mockResults[callCount] || mockResults[0];
      callCount++;
      return callback(mockTx);
    };
  },
};

// React testing utilities
export const reactTestHelpers = {
  createMockEvent: (overrides: Partial<Event> = {}): Event => {
    return {
      preventDefault: () => {},
      stopPropagation: () => {},
      target: null,
      currentTarget: null,
      ...overrides,
    } as Event;
  },

  createMockChangeEvent: (value: string): React.ChangeEvent<HTMLInputElement> => {
    return {
      ...reactTestHelpers.createMockEvent(),
      target: { value } as HTMLInputElement,
    } as React.ChangeEvent<HTMLInputElement>;
  },

  waitFor: async (condition: () => boolean, timeout = 1000) => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },
};

// Time-related test utilities
export const timeHelpers = {
  freezeTime: (date: Date | string | number = new Date()) => {
    const frozenDate = new Date(date);
    const originalNow = Date.now;
    Date.now = () => frozenDate.getTime();

    return () => {
      Date.now = originalNow;
    };
  },

  createDateRange: (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  },

  addDays: (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
};
