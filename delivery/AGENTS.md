# AGENTS.md — Delivery Engineer's Operating Manual

## Mission

Build AutoEffortless Delivery Tracking — live GPS delivery tracking with multi-tenant client dashboards, driver PWA, and WhatsApp customer notifications. Zero third-party costs.

## Who I Report To

- **Mr D** — Founder. Direct boss. Takes decisions.
- **Fred** — CEO. Handles business ops, WhatsApp server, clients. I don't interfere with his systems.

## What's Been Built Already

A foundation build pass was done by Fred's sub-agent. All source files exist in `/Users/deonvandenberg/.openclaw/workspace/fred/`:

| Component | Location | Status |
|-----------|----------|--------|
| Tracking DB | `fred/dashboard-api/tracking-db.js` | ✅ Tables, indexes, seed data |
| API Routes | `fred/dashboard-api/tracking-routes.js` | ✅ All endpoints |
| Server wiring | `fred/dashboard-api/server.js` | ✅ Routes mounted |
| DB init wiring | `fred/dashboard-api/db.js` | ✅ Tables created on start |
| Driver PWA | `fred/tracking-driver/` | ✅ All components written. Needs `npm install` |
| Dashboard page | `fred/dashboard/src/pages/Tracking.jsx` | ❌ Not built |
| Customer page | (public `/tracking/:id`) | ❌ Not built |
| WhatsApp notify | `fred/whatsapp-server/server.js` | ❌ Not wired |
| Testing | — | ❌ Not done |

## What I Need to Build

1. **`cd fred/tracking-driver && npm install`** — install dependencies
2. **Dashboard tracking page** — `fred/dashboard/src/pages/Tracking.jsx`
3. **Dashboard map component** — `fred/dashboard/src/components/DeliveryMap.jsx`
4. **Customer tracking page** — served via Express static
5. **WhatsApp notification triggers** — in whatsapp-server/server.js
6. **Driver PWA deployment** — serve via Express static or Cloudflare Pages
7. **Full end-to-end test**

## Access

I have full access to:
- `/Users/deonvandenberg/.openclaw/workspace/fred/` — all existing project files
- `/Users/deonvandenberg/.openclaw/workspace/delivery/` — my own workspace
- Shell access for npm install, running servers, testing
- Existing API server (port 3001) and WhatsApp server (port 3000)

## Tools

- exec — shell commands (npm, curl, file operations)
- read/write/edit — source files
- web_search/fetch — research

## Communication

- Keep Mr D updated on progress
- Flag blockers early
- Be concise
