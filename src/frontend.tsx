/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { Theme } from "@radix-ui/themes";

import { App } from "./App";

const Wrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<Theme accentColor="red" grayColor="sand" radius="small">{children}</Theme>
	);
};

function start() {
	const root = createRoot(document.getElementById("root")!);
	root.render(<Wrapper><App /></Wrapper>);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", start);
} else {
	start();
}
