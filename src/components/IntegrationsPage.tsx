/**
 * Data source integrations management page
 */

import { CheckIcon, Cross2Icon, ExclamationTriangleIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Badge, Button, Callout, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useIntegrations } from "../hooks/useIntegrations";
import { ProtectedLayout } from "./ProtectedLayout";

interface IntegrationCardProps {
  integration: {
    id: string;
    name: string;
  };
  connection?: {
    id: number;
    providerId: string;
    isActive: boolean;
    connectedAt: string;
    lastSyncAt?: string;
    syncStatus: string;
  };
  onConnect: (providerId: string) => void;
  onSync: (connectionId: number) => void;
  onDisconnect: (connectionId: number) => void;
  syncing: boolean;
}

function IntegrationCard({ integration, connection, onConnect, onSync, onDisconnect, syncing }: IntegrationCardProps) {
  const isConnected = connection?.isActive;
  const lastSync = connection?.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleDateString() : "Never";

  const getStatusVariant = (status?: string): "solid" | "soft" | "outline" => {
    switch (status) {
      case "active":
        return "solid";
      case "error":
        return "solid";
      case "paused":
        return "soft";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status?: string): "green" | "red" | "yellow" | "gray" => {
    switch (status) {
      case "active":
        return "green";
      case "error":
        return "red";
      case "paused":
        return "yellow";
      default:
        return "gray";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "error":
        return "Error";
      case "paused":
        return "Paused";
      default:
        return "Inactive";
    }
  };

  return (
    <Card variant="surface">
      <Flex direction="column" p="6" gap="4">
        <Flex justify="between" align="start">
          <Flex align="center" gap="3">
            <Flex
              align="center"
              justify="center"
              width="48px"
              height="48px"
              style={{
                backgroundColor: "var(--blue-3)",
                borderRadius: "var(--radius-3)",
              }}
            >
              {integration.id === "google_fit" && (
                <svg width="24" height="24" fill="var(--blue-9)" viewBox="0 0 24 24">
                  <title>Google Fit</title>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </Flex>
            <Flex direction="column" gap="1">
              <Heading size="4">{integration.name}</Heading>
              <Text size="2" color="gray">
                {integration.id === "google_fit" && "Import fitness data from Google Fit"}
              </Text>
            </Flex>
          </Flex>

          <Flex align="center" gap="2">
            {isConnected ? (
              <>
                <Badge
                  variant={getStatusVariant(connection?.syncStatus)}
                  color={getStatusColor(connection?.syncStatus)}
                >
                  {getStatusText(connection?.syncStatus)}
                </Badge>
                <Button size="2" variant="solid" onClick={() => connection && onSync(connection.id)} disabled={syncing}>
                  <ReloadIcon />
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button size="2" variant="soft" color="red" onClick={() => connection && onDisconnect(connection.id)}>
                  <Cross2Icon />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="2" variant="solid" color="green" onClick={() => onConnect(integration.id)}>
                <CheckIcon />
                Connect
              </Button>
            )}
          </Flex>
        </Flex>

        {isConnected && (
          <Flex direction="column" gap="2" pt="4" style={{ borderTop: "1px solid var(--gray-6)" }}>
            <Grid columns="2" gap="4">
              <Flex direction="column" gap="1">
                <Text size="2" color="gray">
                  Connected
                </Text>
                <Text size="2" weight="medium">
                  {new Date(connection.connectedAt).toLocaleDateString()}
                </Text>
              </Flex>
              <Flex direction="column" gap="1">
                <Text size="2" color="gray">
                  Last Sync
                </Text>
                <Text size="2" weight="medium">
                  {lastSync}
                </Text>
              </Flex>
            </Grid>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

export function IntegrationsPage() {
  const { integrations, loading, error, connectIntegration, syncConnection, disconnectIntegration } = useIntegrations();

  const [syncing, setSyncing] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle URL parameters for integration callback results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const integration = urlParams.get("integration");
    const provider = urlParams.get("provider");
    const errorMessage = urlParams.get("message");

    if (integration === "success" && provider) {
      setMessage({ type: "success", text: `Successfully connected to ${provider}!` });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (integration === "error") {
      setMessage({ type: "error", text: errorMessage || "Failed to connect integration" });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSync = async (connectionId: number) => {
    setSyncing(connectionId);
    try {
      const result = await syncConnection(connectionId);
      setMessage({
        type: "success",
        text: (result as unknown as { message?: string })?.message || `Successfully synced data!`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to sync data",
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (connectionId: number) => {
    if (confirm("Are you sure you want to disconnect this integration? This will stop automatic data syncing.")) {
      await disconnectIntegration(connectionId);
      setMessage({ type: "success", text: "Integration disconnected successfully" });
    }
  };

  if (loading) {
    return (
      <ProtectedLayout title="Integrations">
        <Flex justify="center" align="center" height="100%">
          <Text>Loading integrations...</Text>
        </Flex>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout title="Integrations">
        <Flex justify="center" align="center" height="100%">
          <Text color="red">Error loading integrations: {error}</Text>
        </Flex>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout title="Integrations">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex direction="column" gap="2">
          <Heading size="6">Data Source Integrations</Heading>
          <Text size="3" color="gray">
            Connect external fitness and health apps to automatically import your biometric data.
          </Text>
        </Flex>

        {/* Success/Error Messages */}
        {message && (
          <Callout.Root color={message.type === "success" ? "green" : "red"} variant="soft">
            <Callout.Icon>{message.type === "success" ? <CheckIcon /> : <ExclamationTriangleIcon />}</Callout.Icon>
            <Callout.Text>{message.text}</Callout.Text>
            <Button
              size="1"
              variant="ghost"
              color="gray"
              onClick={() => setMessage(null)}
              style={{ marginLeft: "auto" }}
            >
              <Cross2Icon />
            </Button>
          </Callout.Root>
        )}

        {/* Integration Cards */}
        <Flex direction="column" gap="4">
          {integrations?.available.map((integration) => {
            const connection = integrations.connected.find(
              (conn) => conn.providerId === integration.id && conn.isActive,
            );

            return (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                connection={connection}
                onConnect={connectIntegration}
                onSync={handleSync}
                onDisconnect={handleDisconnect}
                syncing={syncing === connection?.id}
              />
            );
          })}
        </Flex>

        {/* Empty State */}
        {integrations?.available.length === 0 && (
          <Flex justify="center" align="center" py="9">
            <Text color="gray">No integrations available at this time.</Text>
          </Flex>
        )}
      </Flex>
    </ProtectedLayout>
  );
}
