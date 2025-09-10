import * as Collapsible from "@radix-ui/react-collapsible";
import { DashboardIcon, MagnifyingGlassIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Link } from "react-router";

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
      <Flex width={isOpen ? "256px" : "0"} height="100%" direction="column">
        <Collapsible.Root open={isOpen}>
          <Collapsible.Content>
            <Flex
              direction="column"
              pl="2"
              py="2"
              justify="between"
              height="100%"
            >
              {/* Navigation Content */}
              <Flex direction="column" flexGrow="1">
                {/* Search */}
                <Box mb="6" height="100%">
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
              </Flex>

              {/* Help & Support */}
              <Box ml="2">
                <Button variant="ghost" size="2">
                  <QuestionMarkCircledIcon width="16" height="16" />
                  Help & support
                </Button>
              </Box>
            </Flex>
          </Collapsible.Content>
        </Collapsible.Root>
      </Flex>
    </>
  );
}
