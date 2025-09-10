import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DesktopIcon, ExitIcon, GearIcon, MoonIcon, PersonIcon, SunIcon } from "@radix-ui/react-icons";
import * as Separator from "@radix-ui/react-separator";
import { Avatar, Box, Button, Flex, Text } from "@radix-ui/themes";
import { Link } from "react-router";
import { useTheme } from "../contexts/ThemeContext";
import type { User } from "../types/user";

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
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

      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8}>
          {/* User Info */}
          <Box p="3">
            <Text size="3" weight="medium">
              {user.name}
            </Text>
            <Text size="2" color="gray">
              {user.email}
            </Text>
          </Box>

          <Separator.Root />

          {/* Theme Selector */}
          <Box p="3">
            <Text size="2" weight="medium" mb="2">
              Theme
            </Text>
            <Flex gap="1">
              <Button variant={theme === "light" ? "solid" : "ghost"} size="1" onClick={() => setTheme("light")}>
                <SunIcon width="16" height="16" />
              </Button>
              <Button variant={theme === "dark" ? "solid" : "ghost"} size="1" onClick={() => setTheme("dark")}>
                <MoonIcon width="16" height="16" />
              </Button>
              <Button
                variant="ghost"
                size="1"
                onClick={() => {
                  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  setTheme(systemTheme);
                }}
              >
                <DesktopIcon width="16" height="16" />
              </Button>
            </Flex>
          </Box>

          <Separator.Root />

          {/* Menu Items */}
          <DropdownMenu.Item asChild>
            <Link to="/profile">
              <Flex align="center" gap="3" p="2">
                <PersonIcon width="16" height="16" />
                <Text>Profile</Text>
              </Flex>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link to="/settings">
              <Flex align="center" gap="3" p="2">
                <GearIcon width="16" height="16" />
                <Text>Settings</Text>
              </Flex>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item onSelect={onLogout}>
            <Flex align="center" gap="3" p="2">
              <ExitIcon width="16" height="16" />
              <Text>Log out</Text>
            </Flex>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
