# Escora Holidays — Monorepo Architecture & Production Guide

A production-ready luxury travel platform for Kerala journeys, built with a modern monorepo architecture, MongoDB persistence, Express API server, and high-performance React frontends.

---

## 🏗️ Project Architecture & Folder Structure

```
Escoraholidays/
├── apps/                                  # Applications
│   ├── api-server/                        # Express API backend server
│   │   ├── src/
│   │   │   ├── config/                    # Validated environment configuration singleton (env.ts)
│   │   │   ├── lib/                       # Utilities: structured logging (pino) & email (Resend)
│   │   │   ├── middleware/                # Middleware: requireAuth, errorHandler, notFoundHandler
│   │   │   ├── routes/                    # API endpoints (auth, destinations, packages, orders, etc.)
│   │   │   ├── app.ts                     # Express app setup, session store, static asset hosting
│   │   │   └── index.ts                   # Server bootstrap, DB connection, graceful shutdown
│   │   └── build.mjs                      # Production esbuild bundler
│   ├── escora-web/                        # Customer-facing luxury Kerala travel portal
│   │   ├── src/pages/                     # High-end journey discovery, booking & destination pages
│   │   └── scripts/                       # SEO shell builder & static pre-renderer
│   └── escora-admin/                      # Backoffice CMS & Operations Dashboard
│       └── src/pages/                     # Booking management, CMS editors, media library, analytics
│
├── lib/                                   # Shared Workspace Packages
│   ├── db/                                # MongoDB & Mongoose database package (@workspace/db)
│   │   ├── src/connection.ts              # Connection pooling, reconnects & lifecycle management
│   │   ├── src/models/                    # Mongoose domain models with atomic sequence counters
│   │   │   ├── counter.model.ts           # Sequence counter for stable numeric IDs
│   │   │   ├── destination.model.ts       # Destination schema, indexes & types
│   │   │   ├── package.model.ts           # Travel packages & journey details
│   │   │   ├── order.model.ts             # Booking orders & customer requests
│   │   │   ├── journal.model.ts           # Travel journals & editorial stories
│   │   │   ├── media.model.ts             # Uploaded media assets metadata
│   │   │   ├── travel-category.model.ts   # Travel styles & categories
│   │   │   ├── enquiry.model.ts           # Contact enquiries
│   │   │   ├── itinerary.model.ts         # Custom itineraries with secure share tokens
│   │   │   └── index.ts                   # Unified model exports
│   │   ├── src/seeds/                     # Index sync and initial/additive database seeds
│   │   └── src/schema/                    # Backward-compatible model re-exports
│   ├── api-zod/                           # Zod schemas derived from OpenAPI spec
│   ├── api-spec/                          # OpenAPI 3.0 specification & Orval config
│   └── api-client-react/                  # Auto-generated TanStack Query hooks & fetch client
│
├── scripts/                               # Workspace tooling & integration tests
│   └── test-api.ts                        # Comprehensive end-to-end API test suite
├── docs/                                  # Content reference guides & editorial copy
├── railway.toml                           # Production deployment pipeline configuration
├── pnpm-workspace.yaml                    # Workspace catalog and package boundaries
└── package.json                           # Root scripts and workspace orchestration
```

---

## ⚡ Quick Start & Development

### 1. Requirements
- Node.js 20+
- pnpm 9+
- MongoDB 6+ (local or MongoDB Atlas)

### 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure your MongoDB connection string is configured:
```env
MONGODB_URI=mongodb://localhost:27017/escora_dev
PORT=8080
NODE_ENV=development
SESSION_SECRET=your-secure-session-secret
PUBLIC_URL=http://localhost:3000
```

### 3. Initialize & Seed Database
Synchronize indexes and seed all destinations, packages, and journal articles:
```bash
pnpm run db:init
pnpm run db:seed
```

### 4. Run Development Servers
Start all workspace apps in parallel:
```bash
pnpm run dev
```
- **Web App**: `http://localhost:3000`
- **Admin CMS**: `http://localhost:3000/admin`
- **API Server**: `http://localhost:8080`

---

## 🚀 Production Build & Deployment

### Build Everything
To compile TypeScript, produce frontend production bundles, generate SEO shells, and bundle the backend:
```bash
pnpm run build:prod
```

### Verify Endpoints & Database
Run the integrated API & database test suite:
```bash
pnpm run test:api
```

### Start in Production
```bash
pnpm start
```

### Railway Deployment
The project is configured out-of-the-box for Railway via [railway.toml](file:///d:/Bloombiz/escoraholidays/Escoraholidays/railway.toml):
```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm run build:prod"

[deploy]
startCommand = "pnpm --filter db push-force && pnpm --filter db seed:kerala && node --enable-source-maps ./apps/api-server/dist/index.mjs"
```
During deployment, indexes are synchronized automatically, missing data is seeded non-destructively, and the high-performance bundle starts.

### Render Deployment
The project is configured out-of-the-box for Render via [render.yaml](file:///d:/Bloombiz/escoraholidays/Escoraholidays/render.yaml):

1. **Service Type**: **Web Service** (Node environment)
2. **Build Command**:
   ```bash
   npm install -g pnpm && pnpm install --frozen-lockfile && pnpm run build:prod
   ```
3. **Start Command**:
   ```bash
   node --enable-source-maps ./apps/api-server/dist/index.mjs
   ```
4. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI (`mongodb+srv://...`)
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: A long random string for session cookie encryption
   - `PUBLIC_URL`: Your Render public URL (e.g. `https://escoraholidays.onrender.com` or custom domain)
   - `RESEND_API_KEY`: *(Optional)* Your Resend email API key
   - `ADMIN_EMAIL`: Admin email for receiving booking/contact notifications

