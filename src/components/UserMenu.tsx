import { DesktopIcon, ExitIcon, GearIcon, MoonIcon, PersonIcon, SunIcon } from "@radix-ui/react-icons";
import { Avatar, Box, Button, DropdownMenu, Flex, Separator, Text } from "@radix-ui/themes";
import { Link } from "react-router";
import styled from "styled-components";

import { useTheme } from "../contexts/ThemeContext";
import type { User } from "../types/user";

const DropdownMenuContent = styled(DropdownMenu.Content)`
  margin-top: 2px;
  width: 256px;
`;

const DropdownMenuItem = styled(DropdownMenu.Item)`
  height: 32px;
  padding: 0 4px;
  align-items: middle;
`;

const ThemeButton = styled(Button)`
  height: 32px;
  width: 32px;
  align-items: middle;
`;

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost" size="1">
          <Avatar
            src={user.picture}
            alt={user.name}
            size="2"
            fallback={user.name.charAt(0).toUpperCase()}
            radius="full"
          />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenuContent align="end" sideOffset={8}>
        {/* User Info */}
        <Flex p="3" direction="column" gap="1">
          <Text size="3" weight="medium">
            {user.name}
          </Text>
          <Text size="2" color="gray">
            {user.email}
          </Text>
        </Flex>

        <Separator size="4" />

        {/* Theme Selector */}
        <Flex py="2" px="4" align="center" justify="between" height="48px">
          <Text size="2" weight="medium">
            Theme
          </Text>
          <Flex gap="2" align="center">
            <ThemeButton
              variant={theme === "light" ? "solid" : "ghost"}
              radius="full"
              size="1"
              onClick={() => setTheme("light")}
            >
              <SunIcon width="20" height="20" />
            </ThemeButton>
            <ThemeButton
              variant={theme === "dark" ? "solid" : "ghost"}
              radius="full"
              size="1"
              onClick={() => setTheme("dark")}
            >
              <MoonIcon width="20" height="20" />
            </ThemeButton>
            <ThemeButton
              variant="ghost"
              size="1"
              radius="full"
              onClick={() => {
                const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                setTheme(systemTheme);
              }}
            >
              <DesktopIcon width="20" height="20" />
            </ThemeButton>
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <Flex align="center" gap="3" p="2">
              <PersonIcon width="16" height="16" />
              <Text>Profile</Text>
            </Flex>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Flex align="center" gap="3" p="2">
              <GearIcon width="16" height="16" />
              <Text>Settings</Text>
            </Flex>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={onLogout}>
          <Flex align="center" gap="3" p="2">
            <ExitIcon width="16" height="16" />
            <Text>Log out</Text>
          </Flex>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu.Root>
  );
}
