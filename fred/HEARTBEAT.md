# Heartbeat Monitor
# Fred checks these on every session start

## 2026-08-13 — NG Kerk Meerensee Onboarded (Kliënt #2) ✅

- Agent `ngkerk` geskep + geregistreer (Afrikaans-eerste, KB-alleen)
- KB gebou uit hul webwerf (12 seksies, 3853 chars) — hul site bly onveranderd
- Admin-login (dashboard): info@ngmeerensee.co.za / NGKerk2026!
- ai-assistant.js: per-kliënt agent routing (`openclaw/<agentId>`)
- KB-sync per-kliënt in server.js (whatsapp-server + agent workspace)
- ⏳ WhatsApp: OPGESKORT per Mr D — eers admin + AI Site Editor

## 2026-08-13 — NG Kerk Platform (River Whisperer-styl) — LIVE ✅

- **Port 8091** + LaunchAgent `com.autoeffortless.ngkerk` (auto-start)
- Volledige gespieëlde webwerf bedien lokaal; rw-track + rw-chat ingespuit op elke bladsy
- Admin /login (info@ngmeerensee.co.za / NGKerk2026!) → dashboard + analytics
- **AI Site Editor:** chat → ngkerk-agent → drafts/ (STAGING) → preview → publish → auto-rugsteun
- E2E getoets: footer-kopiereg verander + gepubliseer + rugsteun geskep ✅
- **🌐 Tunnel LIVE (2026-08-13):** `https://ngkerk.autoeffortless.com` → port 8091
  - Tunnel ID: c19a401b-1494-4903-903b-12e1b37dabde (naam: `ngkerk`)
  - Config: `~/.cloudflared/config-ngkerk.yml` · LaunchAgent: `com.autoeffortless.cloudflared-ngkerk`
  - Geverifieer: /login, /dashboard.html, /admin.html, / almal HTTP 200 deur tunnel ✅
  - ⚠️ Les: `cloudflared tunnel route dns` het eers na Main-tunnel (41e8685d) gewys — gefix met `--overwrite-dns <ngkerk-uuid>`
- ⏳ WhatsApp: OPGESKORT per Mr D — eers admin + AI Site Editor
- **NEXT:** URL aan NG Kerk stuur om te toets (Mr D se aksie)

## 2026-08-05 08:55 SAST — tingalingschools.com Crash Fixed ✅

⚠️ Incident: Site showed "useAuth must be used within an AuthProvider" (React crash, site blank)

**Root cause:** Commit d3f3824 (Aug 4) removed `<AuthProvider>` from `website/src/App.jsx` when portal pages were dropped, but left `<NavigationTracker />` (calls `useAuth()`) in the tree → every page load crashed.

**Fix:** Restored `<AuthProvider>` wrapper in App.jsx → rebuilt → deployed to gh-pages branch of `tingalingschools-workspace` repo → pushed main (3d85db1) + gh-pages (93fbd58).

**Verified:** Headless Chrome render — 0 errors, all pages render (Home, Apply, Pre-Primary, Special Needs).

**Monitoring added:** `fred/scripts/site-monitor.sh` — every 10 min via crontab. Checks HTTP 200 + bundle ref + REAL headless-Chrome render (no crash markers, content present). WhatsApp alerts to Mr D on state change only (no spam). This would have caught today's bug within 10 min.

**School website ops notes:**
- Source: `workspace/website/` (Vite + shadcn React app, package name `tingalingschools`)
- Build: `npm run build` (outputs dist/ + 404.html for SPA fallback)
- Deploy: copy dist → gh-pages branch of `tingalingschools-workspace` repo (GitHub Pages)
- ⚠️ Lesson: NEVER `rsync --delete dist/` into a git worktree root — it deleted `.git` pointer + `CNAME`. Recreate `.git` (gitdir pointer) + CNAME from `git show gh-pages:CNAME`.

## 2026-06-02 10:30 SAST — Phase 1 Analytics Complete ✅
✅ Hourly trends dashboard (busiest hours) — live at /analytics/messages
✅ Response time trends (avg, fastest, slowest, daily) — live at /analytics/compare
✅ CSV export button on Analytics Overview (one-click download)
✅ Per-product stats table on Analytics Overview
✅ Sidebar labels updated (Busiest Hours / Response Times)
✅ All endpoints pushed to GitHub

## 2026-06-02 09:40 SAST — Full Restart After Shutdown — All Clear ✅
✅ Clean restart from power-off
✅ WhatsApp server (PID 1211, port 3000) — responding 200
✅ Dashboard API (PID 1218, port 3001) — DB connected
✅ Dashboard SPA (PID 1215, port 5173) — running
✅ Cloudflare tingaling tunnel — 2 connections via JNB03 (QUIC)
✅ Cloudflare tracking tunnel — running, 111 connections
✅ Tunnel URL: whatsapp.autoeffortless.com — HTTP 200
✅ All 8 LaunchAgents loaded (server, api, dashboard, tunnels, caffeinate, healthcheck, watchman, tracking)
✅ Crontab intact: watchman (5min), healthcheck (15min), backup (hourly)
✅ All cron jobs running
✅ Disk: 60Gi free / 228Gi (23% used)
✅ GitHub: all pre-shutdown changes pushed

## 2026-05-29 11:41 SAST — Email Live + Monitoring Complete
✅ Message cap raised 50→500
✅ SQLite sync live — messages persist in dashboard DB
✅ Inbound Watchman running every hour (alerts if silent >10 min)
✅ Health check every 15 min
✅ Hourly backup via crontab
✅ Better Stack monitors active (3-min checks on tunnel + status)
✅ AutoEffortless email live (info@autoeffortless.com — gog configured)
✅ Log flushing fix (fs.writeSync, no more silent buffering)
🟡 VPS uptime solution deferred — revisit after paying clients

## 2026-05-28 10:47 SAST — Multi-Client Refactor Complete
✅ WhatsApp server running (PID 33959, port 3000)
✅ Dashboard API running (port 3001)
✅ Named Cloudflare Tunnel tingaling running — 2 edge connections
✅ Permanent URL: https://whatsapp.autoeffortless.com
✅ Meta webhook pointing to permanent URL
✅ LaunchAgent auto-start: com.tingaling.cloudflared-named
✅ Disk space OK (21% used)

## What Changed
- **Multi-client architecture** — Phone number→client resolution via dashboard API
- **Per-client AI** — Dynamic system prompts, KB, and contact info per business
- **ai_enabled toggle** — per-client in DB, API supports CRUD
- **Client health page** — New dashboard page at /health
- **Real-time SSE** — Dashboard Home auto-updates every 5s
- **Unit tests** — 26 tests, all passing
- **Structured logging** — Timestamped, levelised logs throughout
