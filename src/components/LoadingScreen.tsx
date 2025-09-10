import { LockClosedIcon } from "@radix-ui/react-icons";
import { Flex, Spinner, Text } from "@radix-ui/themes";

export function LoadingScreen() {
  return (
    <Flex direction="column" align="center" justify="center" minHeight="100vh">
      <Flex direction="column" align="center">
        {/* Logo */}
        <Flex justify="center" mb="6">
          <Flex align="center" justify="center" width="64px" height="64px">
            <LockClosedIcon width="40" height="40" color="white" />
          </Flex>
        </Flex>

        {/* Loading Spinner */}
        <Flex mb="4">
          <Spinner size="3" />
        </Flex>

        {/* Loading Text */}
        <Text size="2" color="gray">
          Loading your account...
        </Text>
      </Flex>
    </Flex>
  );
}
