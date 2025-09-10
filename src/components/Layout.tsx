import { Card, Flex } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import styled from "styled-components";
import type { User } from "../types/user";
import { Sidebar } from "./Sidebar";
import { TopNavigation } from "./TopNavigation";

const LayoutContainer = styled(Flex)`
  height: 100vh;
  overflow: hidden;
`;

const ContentArea = styled(Flex)`
  height: calc(100vh - 60px); /* Subtract top navigation height */
`;

const MainContentContainer = styled(Flex)`
  height: 100%;
`;

const FullHeightCard = styled(Card)`
  height: 100%;
  max-height: 100%; /* Prevent the card from growing beyond its container */
  overflow: hidden; /* Prevent the card itself from scrolling */
  display: flex;
  flex-direction: column;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  min-height: 0; /* Allow content to shrink if needed */

  /* Hide scrollbar while maintaining scroll functionality */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */

  &::-webkit-scrollbar {
    display: none; /* WebKit browsers (Chrome, Safari, Edge) */
  }
`;

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
    <LayoutContainer direction="column" data-testid="layout">
      {/* Top Navigation */}
      <TopNavigation user={user} onLogout={onLogout} onToggleSidebar={toggleSidebar} />

      {/* Content Area with Sidebar */}
      <ContentArea flexGrow="1" pb="4">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={closeSidebar} data-testid="sidebar" />

        {/* Main Content */}
        <MainContentContainer direction="column" mx="4" flexGrow="1" data-testid="layout-content">
          <FullHeightCard variant="surface">
            <ScrollableContent>{children}</ScrollableContent>
          </FullHeightCard>
        </MainContentContainer>
      </ContentArea>
    </LayoutContainer>
  );
}
