import { DashboardIcon, GearIcon, MoonIcon, PersonIcon, SunIcon } from "@radix-ui/react-icons";
import { Avatar, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { Link, useLocation } from "react-router";
import { useTheme } from "../contexts/ThemeContext";
import type { User } from "../types/user";

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Layout({ user, onLogout, children, title = "Dashboard" }: LayoutProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: "/", label: "Dashboard", icon: DashboardIcon },
    { path: "/profile", label: "Profile", icon: PersonIcon },
    { path: "/settings", label: "Settings", icon: GearIcon },
  ];

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
              <Heading size="5">{title}</Heading>
            </Flex>

            {/* Navigation */}
            <Flex align="center" gap="2" className="hidden md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} style={{ textDecoration: "none" }}>
                    <Button
                      variant={isActive ? "solid" : "ghost"}
                      size="2"
                      style={{
                        color: isActive ? "white" : "var(--gray-11)",
                      }}
                    >
                      <Icon width="16" height="16" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </Flex>

            {/* User Menu */}
            <Flex align="center" gap="4">
              {/* Theme Toggle */}
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="2"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <MoonIcon width="16" height="16" /> : <SunIcon width="16" height="16" />}
              </Button>

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
        {children}
      </Flex>
    </Flex>
  );
}
