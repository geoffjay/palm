import { Flex, Text, Spinner } from "@radix-ui/themes";
import { LockClosedIcon } from "@radix-ui/react-icons";

export function LoadingScreen() {
  return (
    <Flex 
      direction="column" 
      align="center" 
      justify="center"
      minHeight="100vh"
      style={{
        background: "linear-gradient(135deg, var(--gray-1) 0%, var(--gray-3) 100%)"
      }}
    >
      <Flex direction="column" align="center">
        {/* Logo */}
        <Flex justify="center" mb="6">
          <Flex 
            align="center" 
            justify="center"
            width="64px"
            height="64px"
            style={{
              background: "linear-gradient(135deg, var(--blue-9) 0%, var(--purple-9) 100%)",
              borderRadius: "var(--radius-3)"
            }}
          >
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
