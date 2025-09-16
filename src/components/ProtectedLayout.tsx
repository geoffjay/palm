/**
 * Protected Layout Component
 * A wrapper around Layout that automatically uses auth context
 * Eliminates the need to pass user/onLogout props
 */

import { useAuth } from "../contexts/AuthContext";
import { Layout } from "./Layout";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function ProtectedLayout({ children, title }: ProtectedLayoutProps) {
  const { user } = useAuth();

  if (!user) {
    // This should not happen in protected routes, but just in case
    throw new Error("ProtectedLayout used without authenticated user");
  }

  return <Layout title={title}>{children}</Layout>;
}
