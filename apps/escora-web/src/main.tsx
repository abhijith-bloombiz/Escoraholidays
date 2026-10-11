import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root")!;

// Remove the static SEO shell injected by build-seo-shell.mjs before React mounts.
// The shell is visibility:hidden so it never flashes, but we remove it so React
// starts with a clean root rather than trying to reconcile against SEO-only markup.
const seoShell = document.getElementById("seo-shell");
if (seoShell) seoShell.remove();

createRoot(rootEl).render(<App />);
