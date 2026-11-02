import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { config } from "./config/env";
import { errorHandler } from "./middleware/error-handler";

const app: Express = express();

// Trust Railway's (and other PaaS) reverse proxy so secure cookies work over HTTPS
app.set("trust proxy", 1);

// Redirect bare domain → www (canonical hostname)
app.use((req, res, next) => {
  const host = req.headers.host ?? "";
  if (host === "escoraholidays.com") {
    return res.redirect(301, `https://www.escoraholidays.com${req.url}`);
  }
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

function isOriginAllowed(origin: string): boolean {
  if (config.publicUrl && origin === config.publicUrl) return true;
  if (config.allowedOrigins.includes(origin)) return true;

  try {
    const originUrl = new URL(origin);
    const publicUrlObj = new URL(config.publicUrl);
    if (originUrl.origin === publicUrlObj.origin) return true;
  } catch {}

  // Allow standard local development tooling when not in production
  if (!config.isProduction) {
    if (
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
    ) {
      return true;
    }
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without Origin header (same-origin, curl, mobile, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      // Disallow unauthorized origins without crashing
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString("utf8");
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Build the session store backed by MongoDB
let sessionStore: session.Store | undefined;
if (config.mongoUri) {
  try {
    sessionStore = MongoStore.create({
      mongoUrl: config.mongoUri,
      collectionName: "sessions",
      ttl: 30 * 24 * 60 * 60, // 30 days
      autoRemove: "native",
      touchAfter: 24 * 3600, // lazy session update
    });
  } catch (err: unknown) {
    logger.error({ err }, "Failed to create Mongo session store");
  }
}

app.use(session({
  name: "escora.sid",
  secret: config.sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

app.use("/api", router);
app.use("/admin/api", router);

// SEO: dynamic sitemap.xml
app.get("/sitemap.xml", (_req, res) => {
  try {
    const ORIGIN = config.publicUrl;
    const webDist = path.resolve(process.cwd(), "apps/escora-web/dist/public");

    // Use the mtime of each pre-rendered HTML file as lastmod — accurate and automatic.
    // Falls back to today's date if the file doesn't exist.
    function lastmod(filePath: string): string {
      try {
        const stat = fs.statSync(path.join(webDist, filePath));
        return stat.mtime.toISOString().slice(0, 10);
      } catch {
        return new Date().toISOString().slice(0, 10);
      }
    }

    const staticUrls = [
      { path: "/",                                file: "index.html"                              },
      { path: "/journeys",                        file: "journeys/index.html"                     },
      { path: "/plan",                            file: "plan/index.html"                         },
      { path: "/destinations",                    file: "destinations/index.html"                 },
      { path: "/about",                           file: "about/index.html"                        },
      { path: "/collections/honeymoon",           file: "collections/honeymoon/index.html"        },
      { path: "/collections/health-wellness",     file: "collections/health-wellness/index.html"  },
      { path: "/collections/nature-wildlife",     file: "collections/nature-wildlife/index.html"  },
      { path: "/collections/hill-stations",       file: "collections/hill-stations/index.html"    },
      { path: "/collections/backwaters",          file: "collections/backwaters/index.html"       },
      { path: "/collections/beaches",             file: "collections/beaches/index.html"          },
      { path: "/collections/functional-medicine", file: "collections/functional-medicine/index.html" },
      { path: "/collections/historical-heritage", file: "collections/historical-heritage/index.html" },
      { path: "/contact",                         file: "contact/index.html"                      },
      { path: "/privacy-policy",                  file: "privacy-policy/index.html"               },
    ];

    // Clean sitemap: only <loc> and <lastmod>. Google ignores priority and changefreq.
    const urls = staticUrls.map(({ path: p, file }) =>
      `<url><loc>${ORIGIN}${p}</loc><lastmod>${lastmod(file)}</lastmod></url>`
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  } catch {
    res.status(500).send("Error generating sitemap");
  }
});

// SEO: robots.txt
app.get("/robots.txt", (_req, res) => {
  const ORIGIN = config.publicUrl;
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\nSitemap: ${ORIGIN}/sitemap.xml\n`);
});

function getStandaloneMaintenanceHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escora Holidays — Under Maintenance</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0A1410;
      color: #FAF8F3;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 32px 24px;
      text-align: center;
    }
    .brand {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 32px;
      font-weight: 600;
      letter-spacing: 0.12em;
      color: #FAF8F3;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    main {
      max-width: 440px;
      margin: auto 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 28px;
      font-weight: 400;
      color: #FAF8F3;
      margin-bottom: 12px;
    }
    p {
      color: rgba(250, 248, 243, 0.7);
      font-size: 15px;
      line-height: 1.6;
      font-weight: 300;
      margin-bottom: 28px;
    }
    .btn-admin {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      border-radius: 9999px;
      background: #183D2E;
      border: 1px solid rgba(200, 155, 60, 0.4);
      color: #FAF8F3;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
      margin-bottom: 24px;
    }
    .btn-admin:hover {
      background: #1E4D3A;
      border-color: #C89B3C;
    }
    .contact {
      font-size: 12px;
      color: rgba(250, 248, 243, 0.5);
    }
    .contact a {
      color: #C89B3C;
      text-decoration: none;
    }
    .contact a:hover {
      text-decoration: underline;
    }
    footer {
      font-size: 12px;
      color: rgba(250, 248, 243, 0.35);
    }
  </style>
</head>
<body>
  <div></div>
  <main>
    <div class="brand">Escora</div>
    <h1>Under Maintenance</h1>
    <p>We are currently undergoing scheduled maintenance.<br>Our website will be back online shortly.</p>
    <a href="/admin" class="btn-admin">
      <span>Admin Portal</span>
      <span style="color:#C89B3C;">&rarr;</span>
    </a>
    <div class="contact">
      For urgent inquiries: <a href="mailto:admin@escoraholidays.com">admin@escoraholidays.com</a>
    </div>
  </main>
  <footer>
    &copy; ${new Date().getFullYear()} Escora Holidays. All rights reserved.
  </footer>
</body>
</html>`;
}

// Serve built frontends in production (built by `pnpm run build:prod`)
const adminDist = path.resolve(process.cwd(), "apps/escora-admin/dist/public");
const webDist   = path.resolve(process.cwd(), "apps/escora-web/dist/public");

if (fs.existsSync(adminDist)) {
  app.use("/admin", express.static(adminDist));
  app.use("/admin", (_req, res) => res.sendFile(path.join(adminDist, "index.html")));
}

if (config.maintenanceMode) {
  // In maintenance mode:
  // 1. If webDist exists, serve static assets (css, js, images) without auto-serving directory index.html
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist, { index: false, redirect: false }));
    app.use((_req, res) => {
      res.setHeader("Retry-After", "3600");
      res.status(503).sendFile(path.join(webDist, "index.html"));
    });
  } else {
    // If webDist is not built yet, serve the standalone luxury maintenance page
    app.use((_req, res) => {
      res.setHeader("Retry-After", "3600");
      res.status(503).send(getStandaloneMaintenanceHtml());
    });
  }
} else if (fs.existsSync(webDist)) {
  // Normal mode: serve pre-rendered files and SPA index.html
  app.use(express.static(webDist, { redirect: false }));
  app.use((req, res) => {
    const prerendered = path.join(webDist, req.path, "index.html");
    if (fs.existsSync(prerendered)) {
      return res.sendFile(prerendered);
    }
    res.sendFile(path.join(webDist, "index.html"));
  });
}

// Global error handler
app.use(errorHandler);

export default app;
