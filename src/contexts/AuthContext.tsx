/**
 * Authentication Context
 * Provides user authentication state and actions throughout the app
 * Eliminates the need for prop drilling user/onLogout through components
 */

import { createContext, type ReactNode, useContext } from "react";
import type { User } from "../types/user";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  user: User | null;
  onLogout: () => void;
}

export function AuthProvider({ children, user, onLogout }: AuthProviderProps) {
  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    logout: onLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to get the current user (throws if not authenticated)
 * Use this when you know the user should be authenticated
 */
export function useUser(): User {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    throw new Error("useUser called but user is not authenticated");
  }
  return user;
}

/**
 * Hook to get logout function
 */
export function useLogout(): () => void {
  const { logout } = useAuth();
  return logout;
}
