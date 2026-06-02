# MEMORY.md — Delivery Engineer's Full Build Spec

## Product: AutoEffortless Delivery Tracking

A multi-tenant live GPS delivery tracking system. Clients see their drivers moving on a live map. Customers receive WhatsApp tracking links. Zero third-party costs.

---

## Tech Stack

| Layer | What | Why |
|-------|------|-----|
| Map renderer | **MapLibre GL JS** | Free, open-source, no API key |
| Map tiles | **OpenFreeMap** (`https://tiles.openfreemap.org/styles/liberty`) | Free forever, no API key |
| Frontend | **React 18 + Vite** | Same stack as existing dashboard |
| API server | **Express (ESM)** on port 3001 | Shares server with dashboard API |
| Database | **sql.js** (SQLite in WASM) | Already used by dashboard API |
| GPS source | **navigator.geolocation.watchPosition()** in PWA | No native app needed |
| WhatsApp | **Existing WABA** (port 3000 server) | Send tracking links to customers |
| Hosting | **Mac mini** (existing) | No new infrastructure |

---

## Build Instructions — Complete

### Phase 1: Data Model — Already Done ✅

**File:** `dashboard-api/tracking-db.js`

Tables created and wired into `db.js`:
- `driver_locations` (client_id, driver_id, lat, lng, speed, accuracy, timestamp)
- `deliveries` (client_id, driver_id, customer_name, customer_phone, customer_address, lat, lng, status, payment_amount)

Seed data: 5 stub deliveries auto-generated for all existing clients.

### Phase 2: API Routes — Already Done ✅

**File:** `dashboard-api/tracking-routes.js`

Mounting pattern in `server.js`:
```javascript
import { setupTrackingRoutes } from './tracking-routes.js';
setupTrackingRoutes(app, { query, run, saveDb });
```

Routes:
- `POST /api/tracking/location` — Driver sends GPS {client_id, driver_id, lat, lng, speed, accuracy}
- `GET /api/tracking/location/:client_id/:driver_id` — Latest + recent path (5 min)
- `GET /api/tracking/drivers/:client_id` — All active drivers with latest position
- `GET /api/tracking/deliveries/:client_id` — Today's deliveries for client
- `PUT /api/tracking/deliveries/:id/status` — Update delivery status
- `GET /api/tracking/delivery/:id` — Public: customer tracking page data
- `GET /api/tracking/health` — Health endpoint

### Phase 3: Driver PWA — Already Done ✅

**Directory:** `tracking-driver/`

Files all written:
- `package.json`, `vite.config.js` — React + Vite config
- `index.html` — Entry point with PWA meta tags
- `manifest.json` — PWA manifest (Add to Home Screen)
- `sw.js` — Service worker (offline app shell)
- `src/main.jsx` — React entry
- `src/App.jsx` — Main component with GPS logic + Page Visibility API
- `src/DriverMap.jsx` — MapLibre map with user marker, accuracy circle, delivery pins
- `src/DeliveryList.jsx` — Delivery list below map with status buttons
- `src/main.css` — Styling

**Still needed:** `npm install` in the tracking-driver/ directory.

GPS logic:
- Foreground: send position every 3 seconds via `watchPosition()`
- Background: send every 30 seconds (Page Visibility API)
- On delivery status change: `PUT /api/tracking/deliveries/:id/status`

### Phase 4: Client Dashboard Tracking Page

**Location:** `dashboard/src/pages/Tracking.jsx` (existing React dashboard)

What to build:
1. New route `/tracking` (React Router) — add to sidebar for overlord + client_admin roles
2. Full-page MapLibre map
3. Fetch active drivers from `GET /api/tracking/drivers/:client_id`
4. Show drivers as coloured markers
5. Show delivery stops as numbered pins
6. On marker click: show driver info card (last seen, speed, deliveries completed)
7. Auto-poll every 10 seconds

**Component:** `dashboard/src/components/DeliveryMap.jsx`
- Takes array of drivers + deliveries as props
- Renders MapLibre map with markers
- Fit bounds to show all markers

### Phase 5: Customer Tracking Page

**Location:** Serve via Express static on port 3001 (`/tracking/:delivery_id`)

Simple HTML page (or minimal React app):
- Public, no auth
- Loads delivery data from `GET /api/tracking/delivery/:id`
- Shows: "Your delivery from [Client Name]"
- Live MapLibre map with driver's latest position
- Delivery status: "Pending" / "Driver is en route" / "Delivered at [time]"
- Auto-refresh every 15 seconds
- ETA: simple calculation from driver distance + speed

### Phase 6: WhatsApp Notifications

**File:** `whatsapp-server/server.js`

When a delivery status changes to `en_route`:
```javascript
// In the delivery status update handler
const trackingUrl = `https://tracking.autoeffortless.com/tracking/${deliveryId}`;
const message = `🚚 Your delivery from ${clientName} is on its way!\n\nTrack live: ${trackingUrl}`;
// Send via existing WhatsApp send function
```

For MVP, the domain `tracking.autoeffortless.com` can point to the same Cloudflare tunnel (add DNS record in Cloudflare dashboard → `tracking` CNAME → tunnel).

### Phase 7: Driver PWA Deploy

The driver PWA needs to be served. Options:
1. **Cloudflare Pages** (free tier) — build and deploy the tracking-driver/ Vite app
2. **Express static** — serve from port 3001 alongside the API
3. **Subdomain** — `driver.autoeffortless.com` or `tracking.autoeffortless.com/driver`

For simplest: serve from Express static on port 3001 during MVP.

---

## Key Files For Reference

All in `/Users/deonvandenberg/.openclaw/workspace/fred/`:

| File | What It Is |
|------|-----------|
| `dashboard-api/server.js` | API server (ESM, Express on 3001) — mounts tracking routes |
| `dashboard-api/db.js` | Database init — tracking tables already wired in |
| `dashboard-api/tracking-db.js` | Data model for tracking tables |
| `dashboard-api/tracking-routes.js` | All GPS/delivery API routes |
| `dashboard-api/package.json` | API server dependencies (ESM, Express, sql.js, cors, etc.) |
| `tracking-driver/` | Driver PWA (React + Vite) — needs npm install |
| `whatsapp-server/server.js` | WhatsApp server on port 3000 — add delivery notifications here |
| `dashboard/src/` | Existing dashboard frontend — add Tracking.jsx page |

---

## Multi-Tenant Pattern

Every query filters by `client_id`. The Express request has `req.user.client_id` set by requireAuth middleware. The role check:
- `overlord` (Mr D): sees ALL clients
- `client_admin`: sees only their client_id

Use the existing `requireAuth` + `requireRole` middleware for dashboard routes.

---

## Testing The MVP

1. Open driver PWA on phone → enter any client ID (from DB) and driver ID
2. Walk around — see GPS points appearing in DB
3. Open dashboard → /tracking → see driver moving on map
4. Check customer tracking → /tracking/:id → see delivery status with driver position

---

## Google Places API Key

Created 2026-05-31 by Mr D. Used for address autocomplete in delivery creation.
- **Key:** AIzaSy…u0ks
- **Free credits:** $300 USD
- **Expiry:** 2026-08-29 (90 days from 2026-05-31)
- **Plan after:** Switch to Mapbox Geocoding API (100k free requests/month, no expiry)

---

## Principles

- **No native apps.** PWA works in browser, "Add to Home Screen" only.
- **No paid APIs.** MapLibre + OpenFreeMap = free forever.
- **Multi-tenant.** Every query filters by client_id.
- **Our code only.** Everything built by us.
- **GPS background throttling is expected.** Browser limitation. Log it, document it, move on.
