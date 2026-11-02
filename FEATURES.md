# Escora — Full Application Feature Reference

> A luxury travel platform for Kerala, India. The system consists of a customer-facing website, an admin portal, and a shared REST API. All three are built as a pnpm monorepo and deployed together on Railway.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Deployment & Infrastructure](#deployment--infrastructure)
4. [Database Schema](#database-schema)
5. [Backend API](#backend-api)
6. [Admin Portal](#admin-portal)
7. [Customer Website](#customer-website)
8. [Authentication & Sessions](#authentication--sessions)
9. [Email Notifications](#email-notifications)
10. [SEO & Discoverability](#seo--discoverability)
11. [Enquiry Tracking & Analytics](#enquiry-tracking--analytics)
12. [Data Flows](#data-flows)

---

## Architecture Overview

```
monorepo/
├── apps/
│   ├── api-server/       Express 5 REST API (port 8080)
│   ├── escora-admin/     React admin SPA  → served at /admin
│   └── escora-web/       React customer SPA → served at /
├── lib/
│   ├── db/               MongoDB Mongoose schemas + seeds
│   ├── api-zod/          Zod validators for every API route
│   └── api-client-react/ TanStack Query hooks + TypeScript types
```

In production, one Node process serves all three applications:
- `GET /admin/*` → serves the built admin SPA
- `GET /api/*` and `GET /admin/api/*` → REST API (both paths work)
- `GET /sitemap.xml` → dynamically generated sitemap
- `GET /robots.txt` → crawler instructions
- `GET /*` → serves the built customer SPA

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| API framework | Express 5 |
| Database | MongoDB (Atlas or self-hosted) |
| ODM | Mongoose |
| Schema validation | Zod v4 |
| Session store | connect-mongo (MongoDB-backed) |
| Admin UI | React 18, Vite, Tailwind CSS, shadcn/ui |
| Customer UI | React 18, Vite, custom CSS |
| Data fetching | TanStack Query (React Query v5) |
| Routing | Wouter |
| Email | Resend REST API (via `fetch`, no SDK) |
| Monorepo | pnpm workspaces |
| Deployment | Railway (nixpacks builder) |

---

## Deployment & Infrastructure

### Build Pipeline (`railway.toml`)

```
Build:  pnpm install && pnpm run build:prod
Start:  pnpm --filter db push-force && pnpm --filter db seed:kerala && node --enable-source-maps ./apps/api-server/dist/index.mjs
```

- **Build** installs all dependencies and compiles both React apps + bundles the API server with esbuild.
- **Start** synchronizes MongoDB collections and indexes (`init-db`), runs additive seeds, then starts the server.
- Restart policy: `on_failure`, max 3 retries.

### Environment Variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb://...` or `mongodb+srv://...`) |
| `SESSION_SECRET` | Cookie signing secret (falls back to dev default) |
| `NODE_ENV` | `production` enables secure cookies |
| `PORT` | Server listen port |
| `RESEND_API_KEY` | Resend API key for transactional emails. Optional — emails are silently skipped if unset. |

### Session Persistence

Sessions are stored in the `sessions` collection in MongoDB via `connect-mongo`. Sessions last 30 days and have automated TTL index removal.

---

## Database Schema

### `destinations`

Represents a travel destination (e.g. Alleppey Backwaters, Munnar Hills).

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text NOT NULL | Display name |
| `slug` | text UNIQUE NOT NULL | URL-safe identifier |
| `region` | text NOT NULL | Geographic region |
| `type` | text NOT NULL | e.g. Backwaters, Hills, Heritage |
| `description` | text | Long description |
| `short_desc` | text | One-liner for cards |
| `image_url` | text | Primary image |
| `gallery_images` | text | JSON array of image URLs |
| `latitude` | real | Map coordinate |
| `longitude` | real | Map coordinate |
| `best_season` | text | e.g. "October – March" |
| `elevation` | text | e.g. "2,695 m" |
| `nights_min` | integer | Recommended minimum stay |
| `nights_max` | integer | Recommended maximum stay |
| `published` | boolean DEFAULT false | Visible on customer site |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated on change |

---

### `packages`

A curated travel package / journey (e.g. "Classic Kerala 7N").

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text NOT NULL | Package title |
| `slug` | text UNIQUE NOT NULL | URL identifier |
| `category` | text NOT NULL | e.g. Classic, Coastal, Wellness |
| `description` | text | Full description |
| `short_desc` | text | Card summary |
| `duration_nights` | integer NOT NULL | Length of trip |
| `route` | text | e.g. "Kochi → Alleppey → Munnar" |
| `best_for` | text | e.g. "Couples, Families" |
| `season` | text | Best travel season |
| `price_from` | integer | Starting price in INR |
| `hero_image_url` | text | Banner image |
| `gallery_images` | text | JSON array |
| `itinerary` | text | JSON: `[{day, title, description}]` |
| `inclusions` | text | JSON array of strings |
| `exclusions` | text | JSON array of strings |
| `faqs` | text | JSON array of Q&A |
| `accommodations` | text | Accommodation details |
| `tags` | text | Comma-separated tags |
| `featured` | boolean DEFAULT false | Show on homepage hero section |
| `published` | boolean DEFAULT false | Visible on customer site |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `orders`

An enquiry or booking submitted by a guest.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `package_id` | integer | Linked package (if any) |
| `package_name` | text | Denormalised name at time of booking |
| `guest_name` | text NOT NULL | |
| `guest_email` | text NOT NULL | |
| `guest_phone` | text NOT NULL | |
| `travel_style` | text | Honeymoon / Family / Solo / Wellness / Bespoke Group |
| `destinations` | text | Comma-separated destination names |
| `travel_date` | text | Arrival date (ISO string) |
| `departure_date` | text | Return date |
| `guest_count` | integer | Total travellers |
| `budget_range` | text | e.g. "₹2L – ₹5L" |
| `special_requests` | text | Free-text preferences |
| `status` | text DEFAULT "enquiry" | enquiry / confirmed / completed / cancelled |
| `total_amount` | integer | Confirmed price in INR |
| `notes` | text | Internal admin notes |
| `ip_address` | text | Visitor IP at submission |
| `user_agent` | text | Browser user-agent string |
| `referrer_url` | text | Page the visitor came from |
| `landing_page` | text | Exact URL they were on when submitting |
| `utm_source` | text | UTM tracking source |
| `utm_medium` | text | UTM tracking medium |
| `utm_campaign` | text | UTM campaign name |
| `browser_language` | text | e.g. "en-IN" |
| `screen_resolution` | text | e.g. "390x844" |
| `timezone` | text | e.g. "Asia/Kolkata" |
| `geo_country` | text | Country from IP geolocation |
| `geo_region` | text | State/region from IP geolocation |
| `geo_city` | text | City from IP geolocation |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `journal_posts`

Travel stories and editorial content.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `title` | text NOT NULL | |
| `slug` | text UNIQUE NOT NULL | |
| `category` | text NOT NULL | e.g. Travel, Wellness, Destinations |
| `excerpt` | text | Short preview text |
| `content` | text | Full article body — stored as HTML when authored via the rich-text toolbar |
| `author_name` | text | |
| `author_role` | text | e.g. "Founder", "Journey Designer" |
| `author_image_url` | text | |
| `image_url` | text | Cover image |
| `read_time_minutes` | integer | Estimated reading time |
| `tags` | text | Comma-separated tags (e.g. "backwaters,slow-travel") |
| `published` | boolean DEFAULT true | Visible on customer site |
| `published_at` | text | Display date (ISO string) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `enquiries`

Contact messages submitted from the public Contact Us page.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text NOT NULL | Sender's name |
| `email` | text NOT NULL | Sender's email |
| `phone` | text | Optional phone number |
| `message` | text NOT NULL | Message body |
| `status` | text DEFAULT "new" | new / read / replied |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated on change |

---

### `travel_categories`

Homepage travel style cards (e.g. Honeymoon, Family, Wellness).

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `slug` | text UNIQUE NOT NULL | |
| `label` | text NOT NULL | Display label |
| `description` | text | |
| `image_url` | text | |
| `price_from` | text | Display string e.g. "From ₹1.2L" |
| `price_label` | text | Subtitle text |
| `journey_count` | text | e.g. "12 journeys" |
| `sort_order` | integer DEFAULT 0 | Display ordering |
| `published` | boolean DEFAULT true | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `media`

Uploaded files / images.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `filename` | text NOT NULL | Original filename |
| `url` | text NOT NULL | Public access URL |
| `mime_type` | text NOT NULL | e.g. image/jpeg |
| `size_bytes` | integer | File size |
| `created_at` | timestamptz | |

---

## Backend API

Base URL: `/api` (also available at `/admin/api` for compatibility).

All write operations (`POST`, `PATCH`, `DELETE`) on protected resources require an active admin session cookie. Public `GET` endpoints are accessible without authentication.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login with username + password. Returns `{ok, username}` and sets session cookie. Credentials: `Admin` / `Admin`. |
| `POST` | `/api/auth/logout` | Public | Destroys the session and clears the cookie. |
| `GET` | `/api/auth/me` | Public | Returns `{authenticated, username}` — used to restore session on page load. |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns `{status: "ok"}`. Used by Railway health checks. |

### Dashboard

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Admin | Returns aggregate counts, status breakdowns, recent orders, revenue total, and new contact enquiry count. |

**Response shape:**
```json
{
  "totalDestinations": 6,
  "publishedDestinations": 4,
  "totalPackages": 8,
  "publishedPackages": 6,
  "totalOrders": 12,
  "enquiries": 10,
  "confirmed": 2,
  "totalJournalPosts": 5,
  "publishedJournalPosts": 5,
  "totalRevenue": 450000,
  "newContactEnquiries": 3,
  "recentOrders": [...],
  "ordersByStatus": [{ "status": "enquiry", "count": 10 }]
}
```

### Destinations

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/destinations` | Public | List all destinations. Query params: `type`, `published`. |
| `GET` | `/api/destinations/:id` | Public | Get destination by ID. |
| `POST` | `/api/destinations` | Admin | Create a destination. |
| `PATCH` | `/api/destinations/:id` | Admin | Update a destination. |
| `DELETE` | `/api/destinations/:id` | Admin | Delete a destination. |

### Packages (Journeys)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/packages` | Public | List all packages. Query params: `category`, `published`, `featured`. |
| `GET` | `/api/packages/:id` | Public | Get package by ID. |
| `POST` | `/api/packages` | Admin | Create a package. |
| `PATCH` | `/api/packages/:id` | Admin | Update a package. |
| `DELETE` | `/api/packages/:id` | Admin | Delete a package. |

### Orders (Bookings)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/orders` | **Public** | Submit an enquiry from the customer site. Captures IP, user-agent, geo, and fires confirmation + admin notification emails. |
| `GET` | `/api/orders/export` | Admin | Download all orders as a CSV file (`orders.csv`). Route registered before `/:id` to avoid parameter collision. |
| `GET` | `/api/orders` | Admin | List all orders. Query param: `status`. |
| `GET` | `/api/orders/:id` | Admin | Get order by ID. |
| `PATCH` | `/api/orders/:id` | Admin | Update status, amount, notes, travel date, guest count. |
| `DELETE` | `/api/orders/:id` | Admin | Delete an order. |

### Journal Posts

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/journal` | Public | List posts. Query params: `category`, `published`, `tag` (partial match against the `tags` field). |
| `GET` | `/api/journal/:id` | Public | Get post by ID. |
| `POST` | `/api/journal` | Admin | Create a post. Accepts `tags` as comma-separated string. |
| `PATCH` | `/api/journal/:id` | Admin | Update a post. |
| `DELETE` | `/api/journal/:id` | Admin | Delete a post. |

### Contact Enquiries

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/enquiries` | **Public** | Submit a contact message. Fires a confirmation email to the sender and a notification email to the admin. |
| `GET` | `/api/enquiries` | Admin | List all enquiries. Query params: `status` (new / read / replied). |
| `GET` | `/api/enquiries/:id` | Admin | Get a single enquiry. |
| `PATCH` | `/api/enquiries/:id` | Admin | Update status (`new` → `read` → `replied`). |
| `DELETE` | `/api/enquiries/:id` | Admin | Delete an enquiry. |

### Travel Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/travel-categories` | Public | List categories. Query param: `published`. |
| `GET` | `/api/travel-categories/:id` | Public | Get category by ID. |
| `POST` | `/api/travel-categories` | Admin | Create a category. |
| `PATCH` | `/api/travel-categories/:id` | Admin | Update a category. |
| `DELETE` | `/api/travel-categories/:id` | Admin | Delete a category. |

### Media

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/media` | Admin | List all uploaded media. |
| `POST` | `/api/media` | Admin | Upload a file (multipart/form-data). |
| `DELETE` | `/api/media/:id` | Admin | Delete a media record. |

### SEO Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/sitemap.xml` | Public | Dynamically generated XML sitemap. Includes static pages + all published packages, destinations, and journal posts. |
| `GET` | `/robots.txt` | Public | Crawler instructions. Allows all, points to `/sitemap.xml`. |

---

## Admin Portal

Served at `/admin`. Requires login. Built with React + Vite + shadcn/ui component library.

### Login Page (`/admin` when unauthenticated)

- Username + password form
- Credentials: `Admin` / `Admin`
- On success: stores session cookie and redirects to dashboard
- Session persists 30 days in MongoDB — survives server restarts and redeployments

---

### Dashboard (`/`)

Displays an at-a-glance overview of all operations.

**Stat cards** (each links to its respective section):
- Total Destinations (+ published count)
- Total Journeys/Packages (+ published count)
- Total Enquiries (+ confirmed count)
- Total Journal Posts (+ published count)
- **Revenue Snapshot** — sum of `total_amount` across all confirmed/completed orders, formatted as ₹X.XL
- **Contact Inbox** — count of contact enquiries with `status = "new"`, links to `/enquiries`

**Real-time notifications** — the dashboard stats query polls every 30 seconds (`refetchInterval: 30000`). When the order count or contact enquiry count increases between polls, a toast notification appears automatically.

**Recent Enquiries table** — last 5 orders with guest name, travel style, status badge.

**Orders by Status chart** — breakdown of enquiry / confirmed / completed / cancelled counts.

---

### Destinations Page (`/destinations`)

Full CRUD management for travel destinations.

**Table columns:** Name, Region, Type, Season, Status (Published/Draft)

**Add / Edit Dialog fields:**
- Name *(required)*
- Slug *(required, URL identifier)*
- Region *(required)*
- Type *(required — e.g. Backwaters, Hills, Heritage)*
- Short Description
- Full Description
- Image URL
- Best Season
- Min Nights / Max Nights
- Published toggle

**View Dialog** — read-only panel showing all fields with inline image preview. Includes an Edit shortcut button.

**Delete** — confirmation dialog before permanent removal.

---

### Packages / Journeys Page (`/packages`)

Full CRUD management for travel packages.

**Table columns:** Name, Category, Duration, Route, Price From, Featured badge, Status

**Add / Edit Dialog fields:**
- Name *(required)*
- Slug *(required)*
- Category *(required — e.g. Classic, Coastal, Wellness)*
- Duration (nights) *(required)*
- Price From (₹)
- Route (e.g. "Kochi → Alleppey → Munnar")
- Short Description / Full Description
- Hero Image URL
- Best For / Season
- Itinerary *(JSON — `[{day, title, description}]`)*
- Inclusions *(JSON array of strings)*
- Exclusions *(JSON array of strings)*
- Featured toggle — controls homepage hero section
- Published toggle — controls customer site visibility

**View Dialog** — read-only panel with image preview, itinerary and inclusions/exclusions shown as formatted preformatted blocks. Edit shortcut button.

**Delete** — confirmation dialog.

---

### Bookings / Orders Page (`/orders`)

Management of all guest enquiries and confirmed bookings.

**Filter** — dropdown to filter by status: All / Enquiry / Confirmed / Completed / Cancelled.

**Export CSV** — "Export CSV" button next to the filter. Generates a client-side CSV from the currently loaded orders data and triggers a download as `orders.csv`. Columns include all guest, trip, financial, and tracking fields.

**Table columns:** Guest (name + email + phone links), Style / Destinations, Dates, Guests / Budget, Status badge, Amount.

**Status badges:**
- `enquiry` → grey secondary
- `confirmed` → green default
- `completed` → green default
- `cancelled` → red destructive

**Special Requests panel** — appears below the table when any visible order has special requests. Shows each guest's request inline.

**Edit Dialog** — update the following fields only:
- Status
- Travel Date
- Guest Count
- Total Amount (₹)
- Internal Notes

**View Dialog** — read-only full-detail panel with two sections:

*Guest & Trip details:*
- Guest name, email (mailto link), phone (tel link)
- Travel Style, Package name
- Destinations
- Travel Date → Departure Date
- Guest Count, Budget Range
- Special Requests (highlighted block)

*Admin notes:*
- Status badge
- Total Amount
- Internal Notes

*Session & Tracking section* (only shown when data exists):
- Country / Region / City (from IP geolocation)
- IP Address
- Referrer URL
- Landing Page
- UTM Source / Medium / Campaign
- Browser Language / Screen Resolution / Timezone
- User Agent (truncated, monospace block)

**Delete** — confirmation dialog.

---

### Journal Page (`/journal`)

Full CRUD management for editorial content.

**Table columns:** Title, Category, Author, Read Time, Published Date, Status

**Add / Edit Dialog fields:**
- Title *(required)*
- Slug *(required)*
- Category *(required — e.g. Travel, Wellness, Destinations)*
- Read Time (minutes)
- Published Date
- Author Name / Author Role
- Cover Image URL
- Tags — comma-separated keywords (e.g. "backwaters, slow-travel, kerala")
- Excerpt (2-line textarea)
- Content — rich-text toolbar + textarea:
  - **Bold** → wraps selection in `<strong>`
  - **Italic** → wraps selection in `<em>`
  - **H2** → wraps selection in `<h2>`
  - **Blockquote** → wraps selection in `<blockquote>`
  - **Link** → wraps selection in `<a href="…">`
  - **Bullet** → wraps selection in `<ul><li>`
  - Content is stored as raw HTML and rendered on the customer site via `dangerouslySetInnerHTML`
- Published toggle

**View Dialog** — read-only panel with cover image preview. Content shown in a scrollable bordered block. Edit shortcut button.

**Delete** — confirmation dialog.

---

### Contact Inbox Page (`/enquiries`)

Displays all messages submitted via the customer Contact Us page.

**Filter** — dropdown to filter by status: All / New / Read / Replied.

**Table columns:** Name, Email, Phone, Message preview, Status badge, Date received.

**Status badges:**
- `new` → blue/secondary
- `read` → grey
- `replied` → green

**View Dialog** — full message body, sender details, and inline status updater (dropdown to change status). Includes a "Reply via Email" mailto link that pre-populates the subject and sender.

**Delete** — confirmation dialog before permanent removal.

---

### Media Page (`/media`)

Upload and manage image/file assets.

- Upload files via a form (multipart)
- View all uploaded files in a grid with URL, filename, MIME type, size
- Delete individual media records

---

## Customer Website

Served at `/`. A public-facing marketing and booking site.

### Navigation (`Navbar`)

Pill-shaped floating navbar, fixed at the top.

**Desktop links:** Home · Destinations · Journeys · Journal · About · Contact

**CTA:** "Plan a Journey" button (gold, links to `/plan`).

**Mobile:** Hamburger toggle button replaces all links below the `920px` breakpoint. Opens a full-screen overlay with animated slide-in links and the "Plan a Journey" CTA.

---

### Home Page (`/`)

Main landing page for Escora. Includes:
- Full-screen hero section with scroll-reveal animations
- Featured Journeys section — packages with `featured: true`
- Travel Categories grid — links to `/journeys` filtered by category
- Destinations highlights
- Journal/blog teaser cards
- Enquiry / "Plan a Journey" call-to-action section

**SEO:** Sets page title to "Escora", meta description, and a `TravelAgency` JSON-LD structured data block.

**Scroll-reveal animations** — elements with `.reveal-up` class start at `opacity: 0` and animate in when they enter the viewport. A `MutationObserver` ensures dynamically-loaded content (fetched after mount) also triggers correctly.

---

### Destinations Page (`/destinations`)

Lists all published destinations from the API.

- Grid of destination cards with image, name, region, type, season
- Links to individual destination details

---

### Journeys Page (`/journeys`)

Lists all published packages/journeys.

**Category filters** — chip row at the top: All / Honeymoon / Family / Adventure / Wellness / Culture.

**Secondary filters** (dropdowns, sticky below category chips):
- **Duration** — All / Short (1–4 nights) / Medium (5–7 nights) / Long (8+ nights)
- **Price** — All / Under ₹1L / ₹1L–₹2L / ₹2L–₹5L / Above ₹5L
- **Destination** — populated from the API; shown only when destinations are available
- **Clear button** — resets all secondary filters when any are active

Filtering is applied client-side via `useMemo` after the API response is received. Cards showing name, duration, route, price, hero image.

**SEO:** Sets `<title>` to "Journeys | Escora" with a tailored meta description.

---

### Journey Detail Page (`/journeys/:id`)

Full detail view for a single package.

- Hero image banner
- Duration, route, price, season, best for
- Day-by-day itinerary (rendered from JSON)
- Inclusions and exclusions lists
- Accommodation details
- FAQs
- "Plan This Journey" CTA linking to `/plan` with the package pre-selected

---

### Journal Page (`/journal`)

Editorial content listing.

**Category filters** — chip row: All / Travelogue / Culture / Heritage / Cuisine / Wellness / News.

**Tag filters** — pill row below category chips, shown only when posts have tags. Extracted from all post `tags` fields and de-duplicated. Clicking a tag pill filters the post grid client-side. Active tag highlighted in gold. Tag and category filters are independent; switching category clears the active tag.

**Layout:**
- First post shown as a full-width "Featured" card with large image and extended excerpt
- Remaining posts in a 3-column grid
- Scroll-reveal animations on all cards

**SEO:** Sets `<title>` to "Journal | Escora" with a tailored meta description.

---

### Journal Detail Page (`/journal/:id`)

Full article view.

**Layout:**
- Breadcrumb: Journal > Category
- Article header: category badge, date, read time, title, excerpt, author avatar + name/role
- Full-bleed hero image with caption
- Two-column body: left sidebar (sticky share widget) + right article text

**Content rendering:**
- If the `content` field contains HTML tags (authored via the rich-text toolbar), it is rendered with `dangerouslySetInnerHTML`
- Otherwise, content is split on double newlines and rendered as paragraphs; lines starting with `<blockquote>` render as a styled pull-quote

**Social sharing** — available in two locations: sticky sidebar and article footer:
| Button | Target |
|---|---|
| WA | `https://wa.me/?text={title} — {url}` |
| Fb | `https://www.facebook.com/sharer/sharer.php?u={url}` |
| 𝕏 | `https://twitter.com/intent/tweet?url={url}&text={title}` |
| In | `https://www.linkedin.com/sharing/share-offsite/?url={url}` |
| ⌘ (copy) | `navigator.clipboard.writeText(url)` — shows a "✓" confirmation for 2 seconds |

Share URLs use the current `window.location.href` and the post title.

**Author card** — below the article body, shows author avatar, name, role, and a brief bio line.

**Related posts** — 3-card grid of other published posts.

**SEO:** Sets `<title>` to `{post.title} | Escora`, meta description from `excerpt`, OG image from `imageUrl`, and an `Article` JSON-LD structured data block with author and publish date.

---

### About Us Page (`/about`)

Static page describing the Escora brand.

**Sections:**
1. **Hero** — headline and one-paragraph brand description
2. **Philosophy** — 2-column layout with brand values copy and a Kerala backwaters image
3. **Values** — 3-column grid: Depth over breadth · Local first · Transparent pricing
4. **Team** — 2-person cards with photo, name, role, bio
5. **Numbers** — 4-stat highlight row: 12+ years · 800+ journeys · 45 properties · 4.9 rating
6. **CTA** — "Plan a Journey" and "Get in Touch" buttons

**SEO:** Sets `<title>` to "About Us | Escora" with a brand-focused meta description.

---

### Contact Us Page (`/contact`)

Public contact form with office details.

**Left column — contact details:**
- Phone, WhatsApp, Email (all as clickable links)
- Office address (Fort Kochi, Kerala)
- Office hours

**Right column — contact form:**
- Name *(required)*
- Phone
- Email *(required)*
- Message *(required)*

On submit: `POST /api/enquiries`. On success: form replaced by a branded confirmation message. On error: inline error text with fallback email suggestion.

**SEO:** Sets `<title>` to "Contact Us | Escora" with a tailored meta description.

---

### Plan Your Journey Page (`/plan`)

A 5-step wizard that collects a custom itinerary request and submits an enquiry.

#### Step 1 — Travel Style
Select one travel style from five options:
- **Honeymoon** — Intimate escapes for two
- **Family** — Memories across generations
- **Solo** — Your pace, your way
- **Wellness** — Ayurveda, rest and renewal
- **Bespoke Group** — Curated for private groups

Large card layout with icon and description. One selection required to proceed.

#### Step 2 — Destinations
Multi-select pill grid of all published destinations from the API.

Select any combination of destinations. Multiple selections allowed. Optional — can proceed without selecting.

#### Step 3 — Dates & Guests
- **Arrival Date** — date picker
- **Departure Date** — date picker
- **Adults** — counter (min 1)
- **Children** — counter (min 0)
- **Budget Range** — chip selector with five options:
  - Under ₹1 Lakh
  - ₹1L – ₹2L
  - ₹2L – ₹5L
  - ₹5L – ₹10L
  - Above ₹10L

#### Step 4 — Preferences
Free-text textarea for special requests, dietary requirements, accessibility needs, or any other preferences.

#### Step 5 — Contact Details + Summary
- **Name** *(required)*
- **Email** *(required)*
- **Phone** *(required)*
- Itinerary summary card showing all selections from previous steps
- **Send Enquiry** button

On submit, the following is sent to `POST /api/orders`:
- All itinerary fields (style, destinations, dates, guests, budget, preferences)
- Contact details
- Browser tracking metadata (referrer, landing page, UTMs, language, screen, timezone)

On success: a branded success screen with the guest's name. The customer also receives a booking confirmation email.

On error: inline error message.

---

### Privacy Policy Page (`/privacy-policy`)

Static page with the privacy policy content.

---

## Authentication & Sessions

### Flow

1. Admin visits `/admin` — `useAuth` hook calls `GET /api/auth/me`
2. If not authenticated: login form shown
3. Admin submits credentials (`Admin` / `Admin`)
4. Server validates, sets `req.session.authenticated = true`, saves session to MongoDB
5. Cookie (`escora.sid`) set with `HttpOnly`, `SameSite=Lax`, `Secure` (in production), 30-day `maxAge`
6. On every page load, `GET /api/auth/me` restores session state from cookie
7. Logout: `POST /api/auth/logout` destroys session, clears cookie

### Session Storage

- **Development**: MemoryStore or MongoDB
- **Production**: MongoDB via `connect-mongo` — persists across restarts and redeployments

---

## Email Notifications

Emails are sent via the Resend REST API using `fetch()` — no npm package required. All email functions silently skip (log a warning) if `RESEND_API_KEY` is not set, so the application works without email configuration.

All emails are sent from `admin@escoraholidays.com`.

### Triggered Emails

| Trigger | Recipients | Subject |
|---|---|---|
| New order submitted (`POST /api/orders`) | Guest (confirmation) | "Your Journey Enquiry — Escora" |
| New order submitted (`POST /api/orders`) | Admin | "New Journey Enquiry: {guestName}" |
| New contact message (`POST /api/enquiries`) | Sender (confirmation) | "Thank you for reaching out — Escora" |
| New contact message (`POST /api/enquiries`) | Admin | "New Contact Enquiry: {senderName}" |

### Email Content

**Booking confirmation to guest** — includes guest name, travel style, selected destinations, travel dates, guest count, budget range, and a note that the team will respond within one business day.

**Booking notification to admin** — same fields as the guest email plus the guest's phone number, for quick follow-up.

**Contact confirmation to sender** — acknowledges receipt and states the team will reply within one business day.

**Contact notification to admin** — sender name, email, phone, and full message body for immediate review.

---

## SEO & Discoverability

### Per-Page Meta Tags (`useSeo` hook)

A `useSeo` hook (`src/hooks/useSeo.ts`) manages all head tags via `useEffect`:

- `document.title` — `{Page Title} | Escora` (or just "Escora" for the homepage)
- `<meta name="description">` — page-specific description
- Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
- Twitter card tags: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`

**Pages with SEO configured:**

| Page | Title | JSON-LD Type |
|---|---|---|
| Home (`/`) | Escora | `TravelAgency` |
| Journeys (`/journeys`) | Journeys | — |
| Journal (`/journal`) | Journal | — |
| Journal Detail (`/journal/:id`) | *post title* | `Article` |
| About (`/about`) | About Us | — |
| Contact (`/contact`) | Contact Us | — |

### Sitemap (`/sitemap.xml`)

Dynamically generated by the API server. Includes:
- Static pages: `/`, `/journeys`, `/journal`, `/about`, `/contact`, `/plan`
- All published packages: `/journeys/{id}`
- All published destinations: `/destinations/{id}`
- All published journal posts: `/journal/{id}`

### Robots (`/robots.txt`)

```
User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://escora.in/sitemap.xml
```

---

## Enquiry Tracking & Analytics

Every enquiry submitted via the Plan Your Journey wizard captures the following data automatically:

### Server-Side (captured from HTTP headers)

| Field | Source |
|---|---|
| IP Address | `req.ip` (respects `trust proxy: 1` for Railway) |
| User Agent | `req.headers['user-agent']` |

### Geolocation (async, server-side)

IP is looked up against `ip-api.com` within a 3-second timeout. Private/loopback IPs (`::1`, `127.x.x.x`, `192.168.x.x`, `10.x.x.x`) are skipped.

| Field | Source |
|---|---|
| Country | ip-api.com response |
| Region / State | ip-api.com response |
| City | ip-api.com response |

### Browser-Side (sent by the customer's browser)

| Field | Source |
|---|---|
| Referrer URL | `document.referrer` |
| Landing Page | `window.location.href` |
| UTM Source | `?utm_source=` query param |
| UTM Medium | `?utm_medium=` query param |
| UTM Campaign | `?utm_campaign=` query param |
| Browser Language | `navigator.language` |
| Screen Resolution | `window.screen.width × window.screen.height` |
| Timezone | `Intl.DateTimeFormat().resolvedOptions().timeZone` |

All tracking data is visible in the admin Bookings page View dialog under the **Session & Tracking** section. The section is hidden if no tracking data is present.

---

## Data Flows

### New Booking Enquiry (Customer → Admin)

```
Customer fills Plan Your Journey wizard (5 steps)
    ↓
Browser collects tracking metadata on submit
    ↓
POST /api/orders (public endpoint)
    ↓ server-side
Capture req.ip + User-Agent header
    ↓
Async geo lookup via ip-api.com (3s timeout)
    ↓
INSERT into orders table with all fields
    ↓
Fire confirmation email to guest (if RESEND_API_KEY set)
Fire notification email to admin (if RESEND_API_KEY set)
    ↓
Admin dashboard polls every 30s → detects count increase → toast notification
    ↓
Admin opens Bookings page → sees new row
    ↓
Admin clicks View → full detail dialog with tracking
    ↓
Admin clicks Edit → updates status to Confirmed, sets amount, adds notes
```

---

### New Contact Enquiry (Customer → Admin Inbox)

```
Customer fills Contact Us form (/contact)
    ↓
POST /api/enquiries (public endpoint)
    ↓
INSERT into enquiries table (status: "new")
    ↓
Fire confirmation email to sender (if RESEND_API_KEY set)
Fire notification email to admin (if RESEND_API_KEY set)
    ↓
Admin dashboard "Contact Inbox" card shows count of new messages
Admin dashboard polls → count increase → toast notification
    ↓
Admin navigates to /enquiries (Inbox)
    ↓
Admin clicks View → reads full message → updates status to "read" or "replied"
    ↓
Admin clicks "Reply via Email" → opens mailto link to sender
```

---

### Admin Publishing a Journey (Admin → Customer Site)

```
Admin logs in to /admin
    ↓
Navigate to Journeys page
    ↓
Click Add Journey → fill all fields
    ↓
Toggle Published ON
    ↓ POST /api/packages
Inserted into packages table
    ↓
Customer visits /journeys
    ↓
GET /api/packages?published=true
    ↓
New journey appears in grid
    ↓
Sitemap at /sitemap.xml updated automatically on next fetch
```

---

### Featured Journey on Homepage

```
Admin edits a package
    ↓
Toggle Featured ON + Published ON
    ↓ PATCH /api/packages/:id
    ↓
Customer visits homepage /
    ↓
GET /api/packages?featured=true&published=true
    ↓
Package appears in the Featured Journeys section
```

---

### Publishing a Journal Post

```
Admin navigates to Journal page
    ↓
Click New Post → fill Title, Slug, Category, Tags, Author, Image
    ↓
Use rich-text toolbar to format Content (Bold, Italic, H2, Blockquote, Link, Bullet)
    ↓
Set Published Date + toggle Published ON
    ↓ POST /api/journal
    ↓
Customer visits /journal
    ↓
GET /api/journal?published=true
    ↓
Post appears in grid; tag pills appear if tags were set
Customer can filter by tag
    ↓
Customer clicks → /journal/:id → full article
HTML content rendered via dangerouslySetInnerHTML
Social share buttons use live window.location.href
```

---

### Exporting Orders to CSV

```
Admin navigates to Bookings page
    ↓
Optionally filter by status
    ↓
Click "Export CSV"
    ↓
Client-side: serialize visible orders to CSV string (Blob)
    ↓
URL.createObjectURL(blob) → <a download> click
    ↓
Browser downloads orders.csv
```

---

### Session Restore Flow (Admin Refresh)

```
Browser loads /admin
    ↓
GET /api/auth/me (sends escora.sid cookie)
    ↓
Server reads session from MongoDB
    ↓
Returns { authenticated: true, username: "Admin" }
    ↓
Admin portal renders without login prompt
```

---

*Last updated: June 2026*
