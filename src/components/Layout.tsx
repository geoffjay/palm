import { Box, Card, Flex } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import type { User } from "../types/user";
import { Sidebar } from "./Sidebar";
import { TopNavigation } from "./TopNavigation";

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

export function Layout({ user, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      // Auto-close sidebar on mobile
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <Flex direction="column" data-testid="layout">
      {/* Top Navigation */}
      <TopNavigation user={user} onLogout={onLogout} onToggleSidebar={toggleSidebar} />

      {/* Content Area with Sidebar */}
      <Flex flexGrow="1" px="2" height="100%">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={closeSidebar} data-testid="sidebar" />

        {/* Main Content */}
        <Flex direction="column" mx="4" flexGrow="1" height="100%" data-testid="layout-content">
          <Card variant="surface">
            {children}
          </Card>
        </Flex>
      </Flex>
    </Flex>
  );
}
