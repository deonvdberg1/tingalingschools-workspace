# Current Task — 2026-08-30 11:50 SAST

## Status: ATTENDANCE APP SHIPPED ✅ + DocChat v4.2 live

## 🕔 Attendance & Time Tracking — LIVE (2026-08-30, built same-day)
- **Portal app:** `/app/attendance` (app.autoeffortless.com) — bundle index-Bp_WisSU.js
- **Backend:** `dashboard-api/attendance-routes.js` (mounted in server.js)
- **Tables:** attendance_staff, attendance_records (auto-created)
- **Entitlement:** active 'attendance' purchase OR overlord OR client product 'attendance' (Ting-A-Ling pilot seeded: client_products id 5)
- **Features:** staff CRUD + unique 6-char code, printable QR per staff (qrcode npm, PNG data URL), Clock Station (camera BarcodeDetector scan + manual code + tap grid), live "on shift now", timesheets (date range), per-staff summary (days/hours/avg), corrections (edit times), CSV export
- **Store:** product added (16th app, Tier 2 Business, R149/mo, single R99) — autoeffortless.com/apps/attendance live
- **Paystack plan:** PLN_i3b1v777n5f032q (seeded via seed-paystack.js)
- **My Apps:** APP_CATALOG + Open app → /app/attendance; Sidebar: Attendance item for overlord + clients with 'attendance' product
- **E2E verified** (puppeteer, real login): add staff → clock in tap → clock out tap → timesheet record; 0 console errors. Test data cleaned.
- **Commits:** workspace 377c9a3 (backend+storefront+db), website repo 8c776b2 (storefront dist → /apps)

## DocChat v4.2 — live (bundle index-rzgHpwfZ.js) — all features shipped & verified

## Infrastructure (all LaunchAgents auto-start on boot)
- API: com.autoeffortless.api → port 3001 (dashboard-api/)
- Portal: dashboard-temp/dist served by whatsapp-server (port 3000) via main tunnel
- Unified site: com.autoeffortless.website (site-server, 8092) — autoeffortless.com + store.autoeffortless.com + /apps
- Files: com.autoeffortless.fileserver (8099) + cloudflared-files tunnel
- Main tunnel: com.autoeffortless.cloudflared-main (remote config — don't edit config.yml)
- OCR deps: poppler + tesseract (/opt/homebrew/bin) — reinstall if Mac reset
- dashboard-api/.env: Paystack sk_test key; qrcode npm added

## On restart, check
1. `curl localhost:3001/api/health` → 200
2. `curl https://app.autoeffortless.com` → new bundle (index-Bp_WisSU.js)
3. Ollama running (port 11434) for DocChat embeddings
4. Tunnels up (whatsapp, files)

## Next up (when Mr D says go)
- ⏳ **WiFi login for Ting-A-Ling** — BLOCKED on hardware decision: rain Loop can't do captive portal/auth. Options: (a) add business AP (Unifi ~R2-3.5k) behind Loop for real login + DNS activity logs + staff AUP (RICA/POPIA consent required), or (b) degraded password-app. Mr D deciding.
- ⏳ **Activity monitoring module** (Android-only usage tracking) — Capacitor wrapper, premium add-on tier. iOS impossible (Apple).
- ⏳ DocChat: chat history library, markdown answers, export, folders/tags
- ⏳ Mr D: test Attendance UI in browser (buyer flow: buy → /my-apps → Open app)
