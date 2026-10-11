/**
 * Static prerender script — runs after `vite build`.
 * Spins up a local static server, visits each route with headless Chrome,
 * and saves the fully-rendered HTML into dist/public so Google gets real content.
 */

import puppeteer from "puppeteer-core";
import { createServer } from "http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = resolve(__dirname, "../dist/public");
const PORT = 5999;
const BASE = `http://localhost:${PORT}`;

const ROUTES = [
  "/",
  "/about",
  "/journeys",
  "/destinations",
  "/journal",
  "/contact",
  "/plan",
  "/privacy-policy",
  "/collections/honeymoon",
  "/collections/health-wellness",
  "/collections/nature-wildlife",
  "/collections/hill-stations",
  "/collections/backwaters",
  "/collections/beaches",
  "/collections/functional-medicine",
  "/collections/historical-heritage",
];

// Detect Chrome / Chromium location (local macOS dev + Linux/Nixpacks CI)
const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/run/current-system/sw/bin/chromium",   // Nixpacks nix store
  "/nix/var/nix/profiles/default/bin/chromium",
];
// Also check $CHROMIUM_PATH env var (set by nixpacks or CI)
if (process.env.CHROMIUM_PATH) CHROME_PATHS.unshift(process.env.CHROMIUM_PATH);

// Last resort: find chromium in PATH
let chromePath = CHROME_PATHS.find(p => existsSync(p));
if (!chromePath) {
  try {
    const { execSync } = await import("child_process");
    const found = execSync("which chromium || which chromium-browser || which google-chrome || true", { encoding: "utf8" }).trim();
    if (found) chromePath = found.split("\n")[0].trim();
  } catch { /* ignore */ }
}
if (!chromePath) {
  console.error("❌  Chrome/Chromium not found. Skipping prerender.");
  process.exit(0);
}
console.log("  Using browser:", chromePath);

// Minimal static file server
function serveStatic(distDir, port) {
  const MIME = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".woff2": "font/woff2",
    ".ico": "image/x-icon",
  };

  const server = createServer((req, res) => {
    let urlPath = req.url.split("?")[0];

    // Stub all /api/ calls with empty JSON so React components fall back to
    // their static fallback data instead of crashing on unexpected HTML.
    if (urlPath.startsWith("/api/")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("[]");
      return;
    }

    // SPA fallback: serve index.html for all non-asset routes
    let filePath = join(distDir, urlPath);
    if (!urlPath.includes(".")) filePath = join(distDir, "index.html");

    try {
      const ext = filePath.match(/\.[^.]+$/)?.[0] ?? ".html";
      const content = readFileSync(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
      res.end(content);
    } catch {
      const fallback = readFileSync(join(distDir, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(fallback);
    }
  });

  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function prerender() {
  console.log("🚀  Starting prerender...");
  const server = await serveStatic(DIST, PORT);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--single-process",           // needed in some container envs
      "--no-zygote",
    ],
    headless: true,
  });

  let ok = 0;
  let fail = 0;

  for (const route of ROUTES) {
    const page = await browser.newPage();
    // Suppress JS console noise, don't abort on errors
    page.on("pageerror", () => {});
    page.on("requestfailed", () => {});

    try {
      await page.goto(`${BASE}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });

      // Wait for React to mount real content in #root.
      // API stubs return [] so components use their fallback data immediately.
      try {
        await page.waitForFunction(
          () => {
            const root = document.getElementById("root");
            if (!root || root.childElementCount === 0) return false;
            // nav appears as soon as the Layout shell renders
            return root.querySelector("nav, section, main, footer") !== null;
          },
          { timeout: 12000 }
        );
      } catch {
        // Capture whatever rendered — better than nothing
      }
      // Settle time: allow React state updates, font loads, lazy images
      await new Promise(r => setTimeout(r, 1500));

      const html = await page.content();

      // Write to the right path.
      // For "/" we write index.html directly (overwrites the empty Vite shell).
      // For sub-routes we create a directory with index.html inside.
      if (route === "/") {
        writeFileSync(join(DIST, "index.html"), html, "utf8");
      } else {
        const outDir = join(DIST, route.slice(1));
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, "index.html"), html, "utf8");
      }

      console.log(`  ✅  ${route}`);
      ok++;
    } catch (err) {
      console.log(`  ❌  ${route} — ${err.message}`);
      fail++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`\n🎉  Prerender complete: ${ok} succeeded, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

prerender().catch(err => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
