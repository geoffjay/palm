import { Button, Card, Flex, Heading, Switch, Text } from "@radix-ui/themes";
import { useTheme } from "../contexts/ThemeContext";
import type { User } from "../types/user";
import { Layout } from "./Layout";

interface SettingsPageProps {
  user: User;
  onLogout: () => void;
}

export function SettingsPage({ user, onLogout }: SettingsPageProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Layout user={user} onLogout={onLogout}>
      <Flex direction="column" gap="6">
        {/* Appearance Settings */}
        <Card variant="surface">
          <Flex direction="column" p="6" gap="4">
            <Heading size="4">Appearance</Heading>

            <Flex justify="between" align="center">
              <Flex direction="column" gap="1">
                <Text weight="medium">Dark Mode</Text>
                <Text size="2" color="gray">
                  Toggle between light and dark themes
                </Text>
              </Flex>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </Flex>

            <Flex justify="between" align="center">
              <Flex direction="column" gap="1">
                <Text weight="medium">Compact View</Text>
                <Text size="2" color="gray">
                  Use a more compact layout
                </Text>
              </Flex>
              <Switch />
            </Flex>
          </Flex>
        </Card>

        {/* Notification Settings */}
        <Card variant="surface">
          <Flex direction="column" p="6" gap="4">
            <Heading size="4">Notifications</Heading>

            <Flex justify="between" align="center">
              <Flex direction="column" gap="1">
                <Text weight="medium">Email Notifications</Text>
                <Text size="2" color="gray">
                  Receive updates via email
                </Text>
              </Flex>
              <Switch defaultChecked />
            </Flex>

            <Flex justify="between" align="center">
              <Flex direction="column" gap="1">
                <Text weight="medium">Push Notifications</Text>
                <Text size="2" color="gray">
                  Receive browser notifications
                </Text>
              </Flex>
              <Switch />
            </Flex>
          </Flex>
        </Card>

        {/* Account Settings */}
        <Card variant="surface">
          <Flex direction="column" p="6" gap="4">
            <Heading size="4">Account</Heading>

            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Flex direction="column" gap="1">
                  <Text weight="medium">Account Created</Text>
                  <Text size="2" color="gray">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </Flex>
              </Flex>

              <Flex justify="between" align="center">
                <Flex direction="column" gap="1">
                  <Text weight="medium">Last Activity</Text>
                  <Text size="2" color="gray">
                    {new Date(user.lastActivity).toLocaleString()}
                  </Text>
                </Flex>
              </Flex>
            </Flex>

            <Flex gap="3" mt="4">
              <Button variant="outline" color="red">
                Delete Account
              </Button>
              <Button variant="outline">Export Data</Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Layout>
  );
}
