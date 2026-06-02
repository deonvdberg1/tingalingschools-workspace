# TOOLS.md - Delivery Engineer's Toolkit

## Frontend
- React (Vite) — dashboard + driver PWA + customer pages
- MapLibre GL JS — map rendering
- OpenFreeMap — free map tiles (no API key)

## Backend
- Node.js (Express, ESM) — API
- sql.js — SQLite in WASM
- Existing WhatsApp server API — for delivery notifications

## Reference
- Fred's workspace: `/Users/deonvandenberg/.openclaw/workspace/fred/`
- Dashboard API: `fred/dashboard-api/server.js`
- WhatsApp server: `fred/whatsapp-server/server.js`

## Principles
- No paid APIs for core features
- No native apps - PWA only
- Multi-tenant from day one
