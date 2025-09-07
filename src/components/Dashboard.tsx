import { DashboardIcon } from "@radix-ui/react-icons";
import { Avatar, Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";

interface User {
  userId: string;
  email: string;
  name: string;
  picture: string;
  createdAt: number;
  lastActivity: number;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <Flex
      direction="column"
      minHeight="100vh"
      style={{
        background: "linear-gradient(135deg, var(--gray-1) 0%, var(--gray-3) 100%)",
      }}
    >
      {/* Header */}
      <Card
        style={{
          borderRadius: 0,
          borderBottom: "1px solid var(--gray-6)",
        }}
      >
        <Flex style={{ maxWidth: "80rem", margin: "0 auto" }} px="4">
          <Flex justify="between" align="center" height="64px" width="100%">
            {/* Logo */}
            <Flex align="center" gap="3">
              <Flex
                align="center"
                justify="center"
                width="32px"
                height="32px"
                style={{
                  background: "linear-gradient(135deg, var(--blue-9) 0%, var(--purple-9) 100%)",
                  borderRadius: "var(--radius-3)",
                }}
              >
                <DashboardIcon width="20" height="20" color="white" />
              </Flex>
              <Heading size="5">Dashboard</Heading>
            </Flex>

            {/* User Menu */}
            <Flex align="center" gap="4">
              <Flex align="center" gap="3" className="hidden sm:flex">
                <Avatar src={user.picture} alt={user.name} size="2" fallback={user.name.charAt(0).toUpperCase()} />
                <Flex direction="column">
                  <Text size="2" weight="medium">
                    {user.name}
                  </Text>
                  <Text size="1" color="gray">
                    {user.email}
                  </Text>
                </Flex>
              </Flex>

              <Button onClick={onLogout} variant="ghost" size="2">
                Sign out
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>

      {/* Main Content */}
      <Flex direction="column" align="stretch" my="0" mx="auto" px="4" py="8" width="100%">
        <Card variant="surface">
          <Flex direction="column" align="center" width="100%" p="4">
              <Flex mb="6">
                <Avatar src={user.picture} alt={user.name} size="6" fallback={user.name.charAt(0).toUpperCase()} />
              </Flex>

              <Heading size="8" mb="2">
                Welcome, {user.name}!
              </Heading>

              <Text size="4" color="gray" mb="8">
                You're successfully signed in to your account.
              </Text>

              <Grid
                columns={{ initial: "1", sm: "2", lg: "3" }}
                gap="6"
                width="100%"
              >
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
                    <Button variant="classic">View Profile</Button>
                    <Button variant="outline">Settings</Button>
                    <Button onClick={onLogout} variant="outline" color="red">
                      Sign Out
                    </Button>
                  </Flex>
                </Card>
              </Grid>
            </Flex>
          </Card>
      </Flex>
    </Flex>
  );
}
