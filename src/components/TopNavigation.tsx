import { DashboardIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex } from "@radix-ui/themes";
import type { User } from "../types/user";
import { UserMenu } from "./UserMenu";

interface TopNavigationProps {
  user: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function TopNavigation({ user, onLogout, onToggleSidebar }: TopNavigationProps) {
  return (
    <Box height="64px" data-testid="top-navigation">
      <Flex justify="between" align="center" height="100%" px="4">
        {/* Left side - Logo and Sidebar Toggle */}
        <Flex align="center" gap="3">
          {/* Logo */}
          <Flex
            width="32px"
            height="32px"
            align="center"
            justify="center"
          >
            <DashboardIcon width="24" height="24" />
          </Flex>

          {/* Sidebar Toggle */}
          <Button variant="ghost" size="2" onClick={onToggleSidebar}>
            <HamburgerMenuIcon width="16" height="16" />
          </Button>
        </Flex>

        {/* Right side - User Menu */}
        <UserMenu user={user} onLogout={onLogout} />
      </Flex>
    </Box>
  );
}
