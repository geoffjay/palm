/**
 * React hook for managing data source integrations
 */

import { useCallback, useEffect, useState } from "react";

interface Integration {
  id: string;
  name: string;
}

interface Connection {
  id: number;
  providerId: string;
  isActive: boolean;
  connectedAt: string;
  lastSyncAt?: string;
  syncStatus: string;
}

interface IntegrationsData {
  available: Integration[];
  connected: Connection[];
}

interface UseIntegrationsResult {
  integrations: IntegrationsData | null;
  loading: boolean;
  error: string | null;
  connectIntegration: (providerId: string) => Promise<void>;
  syncConnection: (connectionId: number) => Promise<void>;
  disconnectIntegration: (connectionId: number) => Promise<void>;
  refreshIntegrations: () => Promise<void>;
}

export function useIntegrations(): UseIntegrationsResult {
  const [integrations, setIntegrations] = useState<IntegrationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/integrations", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch integrations: ${response.statusText}`);
      }

      const data = await response.json();
      setIntegrations(data);
    } catch (err) {
      console.error("Error fetching integrations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  const connectIntegration = useCallback(async (providerId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/integrations/${providerId}/connect`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate connection: ${response.statusText}`);
      }

      const data = await response.json();

      // Redirect to OAuth flow
      window.location.href = data.authUrl;
    } catch (err) {
      console.error("Error connecting integration:", err);
      setError(err instanceof Error ? err.message : "Failed to connect integration");
    }
  }, []);

  const syncConnection = useCallback(
    async (connectionId: number) => {
      try {
        setError(null);

        const response = await fetch(`/api/integrations/${connectionId}/sync`, {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to sync data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Sync result:", data);

        // Refresh integrations to update sync status
        await fetchIntegrations();

        return data;
      } catch (err) {
        console.error("Error syncing connection:", err);
        setError(err instanceof Error ? err.message : "Failed to sync data");
        throw err;
      }
    },
    [fetchIntegrations],
  );

  const disconnectIntegration = useCallback(
    async (connectionId: number) => {
      try {
        setError(null);

        const response = await fetch(`/api/integrations/${connectionId}/disconnect`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to disconnect: ${response.statusText}`);
        }

        // Refresh integrations to update the list
        await fetchIntegrations();
      } catch (err) {
        console.error("Error disconnecting integration:", err);
        setError(err instanceof Error ? err.message : "Failed to disconnect integration");
      }
    },
    [fetchIntegrations],
  );

  const refreshIntegrations = useCallback(async () => {
    await fetchIntegrations();
  }, [fetchIntegrations]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return {
    integrations,
    loading,
    error,
    connectIntegration,
    syncConnection,
    disconnectIntegration,
    refreshIntegrations,
  };
}
