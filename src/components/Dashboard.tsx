import { Avatar, Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router";
import type { User } from "../types/user";
import { Layout } from "./Layout";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <Layout user={user} onLogout={onLogout} title="Dashboard">
        <Flex data-testid="dashboard" direction="column" align="center" width="100%" p="4" height="100%">
          <Flex mb="6">
            <Avatar src={user.picture} alt={user.name} size="6" fallback={user.name.charAt(0).toUpperCase()} />
          </Flex>

          <Heading size="8" mb="2">
            Welcome, {user.name}!
          </Heading>

          <Text size="4" color="gray" mb="8">
            You're successfully signed in to your account.
          </Text>

          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="6" width="100%">
            {/* User Info Card */}
            <Card variant="surface">
              <Heading size="4" mb="4">
                Profile Information
              </Heading>
              <Flex direction="column" gap="3" align="start">
                <Flex direction="column">
                  <Text size="2" weight="medium" color="gray">
                    Name:
                  </Text>
                  <Text>{user.name}</Text>
                </Flex>
                <Flex direction="column">
                  <Text size="2" weight="medium" color="gray">
                    Email:
                  </Text>
                  <Text>{user.email}</Text>
                </Flex>
                <Flex direction="column">
                  <Text size="2" weight="medium" color="gray">
                    User ID:
                  </Text>
                  <Text size="1" style={{ fontFamily: "monospace" }}>
                    {user.userId}
                  </Text>
                </Flex>
              </Flex>
            </Card>

            {/* Session Info Card */}
            <Card variant="surface">
              <Heading size="4" mb="4">
                Session Information
              </Heading>
              <Flex direction="column" gap="3" align="start">
                <Flex direction="column">
                  <Text size="2" weight="medium" color="gray">
                    Created:
                  </Text>
                  <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
                </Flex>
                <Flex direction="column">
                  <Text size="2" weight="medium" color="gray">
                    Last Activity:
                  </Text>
                  <Text>{new Date(user.lastActivity).toLocaleString()}</Text>
                </Flex>
              </Flex>
            </Card>

            {/* Quick Actions Card */}
            <Card variant="surface">
              <Heading size="4" mb="4">
                Quick Actions
              </Heading>
              <Flex direction="column" gap="3">
                <Link to="/profile" style={{ textDecoration: "none" }}>
                  <Button variant="classic" style={{ width: "100%" }}>
                    View Profile
                  </Button>
                </Link>
                <Link to="/settings" style={{ textDecoration: "none" }}>
                  <Button variant="outline" style={{ width: "100%" }}>
                    Settings
                  </Button>
                </Link>
                <Button onClick={onLogout} variant="outline" color="red">
                  Sign Out
                </Button>
              </Flex>
            </Card>
          </Grid>
        </Flex>
    </Layout>
  );
}
