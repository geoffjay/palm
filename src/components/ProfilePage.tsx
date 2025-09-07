import { Avatar, Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import type { User } from "../types/user";
import { Layout } from "./Layout";

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
}

export function ProfilePage({ user, onLogout }: ProfilePageProps) {
  return (
    <Layout user={user} onLogout={onLogout} title="Profile">
      <Card variant="surface">
        <Flex direction="column" p="6" gap="6">
          <Flex align="center" gap="4">
            <Avatar src={user.picture} alt={user.name} size="8" fallback={user.name.charAt(0).toUpperCase()} />
            <Flex direction="column" gap="2">
              <Heading size="6">{user.name}</Heading>
              <Text color="gray">{user.email}</Text>
            </Flex>
          </Flex>

          <Flex direction="column" gap="4">
            <Heading size="4">Profile Information</Heading>

            <Flex direction="column" gap="3">
              <Flex direction="column" gap="2">
                <Text size="2" weight="medium">
                  Display Name
                </Text>
                <TextField.Root defaultValue={user.name} />
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" weight="medium">
                  Email Address
                </Text>
                <TextField.Root defaultValue={user.email} disabled />
                <Text size="1" color="gray">
                  Email cannot be changed
                </Text>
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" weight="medium">
                  User ID
                </Text>
                <Text
                  size="2"
                  style={{ fontFamily: "monospace", padding: "8px", background: "var(--gray-3)", borderRadius: "4px" }}
                >
                  {user.userId}
                </Text>
              </Flex>
            </Flex>

            <Flex gap="3" mt="4">
              <Button variant="classic">Save Changes</Button>
              <Button variant="outline">Cancel</Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Layout>
  );
}
