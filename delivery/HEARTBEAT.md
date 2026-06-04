# Heartbeat Monitor
# Check these on every session start

## 2026-06-03 — Google Maps Swap Complete (v2)
- All three surfaces swapped from MapLibre → Google Maps JS API:
  - **Dashboard Live Tracking** (DeliveryMap.tsx) — Google Maps with driver markers, delivery pins, route polylines, office marker, pin placement
  - **Driver PWA** (DriverMap.jsx) — Google Maps with user position, accuracy circle, numbered delivery pins
  - **Customer Tracking Page** (tracking.html) — Google Maps with truck + 📍 markers, ETA display
- **Places (New) API** — AddressSearch.tsx uses `google.maps.importLibrary('places')` with SessionTokens
- **Key:** `AIzaSy…DnP0` — verified working with Maps JS API, Places (New) API, and Geocoding
- **Server-side APIs** updated: google-api.js uses Routes API v2 + Places API (New) instead of legacy endpoints
- **Fixed:** Maps API now uses `callback=` + `importLibrary()` instead of bare `loading=async` to ensure full API readiness
- MapLibre dependency removed from both frontends
- Server running on port 3001 (HTTP) and 3443 (HTTPS/mkcert)
- Cloudflare tunnel active: tracking.autoeffortless.com → localhost:3001

### URLs
- Dashboard: https://app.autoeffortless.com/tracking
- Driver PWA: https://tracking.autoeffortless.com/driver
- Customer Tracking: https://tracking.autoeffortless.com/tracking/{id}
- API Health: https://tracking.autoeffortless.com/api/tracking/health

### Status
- 🟢 All endpoints return 200
- 🟢 API key valid and in all builds
- 🟢 Places (New) API working for geocoding
- 🟢 Maps JS API loading with correct key
- 🟡 Routes API needs to be enabled for server-side directions/ETA
