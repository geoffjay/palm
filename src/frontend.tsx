/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { Theme } from "@radix-ui/themes";
import { createRoot } from "react-dom/client";

import "@radix-ui/themes/styles.css";

import { App } from "./App";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

import "./index.css";

const RadixThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();

  return (
    <Theme accentColor="red" grayColor="sand" radius="small" panelBackground="translucent" appearance={theme}>
      {children}
    </Theme>
  );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <RadixThemeWrapper>{children}</RadixThemeWrapper>
    </ThemeProvider>
  );
};

function start() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  root.render(
    <Wrapper>
      <App />
    </Wrapper>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
