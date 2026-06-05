# Heartbeat Monitor
# Check these on every session start

## 2026-06-05 — Demo Mode Live + Driver PWA Fix

### Issues Found & Fixed

1. **Dashboard 404 / Customer 502** — Transient error from server restart while seeding demo data. Launchd auto-restarted; everything green now.

2. **Driver PWA blank map** — Built `index.html` had literal `***` as Google Maps API key instead of the actual key. Vite doesn't substitute env vars in raw HTML templates. Fixed by putting the actual key in `index.html` and rebuilding.

### Demo Data Seeded
- **Client:** Trackman Demo (ID: 7)
- **Driver:** delivery-01 (active, last seen seconds ago)
- **Deliveries:** 5 Richards Bay deliveries (1 en_route to Sipho Zulu, 4 pending)
- **GPS:** 19-point path along Arboretum → Veldenvlei

### URLs
- Dashboard: https://app.autoeffortless.com (demo@autoeffortless.com / demo123)
- Driver PWA: https://tracking.autoeffortless.com/driver/
- Customer Tracking: https://tracking.autoeffortless.com/tracking/7
- API Health: https://tracking.autoeffortless.com/api/tracking/health

### Status
- 🟢 API server running on port 3001/3443, all endpoints 200
- 🟢 WhatsApp server running on port 3000
- 🟢 Cloudflare tunnels active (both tingaling + tracking)
- 🟢 Google Maps JS API loading correctly on all 3 surfaces
- 🟢 Routes API returning ETA data
- 🟢 Places (New) API working for geocoding
- 🟢 Demo user login working
- 🟢 Driver PWA rebuilt with correct API key
- 🟡 WhatsApp notifications wired but need a dedicated WABA number (deferred until first client)
