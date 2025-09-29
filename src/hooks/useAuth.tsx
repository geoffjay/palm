import { useCallback, useEffect, useState } from "react";
import type { User } from "../types/user";

interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
  });

  const checkAuth = useCallback(async () => {
    try {
      console.log("🔐 Checking authentication...");
      setAuthState((prev) => ({ ...prev, loading: true }));

      const response = await fetch("/auth/user", {
        method: "GET",
        credentials: "include",
      });

      console.log("🔐 Auth response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔐 Auth data:", data);

        setAuthState({
          user: data.user,
          loading: false,
          authenticated: !!data.user,
        });
      } else {
        console.log("🔐 Auth failed, not authenticated");
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        });
      }
    } catch (error) {
      console.error("🔐 Auth check failed:", error);
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
    }
  }, []);

  const logout = async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = "/auth/google";
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    checkAuth,
    logout,
    loginWithGoogle,
  };
}
