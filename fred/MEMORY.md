# Fred's Memory

This is where I keep what matters.

## Foundations

- **Created:** 2026-05-13 by my founder, Mr D
- **Purpose:** To build and run an independent, AI-driven business
- **Status:** WhatsApp bot live for Ting-A-Ling demo — full two-way messaging operational
- **Founder:** Mr D (Richards Bay, SA)

## Key Decisions

- **CLIENT PORTAL = ADMIN PORTAL FOR CLIENTS (LOCKED 2026-08-30, Mr D):** For clients, the client portal and the administrator portal are the SAME thing — one portal, full admin capability. No restricted "client" mode that hides admin features. The client admin can do everything (manage staff, share ANY of their apps with staff, configure apps, etc.). Overlord portal is separate (AutoEffortless-wide admin).

- **STAFF ACCESS MODEL (LOCKED 2026-08-30, Mr D):** Staff accounts see ONLY the apps the admin/employer has enabled for them — never the full store catalogue. Each enabled app opens the STAFF version (e.g. attendance → `/staff-clock` clock page), NEVER the admin view. This applies to ALL apps that have an admin/staff separation, now and future.
  - Admin controls it in Attendance → **Staff Access** tab (toggle per staff-capable app; `staff_apps` table, keyed by owner email + client_id).
  - Staff `Apps` page (`/my-apps`) shows only enabled apps with "Open app" → staff path. Empty state: "No apps enabled yet".
  - Registry: `STAFF_APPS` in attendance-routes.js — new apps with a staff side get added there when built.
  - Attendance auto-enables for staff when the first staff account is created.

- **STAFF ACCESS — FINAL LOCKED MODEL (2026-08-30 22:30, Mr D — "lock into our workflow"):** Staff can ONLY see and access the apps the client admin shares. Enforced server-side: `GET /api/staff-directory/my-apps` returns ONLY granted apps (staffPath null = "Coming soon" card, never openable; unselected apps have no code path — cannot appear anywhere). Staff home routes to the clock only when Attendance is granted, else the Apps page (empty state). Directory membership ⇄ portal account role/client_id syncs on add, role change, and delete (restore on remove; overlord never touched) — no leftover buyer/client access. Client portal = admin portal for clients (one portal, full admin capability). Staff Directory (`/staff`) is the single source: add staff, set role (staff/admin), pick per-person apps; every app references it (already linked).

- **Business name:** AutoEffortless
- **Domain:** autoeffortless.com (Ionos)
- **Tagline:** Effortless Business Communication
- **Offering:** Managed AI assistant for WhatsApp + Instagram
- **Pricing:** R3k–R8k/month + R5k–R12k setup (3 tiers)
- **Digital products:** 3 ready (R99–R199)
- **Revenue target:** R200k/month by Month 6
- **Strategy:** Service-led, product-backed, SaaS-emergent
- **Mr D:** Sales & client intros. **Fred:** All delivery, tech, products.
- **Demo client:** Ting-A-Ling Schools (D&S Comp, CIPC-registered)

## Communication Rules
- **Always provide clickable links — never text to copy-paste.**

## 🎨 Brand & Design Consistency (LOCKED 2026-08-27, Mr D)
- **RULE: everything AutoEffortless must look like autoeffortless.com — one brand everywhere.** No exceptions.
- **Palette:** gold `#c8a34e` / gold-deep `#a8863a` / cream `#faf8f3` / ink `#14142a`. Buttons = gold gradient + white text. Font = Outfit.
- **Source of truth:** `branding/BRAND.md` — read it before building ANY surface (portal, apps, PWAs, emails, PDFs).
- Portal `brand-*` scale = gold palette (was teal — re-themed 2026-08-27). Never introduce teal/cyan/blue into AutoEffortless surfaces.
- **Logo & icons (2026-08-27):** official logo = `branding/logo-current.png`; official icon mark = `website/logo-icon.svg`/`favicon.svg` (dark badge + gold orbit + gold AE) — portal `LogoMark.tsx`. NEVER old-school/outdated icons or text-only "AE" badges; every surface uses the autoeffortless.com mark/icon style.
- Applies to: storefront, portal, DocChat + all 15 apps, super-app, welcome emails, PDFs, future builds.

## 🚀 Fred Remote Access — LIVE 2026-08-31

- **URL:** https://fred.autoeffortless.com — OpenClaw Control UI (full chat with Fred) from any device. Dedicated tunnel `fred` (98008a80), LaunchAgent `com.autoeffortless.cloudflared-fred`, healthcheck #8.
- **Menu bar:** "Fred" in marketing site top nav + portal sidebar (overlord-only).
- **Memory continuity:** remote = same gateway on this Mac = same agent/workspace files. One brain — nothing stored on remote devices, nothing can drift.
- **First open on a new browser:** use tokenized link (memory/2026-08-31.md) once → token saved per browser; pairing approval may be needed (`openclaw devices approve`).
- **⚠️ Gateway auth = token mode (2026-08-31):** internal callers (docchat, whatsapp ai-assistant, site-ai) send `Authorization: Bearer` via `OPENCLAW_GATEWAY_TOKEN` in their .env files.

## WhatsApp API — LIVE ✅

- **Number:** +27 68 754 8390 (Phone ID: 1046384845235600)
- **Old number:** +27 78 836 3027 (deregistered)
- **WABA:** D&S Comp (ID: 1124652154068427 / real: 996583169477166)
- **App:** Ting-A-Ling Connect (ID: 1771774490471649)
- **Server:** Mac mini M4, port 3000 ✅
- **Tunnel:** Cloudflare **named tunnel** (tingaling) — permanent URL ✅
- **Tunnel URL:** `https://whatsapp.autoeffortless.com` (no more ephemeral trycloudflare)
- **DNS:** Ionos→Cloudflare delegation propagated ✅ (May 28, ~7 days)
- **DNS routes:** `whatsapp.autoeffortless.com` + `tingaling.autoeffortless.com` → tunnel
- **LaunchAgent:** `com.tingaling.cloudflared-named` (auto-starts on boot)
- **Old trycloudflare:** Fully removed (plists deleted, scripts disabled)
- **Auto-reply:** TingAI dedicated agent — natural tone, no AI self-ID ✅
- **Conversation persistence:** Per-phone history, saved to disk ✅
- **PDF statements:** Built and tested ✅
- **Display name:** "Tingaling" — ✅ APPROVED (2026-05-21)
- **Quality:** GREEN | Limit: LIMITED (250/day)

## Infrastructure

- WhatsApp server LaunchAgent: ✅ (auto-starts)
- **File server (products):** port 8099 — LaunchAgent `com.autoeffortless.fileserver` (python3 http.server, serves `fred/products/`, bind 127.0.0.1)
- **Files tunnel:** dedicated `files` tunnel (6ba48693-8bfc-4151-a8b7-c16dbf803fe4) — config-files.yml → files.autoeffortless.com + portfolio.autoeffortless.com → :8099. LaunchAgent `com.autoeffortless.cloudflared-files`
- ⚠️ **LESSON (2026-08-27):** Main tunnel (41e8685d) loads a **REMOTE Cloudflare dashboard config** (log: "Updated to new configuration ... warp-routing ... version=8") — local config.yml/ingress edits are IGNORED by that instance. Only `whatsapp/tingaling/app` routes work on it. For new hostnames: create a **dedicated tunnel** (ngkerk/files pattern), don't edit config.yml. Also: Cloudflare caches 404s for PDFs up to 4h (max-age=14400) — a fresh hostname is faster than fighting a cached 404 without an API token to purge.
- Tunnel auto-start: ✅ Named LaunchAgent (com.tingaling.cloudflared-named)
- Auto-restart after power loss: ✅ Enabled
- Log rotation: ✅ Set
- Dedup webhook: ✅ Added
- Backups: ✅ Hourly + git push to GitHub private repo
- Health check monitoring: ✅ Created (runs every 2h, silent unless critical)
- UPS: ❌ Not purchased (R1,293 recommended)

## 🚀 AutoEffortless Dashboard (Port 5173)

- **Frontend:** Vite React app at localhost:5173
- **API:** Express server at localhost:3001 (ES modules)
- **DB:** SQLite at `dashboard-api/data/autoeffortless.db`
- **Admin login:** info@autoeffortless.com / admin123
- **Client login example:** info@tingalingschools.com / Tingaling2026!

### Auth & Onboarding
- AuthContext with token persistence in localStorage
- 5-step onboarding wizard for new clients (WhatsApp → Name → Auto-Reply → Opt-In → Website)
- OnboardingGuard redirects incomplete users to wizard
- ProtectedRoute redirects unauthenticated users to /signin

### Roles
- **overlord:** Mr D — sees all clients, analytics, broadcast, full admin
- **client_admin:** Clients — sees only Overview, WhatsApp, Knowledge Base, Settings, Profile
- Sidebar filters nav items by role

### Knowledge Base Editor
- Route: `/knowledge`
- Split-pane: markdown editor + live HTML preview
- Paste from Excel: Ctrl+V converts clipbaord tables to markdown (HTML + TSV fallback)
- Empty cells preserved in preview rendering
- API: `GET/PUT /api/clients/:id/knowledge` — per-client KB in DB + file sync
- File (`tingaling-knowledge-base.md`) gets written on save for live AI updates

## 🧠 AI Assistant (v4)

- **Engine:** DeepSeek V4 Flash via OpenClaw Gateway (port 18789)
- **Temperature:** 0.1 (strict)
- **Knowledge file:** `whatsapp-server/tingaling-knowledge-base.md`
- **System prompt:** Strict KB-only mode, no hallucination rules, phone numbers in fallback
- **Load on every message:** KB file reloaded before each response (no stale cache)
- **File watcher:** Auto-reloads on file changes
- **Fallback:** Directs to info@tingalingschools.com, 0615274429 / 0724561282

### Current KB Content (5909 chars, 12 sections)
- School Overview, Pre-Primary, Special Needs, Hours, Contact, Enrolment
- Fees (with actual amounts: R1.9k–R3.3k per month + R1,300 reg fee)
- Absentee Reporting, Uniform (R150 shirt, R450 tracksuit), Events, Facilities, FAQ
- GENERAL INSTRUCTION: ask which school when info differs

## 📦 Click-and-Buy Product Portfolio (LOCKED 2026-08-26)

**Strategy:** Pure web apps only — click-and-buy, zero setup from us. Customer self-serves (buy → Stripe → auto-account → login → wizard).
- **NO WhatsApp/Meta** — too complex & verification-heavy (Mr D decision, all WhatsApp apps removed)
- **NO documents/guides** — only real usable tools (Mr D decision)
- **PDF:** `products/AutoEffortless-Product-Portfolio-2026-08-26.pdf` (2 pages) + HTML source `products/portfolio-2026-08-26.html`

**15 apps locked (3 tiers):** *(+ attendance 2026-08-30 → 16)*
- **Tier 1 AI:** DocChat (R99–199/mo) · Contract & Quote Generator · AI Content Studio (R199) · AI Website Builder (R299/mo) · AI Form Builder (R149)
- **Tier 2 Business:** Invoice & Quote App (R199) · Simple CRM (R199) · Stock & Inventory (R149) · Small Team HR (R149) · Booking & Calendar (R149)
- **Tier 3 Vertical:** School Admin (R299–499) · Church/Org Manager (R299) · Property Manager (R299) · Salon/Clinic Booking (R199) · Sports Club Manager (R149)

## 🕔 Attendance & Time Tracking — APP #16, LIVE ✅ (2026-08-30)

- **2nd real built app (after DocChat).** Portal route `/app/attendance`; store product autoeffortless.com/apps/attendance (R149/mo, single R99); Paystack plan PLN_i3b1v777n5f032q
- **Backend:** `dashboard-api/attendance-routes.js` — tables `attendance_staff` (unique 6-char code per staff) + `attendance_records`. Entitlement = active purchase OR overlord OR client product 'attendance' (Ting-A-Ling pilot seeded — client_products id 5)
- **Features:** printable QR per staff (qrcode npm), Clock Station (camera BarcodeDetector scan + code entry + tap grid), live on-shift view, timesheets with corrections, per-staff hours summary, CSV export
- **E2E verified** (puppeteer real login): add staff → clock in → clock out → timesheet; 0 console errors. Bundle index-Bp_WisSU.js
- **Activity-monitoring add-on (future):** per-app usage tracking = Android-only via Capacitor wrapper (iOS blocked by Apple); needs staff AUP for RICA/POPIA compliance. Network-level DNS logging needs business AP behind Ting-A-Ling's rain Loop (Loop can't do captive portal) — hardware decision pending with Mr D

**Buy flow:** Stripe checkout → account auto-created → email login → self-serve setup wizard. Subscriptions auto-renew.
**Mobile strategy (2026-08-27):** All 15 apps are browser-based SaaS — NO App Store/Google Play required. Delivered as PWAs (install-to-home-screen, full-screen, offline cache) for the native feel on iOS/Android. App Store publishing (Capacitor wrap) deferred until a flagship app has paying customers justifying the $99/yr Apple fee + review overhead.
**Super-app plan (2026-08-27, Mr D):** When traction justifies it, build ONE AutoEffortless app (Capacitor wrap of the web apps) hosting ALL services — single login, single billing, in-app hub/switcher, cross-app data (e.g., CRM→Invoicing). To make this cheap later: build **shared auth (one account across all apps)** + **shared design system** from Phase 1 now. Timeline: individual PWAs now → super-app when paying customers exist.
**Roadmap:** Phase 1 = storefront engine + DocChat + Contract Generator + Invoice App (all existing code) → Phase 2 business apps → Phase 3 vertical apps. Bundle into R199/R499/R999 tiers, each app also standalone.

## 👥 Clients

### NG Kerk Meerensee (ID: 8) — CLIENT #2 (2026-08-13)
- **Login (dashboard):** info@ngmeerensee.co.za / NGKerk2026! — role: client_admin
- **Type:** church (Afrikaans-first) — webwerf bly WordPress (ONVERANDERD — hulle redigeer self)
- **Agent:** `ngkerk` — geregistreer in openclaw.json (workspace `/Users/deonvandenberg/.openclaw/workspace/ngkerk`)
- **Agent id in DB:** clients.agent_id='ngkerk', ai_enabled=1
- **KB:** `ngkerk-knowledge-base.md` (3853 chars, 12 seksies uit hul webwerf onttrek) — in ngkerk/ workspace + whatsapp-server/
- **KB-sinkronisasie:** PUT /api/clients/:id/knowledge skryf nou per-kliënt (server.js) — tingai bly terugwaarts versoenbaar (tingaling-knowledge-base.md)
- **AI-routing:** ai-assistant.js roep nou `openclaw/<agentId>` (was hardcoded openclaw/tingai)
- **WhatsApp-nommer:** ⏳ OPGESKORT — Mr D sê moenie WhatsApp opstel nie (eers admin + AI Site Editor)
- **Onboarding:** complete (slaan wizard oor — ons doen die opstelling)
- **Sitedata:** volledige spieël van ngmeerensee.co.za by `fred/ngkerk/` (nie in git nie)
- **🚀 NG Kerk Platform (River Whisperer-styl), LOKAAL LIVE:** port **8091**, LaunchAgent `com.autoeffortless.ngkerk`
  - **🌐 Tunnel (2026-08-13):** `https://ngkerk.autoeffortless.com` → 8091 — tunnel `ngkerk` (c19a401b), config-ngkerk.yml, LaunchAgent `com.autoeffortless.cloudflared-ngkerk`
  - ⚠️ Route DNS les: eerste `route dns` het na Main-tunnel gewys; fix = `cloudflared tunnel route dns --overwrite-dns <ngkerk-uuid> ngkerk.autoeffortless.com`
  - Bedien die volledige gespieëlde webwerf lokaal (index.html, eredienste/, kontak/, ens.) met `rw-track.js` + `rw-chat.js` ingespuit op elke bladsy (middleware)
  - **Admin-login:** /login — info@ngmeerensee.co.za / NGKerk2026! (users.json in private/, bcrypt)
  - **AI Site Editor:** chat → `ngkerk` agent werk in drafts/ (STAGING) → preview → publish (auto-rugsteun, backups/manifest)
  - E2E getoets: agent het footer-kopiereg 2026→2026-2027 verander, gepubliseer, rugsteun geskep ✅
  - Geen WhatsApp/tunnel nie — net lokaal vir nou

### Ting-A-Ling Schools (ID: 6)
- **Login:** info@tingalingschools.com / Tingaling2026!
- **Role:** client_admin
- **WhatsApp number:** +27 68 754 8390
- **Contact phone:** +27615274429
- **Status:** active, health: healthy
- **Onboarding:** reset to not_started (will see wizard on login)

## 📊 Real vs Monitor Traffic — REVEALED 2026-08-13

Mr D asked why views weren't converting. Root cause found: **~96% of "customer" views were our own site monitor.**

- **HeadlessChrome hits: 1,168 of 1,220 "external" views** — `site-monitor.sh` runs headless Chrome every 10 min (144/day) and the beacon's `navigator.webdriver` check did NOT trigger under `--headless=new --dump-dom`, so every check counted as a customer visit.
- **Real external traffic: ~46 page views / ~7 unique IPs over 30 days. 0 real parent applications** (the 2 "submits" were a curl test + Mr D's own tests from his IP 197.185.161.11).
- **Fixes deployed:**
  - Beacon (`website/index.html`): skips UA matching `HeadlessChrome|TingalingSiteMonitor` (reliable; webdriver flag isn't).
  - `site-monitor.sh`: now sends `--user-agent="TingalingSiteMonitor/1.0"` so it's always identifiable.
  - DB backfill: `internal=1` for all HeadlessChrome + `::1` (localhost) hits (1,196 rows).
  - API fix: pages endpoint `GROUP BY path, is_event` + select `event_label` (events were invisible — merged into page rows).
- **⚠️ Lesson: dashboard-api uses sql.js (in-memory). Hand-editing the .db with sqlite3 while the API runs = the running process clobbers your edits on next saveDb().** Always: edit file → restart API immediately (kickstart) → verify. WAL: sqlite3 CLI writes go to -wal; sql.js reads only the main file — run `PRAGMA wal_checkpoint(TRUNCATE)` if needed.
- **Action for Mr D:** click "Mark this browser as me" on the portal Analytics page on his Mac AND phone, so his own visits don't pollute customer stats.
- **Real conversion problem:** not "views not converting" — there are almost no real views. Needs the parent opt-in campaign / actual traffic driving.
- Deploy: gh-pages f2fa7e2 (beacon), main a30aefd (beacon+monitor), main bc9617d (pages endpoint).

## 🚣 River Whisperer Traffic Audit (2026-08-13)

Same audit as Ting-A-Ling — **completely different story: River Whisperer has real traffic.**

- **124 hits in 7 days (Aug 6–12)**: only 19 internal (15%) — all HeadlessChrome from localhost on launch day (one-off render testing, NOT a recurring monitor; no cron exists for it). Backfilled to `internal=1`.
- **105 real external hits**, of which ~30 are Mr D's own browsing (IP 197.185.161.11, not marked internal).
- **3 real WhatsApp booking clicks** from 3 different SA visitors: 156.155.16.98 (Sunset Passage), 156.155.18.152 (Capture the Moment add-on — arrived via Google), 197.245.61.181 (River Whisperer cruise). **This site converts.**
- **Referrers**: 14 Google organic (≈6 unique IPs incl. DE/UK), 9 Facebook + 6 fbclid link taps (shared on Facebook!), rest direct.
- **Bots**: ~15–20 (OVH/online.net scanners 62.210.x, 151.115.x, 2001:bc8:...; Facebook crawler 2a03:2880 = link unfurls, harmless).
- **Fixes**: rw-track.js skips HeadlessChrome UA, analytics.html has "Mark this browser as me" (sets rw_internal=1), server restarted to load backfill. Committed master bf98a77.
- **Note**: `private/` (hits.jsonl, users.json) is gitignored — backfill is local-only. River Whisperer server = port 8080, LaunchAgent com.autoeffortless.riverwhisperer, tunnel com.autoeffortless.cloudflared-riverwhisperer → theriverwhisperer.co.za.

## 🧭 Internal vs Customer Traffic (2026-08-05)

Analytics now separates owner/staff visits from customer traffic.
- **Beacon (index.html):** sends `internal:1` when localStorage `ae_internal=1` OR the visitor is logged into the portal as admin/staff (JWT role decode). Parents = customers.
- **Backend:** `site_hits.internal` column (migration in db.js) + `internalSql()` filter in site-analytics.js — default EXCLUDES internal; `?internal=1` includes all. Overview returns `split:{internal,external}` + `filtering`.
- **UI (PortalAnalytics):** "Customer vs Your visits" panel (split bar + %), toggle "Customers only / Showing all visits", and "Mark this browser as me" button (sets `ae_internal` in localStorage — do this on every device Mr D uses).
- **Deploy:** gh-pages 61a6860, main 5e45cec.

## 🧭 Section Analytics (2026-08-05)

Site traffic is now attributed to school sections so Mr D can see where parents reach the school.
- **Sections:** `main` (home/general), `pre-primary`, `special-needs`, `apply` (general apply). Beacon computes `section` from pathname + query (so `/apply?school=PrePrimary` → pre-primary); AETrack events carry program labels (`apply-submit:PrePrimary`).
- **Backend:** `site_hits.section` column (migration + idempotent path backfill in db.js); new `GET /api/site-analytics/sections` endpoint → views / apply_views / apply_submits / conversion per section.
- **UI (PortalAnalytics):** "Traffic by School Section" table (Pre-Primary School, Special Needs School, Main Site/Home, Applications) with conversion bars. Page now uses shared **PortalShell** component (`website/src/components/PortalShell.jsx`) so the sidebar stays visible on the analytics page (fixes disappearing menu).
- **Deploy:** gh-pages 8f1e2e6, main 9f29b0f.

## 📊 Portal Analytics Page (2026-08-05)

Admin portal now has a full site-traffic analytics page at https://tingalingschools.com/portal/analytics (sidebar "Analytics", admin only).

- **Backend:** existing `dashboard-api/site-analytics.js` (self-hosted beacon → `site_hits` table). Endpoints: overview, pages, referrers, locations, devices, logins, export (CSV), health. All client-scoped via `resolve` middleware.
- **Frontend:** `website/src/pages/PortalAnalytics.jsx` (recharts) — KPIs (views, events, pages, apply funnel + conversion), daily trend area chart, hourly bar chart, top pages, events, referrers, browsers pie, OS bars, screen sizes + locations, portal sign-in log, tracking health, CSV export, 7/30/90/all range picker.
- **Data notes:** beacon sends clientId/path/title/referrer/ua/screen; server adds IP + country (CF-IPCountry). Privacy-friendly: no cookies, aggregate only. site_hits uses `datetime('now','localtime')`; login_log uses UTC.
- **Deploy:** gh-pages 045585c, main 91e8e3b.

## 🚪 Ting-A-Ling Independent Portal (2026-08-05)

Ting-A-Ling now has its OWN portal on tingalingschools.com — no redirect to AutoEffortless.

- **URLs:** https://tingalingschools.com/login · /register (parents) · /portal (dashboard)
- **Login button on site:** "Staff & Parent Login" → internal /login (was app.autoeffortless.com)
- **Roles:** client_admin (admin), staff, parent — same dashboard, role-based panels
- **Admin panel:** stats cards, publish announcements (audience: all/staff/parents), events, approve/reject staff leave, create staff logins, view parent registrations
- **Staff panel:** announcements, events, submit + track leave requests
- **Parent panel:** announcements, events, report absence (prefilled WhatsApp to 061 527 4429), self-register at /register
- **Accounts:**
  - Admin: info@tingalingschools.com / Tingaling2026!
  - Staff: staff@tingalingschools.com / Staff2026!
  - Parent: parent@tingalingschools.com / Parent2026!
- **Backend:** dashboard-api (port 3001) — new `portal-routes.js` + tables (portal_announcements, portal_events, leave_requests, portal_registrations). API base in SPA: `https://app.autoeffortless.com/api` (internal infra, invisible to users).
- **Frontend:** `website/src/pages/Portal{Login,Register,Dashboard}.jsx`, `lib/api.js`, AuthContext rewritten off Supabase → our JWT API (bundle shrank 600→422 kB).
- **Deploy:** gh-pages 9060eac, main d77a2e6.


## 🌐 tingalingschools.com (School Website) — FIXED 2026-08-05

- **Source:** `workspace/website/` (Vite + shadcn React app, package `tingalingschools`)
- **Hosting:** GitHub Pages on `tingalingschools-workspace` repo, **gh-pages branch** (repo = the big workspace repo, origin git@github.com:deonvdberg1/tingalingschools-workspace.git)
- **Build:** `npm run build` → dist/ (copies index.html → 404.html for SPA deep-link fallback)
- **Deploy:** copy dist/* → gh-pages worktree → commit + push; keep CNAME/favicon/logo
- **Aug 4–5 incident:** AuthProvider removed from App.jsx (commit d3f3824) while NavigationTracker still called useAuth → full-site crash. Restored AuthProvider → rebuilt → redeployed (gh-pages 93fbd58, main 3d85db1). Verified headless: no errors.
- ⚠️ Never `rsync --delete` into a git worktree root (deletes .git pointer + CNAME)

## 🔑 Credentials (stored in .env / secrets/)
```
WHATSAPP_TOKEN           → whatsapp-server/.env
APP_ID                   → whatsapp-server/.env
APP_SECRET               → whatsapp-server/.env
VERIFY_TOKEN             → whatsapp-server/.env
Ionos API keys           → secrets/ionos-api.env
Cloudflare tunnel token  → secrets/cert.pem + 41e8685d-...json
```

## Risks

- ~~Display name PENDING_REVIEW~~ ✅ Approved
- ~~Named tunnel: DNS delegation~~ ✅ RESOLVED (propagated May 28)
- ~~Ephemeral tunnel URL~~ ✅ RESOLVED (permanent named tunnel)
- Domains API: returns 500 (product not provisioned for this account)
- Primary Business Location greyed out in Meta
- No UPS for load shedding
- No payment method set in Meta
- Messaging limit: LIMITED (250/day)

## Inbound Monitoring (2026-05-29)

- **Inbound Watchman** (`whatsapp-server/inbound-watchman.sh`) — runs every 5 min via crontab, alerts via WhatsApp to Mr D if no inbound message for >10 minutes while server is running
- **Health check speedup** — now runs every 15 min (was 2h)
- **Better Uptime / UptimeRobot** — 🟡 Not yet set up (requires browser signup)

## ⏰ Crontab (2026-08-05)
- `*/5 * * * *` — Inbound Watchman
- `*/10 * * * *` — Website Monitor (tingalingschools.com render + uptime)
- `*/15 * * * *` — Full health check
- `0 2 * * *` — Auto-backup (daily)

## 🖥️ Website Monitor (2026-08-05)
- Script: `fred/scripts/site-monitor.sh` — runs every 10 min
- Checks: HTTP 200 → bundle referenced → REAL headless-Chrome render (crash markers + content)
- Catches "HTTP 200 but React crash" bugs (like the 2026-08-05 useAuth incident)
- Alerts Mr D via WhatsApp on state change only (no spam)
- Log: `fred/logs/site-monitor.log` | State: `/tmp/site-monitor-state.json`

## 💾 SQLite Chat Persistence (2026-05-29)
- **New:** `messages` table in `dashboard-api/data/autoeffortless.db`
- **New sync endpoint:** `POST /api/messages/sync` on dashboard API
- WhatsApp server calls sync on every message (fire-and-forget, non-blocking)
- Conversations survive WhatsApp server restarts
- Cap raised: 50→500 messages per conversation

## 📧 AutoEffortless Email — SET UP ✅
- **info@autoeffortless.com** — Live with Google Workspace
- gog CLI configured with Gmail, Calendar, Drive access ✅
- Test email sent and received successfully ✅

## 🟡 Deferred: Hetzner VPS / Oracle Cloud
The VPS for uptime redundancy is deferred until we have paying clients.
- **Reason:** 1 demo client (Ting-A-Ling), no revenue yet — R80/month is better spent after cashflow exists
- **Revisit when:** Client #2 onboarded or reliability issues cost us money
- **Watchman + LaunchAgents + crontab** sufficient for now

## 🟡 Deferred: Tax Strategy
Long-term tax planning (SBC rates, VAT, salaries vs dividends, R&D incentives) deferred until revenue is flowing. Revisit when first paying clients are onboarded.

## 📝 Board Items for Mr D
- AutoEffortless email set up ✅
- Better Stack monitors active ✅
- Need: UPS purchase (R1,293 APC 650VA from Takealot)
- Need: Parent opt-in campaign for Ting-A-Ling

## 🔒 Security: Admin Whitelist Deployed (2026-05-26)

- **ADMIN_NUMBERS** whitelist added to `server.js`
- Only Mr D's number (+27615274429) gets full AI (DeepSeek) responses
- **All other numbers**: template-only responses from DB — no LLM exposure
- 17 keyword-triggered templates seeded from KB content (Ting-A-Ling, client ID 6)
- CLIENT_NUMBER_MAP corrected: `27687548390` → client ID 6 (was 1)
- Future clients can opt into AI per-account by adding admin whitelist entries

## Decision: Register AutoEffortless as a Company (2026-05-26)

- **Mr D agreed:** Registering AutoEffortless as a Pty Ltd is the path forward
- **Why:** Meta WABA verification — AutoEffortless as a managed services provider can display client brand names under its own WABA
- **Alternative rejected:** Using D&S Comp WABA for all clients (Meta may reject display names not matching the business)
- **Status:** ✅ CIPC approved — AutoEffortless (Pty) Ltd registered
- **Next step:** Open Meta WABA under AutoEffortless

## 🏗️ Architecture Decision: Per-Client AI Agents (2026-05-28)

**Each client gets their own dedicated AI agent** — an independent OpenClaw agent with isolated identity, knowledge base, and configuration.

### Current Flow (AI-First — final architecture)
```
WhatsApp → Server → resolveClient()
  → AI agent first (TingAI dedicated agent)
  → Template match as fallback only
  → Human handoff if nothing works
```
- Phone number → client resolution: ✅
- **AI is primary response** — clients pay for AI, not templates
- Templates are fallback only (if AI is offline)
- Each client has their own dedicated OpenClaw agent

### Business Decision (2026-05-28)
- **No more template-first.** Templates are cheap, we sell AI.
- The AI agent is the main responder on every message
- Templates exist only as emergency fallback if the AI agent is unreachable

### Target State (When we have paying clients)
```
WhatsApp → Server → resolveClient() → Template match → Route to dedicated AI agent
                                                              ├── tingai (Ting-A-Ling)
                                                              ├── agent-xyz (Client #2)
                                                              └── agent-abc (Client #3)
```
Each client agent has:
- Own identity files (SOUL.md, AGENTS.md, etc.) — isolated from Fred and other clients
- Own knowledge base (editable via dashboard)
- Access to client's own tools but NOT to Fred's tools or other clients' data
- Communicated with via OpenClaw Gateway API (port 18789)

### When We Build It
- The per-client agents get created **when a new client is onboarded** and opts into AI
- The current synchronous DeepSeek call gets replaced with an agent session call
- Template matching stays as the first line (no AI cost for simple queries)

### Note
- `tingai` agent was set up as a prototype but has issues — not to be used as reference

## 🛠️ Improvements Deployed (2026-05-28)
- Rate limiting on webhook (20 req/s window)
- .env validation at startup (crash early, not mysteriously)
- Structured logging with timestamps + levels (INFO/WARN/ERROR)
- Named tunnel live on permanent URL (no more ephemeral trycloudflare)
- DNS delegation propagated (Ionos→Cloudflare, ~7 days)
- Old v2 dashboard removed (only SPA remains)
- AI conversation memory persisted to disk (no context loss on restart)
- Real-time SSE endpoint for live dashboard updates
- Client health monitoring page (/health)
- Unit tests (26/26 passing) — keyword matching, opt-out, rate limiter, phone formatting
- 3 digital product PDFs generated
- Multi-client architecture: phone→client resolution via dashboard API
- Per-client AI agents (TingAI dedicated agent, isolated identity + KB)
- AI-first flow: TingAI is primary responder, templates are emergency fallback only
- Natural tone: agent doesn't identify as AI, bot, or assistant
- Conversation persistence: per-phone history maintained across messages

## 🛠️ Phase 2: Billing & Subscriptions — IN PROGRESS (2026-06-03)
- ✅ Stripe SDK installed
- ✅ DB tables: `pricing_tiers`, `subscriptions`, `invoices`, `billing_usage`, `payment_methods`
- ✅ Pricing tiers seeded: Starter (R3k), Growth (R5k), Enterprise (R8k)
- ✅ API endpoints: pricing tiers CRUD, subscriptions, invoices, usage metering
- ✅ Stripe webhook handler + checkout/portal session creation
- ✅ Offline mode: works without Stripe keys (manual billing)
- 🟡 Frontend billing page — not built yet
- 🟡 Needs STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in .env for live payments

## 🏗️ WABA Option 3 — Multi-Tenant Architecture (2026-06-03)
- ✅ `waba_configs` DB table: per-client phone_number_id, display_name, status
- ✅ API endpoints: register new numbers, assign to clients, unassigned list
- ✅ WhatsApp server: resolved clients now return phone_number_id from DB
- ✅ `sendWhatsAppMessage()`: accepts optional phoneNumberId param, falls back to .env default
- ✅ `getMetaApi()` helper: builds correct Meta API URL per phone_number_id
- ✅ Backward-compatible: existing .env PHONE_NUMBER_ID still works as default
- ✅ Client service agreement drafted (saved to whatsapp-server/client-service-agreement.md)

## 🗺️ Product Roadmap

### Phase 1: Analytics & Reporting ✅ COMPLETE
- ✅ Message analytics dashboard — volume trends, auto-reply rate, response times, busiest hours — live at /analytics/overview
- ✅ Busiest hours page — 24h breakdown with peak hour — live at /analytics/messages
- ✅ Response time trends — avg/fastest/slowest + daily trend — live at /analytics/compare
- ✅ Per-product stats — per-product client counts and message volumes
- ✅ CSV export — one-click download on analytics overview
- ✅ Health score — green/yellow/red per client — live at /health

### Phase 2: Billing & Subscriptions
- Stripe integration — automated client charging
- Per-product pricing (WhatsApp R3k/mo, Tracking R2k/mo, etc.)
- Usage metering — message volume, AI calls, active days
- Subscription status + invoice history

### Phase 3: Client Self-Service
- Guided onboarding wizard for new sign-ups
- Self-service portal — stats, reports, billing management
- Announcement centre — broadcast updates to all clients

### Phase 4: Admin Power Tools
- Bulk operations — assign products, broadcast to all
- Activity log — every action on the platform
- API usage dashboard — Meta consumption, rate limits, quality

---

## What's Next

1. ✅ Named tunnel
2. ✅ Multi-client refactor
3. ✅ Company registration
4. ✅ **Phase 1: Analytics & Reporting** (complete)
5. 🟡 UPS purchase — R1,293 APC 650VA (Takealot)
6. 🟡 **Phase 2: Billing & Subscriptions** (next)
6. ❌ Parent opt-in campaign — need parent contact list
7. ❌ Client #2 onboarding

---

*Last updated 2026-05-28 18:45 SAST — CIPC approved. AutoEffortless registered. POPIA docs drafted.*
