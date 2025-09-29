import { DashboardIcon, HeartIcon, MagnifyingGlassIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Link } from "react-router";
import styled from "styled-components";

// Styled components for proper layout control
const SidebarContainer = styled(Flex)`
  height: 100%;
  overflow: hidden;
  margin-left: 8px;
`;

const SidebarContent = styled.div`
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "navigation"
    "help";
`;

const MainNavigation = styled.div`
  grid-area: navigation;
  overflow-y: auto;
  padding-left: 8px;
  padding-top: 8px;
  min-height: 0;
`;

const HelpSection = styled.div`
  grid-area: help;
  padding-left: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 24px; /* Ensure minimum height */
  align-items: bottom;
`;

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <Button
          variant="ghost"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
              onClose?.();
            }
          }}
        />
      )}

      {/* Sidebar */}
      {isOpen && (
        <SidebarContainer width="256px" direction="column">
          <SidebarContent>
            {/* Navigation Content */}
            <MainNavigation>
              {/* Search */}
              <Box mb="6" mx="1">
                <TextField.Root placeholder="Search" size="2" variant="soft">
                  <TextField.Slot>
                    <MagnifyingGlassIcon height="16" width="16" />
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              {/* Home Section */}
              <Box mb="6" ml="2">
                <Flex direction="column" gap="3">
                  <Text size="1" weight="medium" color="gray">
                    HOME
                  </Text>
                  <Link to="/" onClick={handleLinkClick}>
                    <Button variant="ghost" size="2">
                      <DashboardIcon width="16" height="16" />
                      Dashboard
                    </Button>
                  </Link>
                </Flex>
              </Box>

              {/* Health & Wellness Section */}
              <Box mb="6" ml="2">
                <Flex direction="column" gap="3">
                  <Text size="1" weight="medium" color="gray">
                    HEALTH & WELLNESS
                  </Text>
                  <Link to="/biometrics" onClick={handleLinkClick}>
                    <Button variant="ghost" size="2">
                      <HeartIcon width="16" height="16" />
                      Biometrics
                    </Button>
                  </Link>
                  <Link to="/integrations" onClick={handleLinkClick}>
                    <Button variant="ghost" size="2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      Integrations
                    </Button>
                  </Link>
                </Flex>
              </Box>
            </MainNavigation>

            {/* Help & Support */}
            <HelpSection>
              <Button variant="ghost" size="2">
                <QuestionMarkCircledIcon width="16" height="16" />
                Help & support
              </Button>
            </HelpSection>
          </SidebarContent>
        </SidebarContainer>
      )}
    </>
  );
}
