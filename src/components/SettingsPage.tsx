import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Heading, Switch, Text } from "@radix-ui/themes";
import { Link } from "react-router";
import { useUser } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { ProtectedLayout } from "./ProtectedLayout";

export function SettingsPage() {
  const user = useUser();
  const { theme, toggleTheme } = useTheme();

  return (
    <ProtectedLayout title="Settings">
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

        {/* Data Sources */}
        <Card variant="surface">
          <Flex direction="column" p="6" gap="4">
            <Heading size="4">Data Sources</Heading>

            <Flex justify="between" align="center">
              <Flex direction="column" gap="1">
                <Text weight="medium">External Integrations</Text>
                <Text size="2" color="gray">
                  Connect fitness and health apps to import your data
                </Text>
              </Flex>
              <Link to="/integrations">
                <Button variant="outline">
                  <ArrowRightIcon />
                  Manage Integrations
                </Button>
              </Link>
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
    </ProtectedLayout>
  );
}
