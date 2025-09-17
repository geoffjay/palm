import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import "../setup"; // Import DOM setup

// Mock fetch globally
global.fetch = mock(async (url: string, options?: RequestInit) => {
  const method = options?.method || "GET";

  if (url.includes("/auth/user") && method === "GET") {
    return new Response(
      JSON.stringify({
        user: {
          userId: "test_google_id",
          email: "test@example.com",
          name: "Test User",
          picture: "https://example.com/avatar.jpg",
        },
        authenticated: true,
      }),
      { status: 200 },
    );
  }

  if (url.includes("/auth/logout") && method === "POST") {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response("Not Found", { status: 404 });
});

// Mock window.location
const mockLocation = {
  href: "",
  assign: mock(),
  replace: mock(),
};
global.window = { location: mockLocation } as Window & typeof globalThis;

describe("useAuth", () => {
  let useAuth: () => {
    loading: boolean;
    authenticated: boolean;
    user: unknown;
    checkAuth: () => void;
    logout: () => void;
    loginWithGoogle: () => void;
  };

  beforeEach(async () => {
    mock.restore();
    mockLocation.href = "";
    const module = await import("../../src/hooks/useAuth");
    useAuth = module.useAuth;
  });

  test("should initialize with loading state", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("should set user data after successful authentication check", async () => {
    const { result } = renderHook(() => useAuth());

    // Wait for the effect to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.loading).toBe(false);
    expect(result.current.authenticated).toBe(true);
    expect(result.current.user?.email).toBe("test@example.com");
  });

  test("should handle authentication failure", async () => {
    global.fetch = mock(async () => new Response("Unauthorized", { status: 401 }));

    const { result } = renderHook(() => useAuth());

    // Wait for the effect to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.loading).toBe(false);
    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("should redirect to Google OAuth on loginWithGoogle", () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.loginWithGoogle();
    });

    expect(mockLocation.href).toBe("/auth/google");
  });

  test("should logout user and clear state", async () => {
    const { result } = renderHook(() => useAuth());

    // Wait for initial auth check
    await new Promise((resolve) => setTimeout(resolve, 100));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test("should handle logout failure gracefully", async () => {
    global.fetch = mock(async (url: string) => {
      if (url.includes("/auth/logout")) {
        throw new Error("Network error");
      }
      return new Response(JSON.stringify({ user: null }), { status: 200 });
    });

    const { result } = renderHook(() => useAuth());

    // Should not throw error
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current).toBeTruthy();
  });

  test("should handle network errors during auth check", async () => {
    global.fetch = mock(async () => {
      throw new Error("Network error");
    });

    const { result } = renderHook(() => useAuth());

    // Wait for the effect to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.loading).toBe(false);
    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
