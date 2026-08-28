# Heartbeat Monitor
# Fred checks these on every session start

## 2026-08-27 — Portfolio browser link LIVE ✅

- New hostnames: **files.autoeffortless.com** + portfolio.autoeffortless.com → `fred/products/` (port 8099)
- Dedicated `files` tunnel (6ba48693) + LaunchAgents `com.autoeffortless.fileserver` (8099) & `com.autoeffortless.cloudflared-files`
- ⚠️ Main tunnel uses REMOTE dashboard config — local config.yml edits ignored. New hostnames need dedicated tunnels.
- PDF: files.autoeffortless.com/AutoEffortless-Product-Portfolio-2026-08-26.pdf · HTML: files.autoeffortless.com/portfolio-2026-08-26.html

## 2026-08-27 — 💳 REAL E2E PURCHASE VERIFIED + EMAIL FIX ✅ (15:02)

- **Real payment loop proven:** actual Paystack test-card charge (4084...4081) → Paystack delivered `charge.success` to our webhook → user auto-created (client_admin) + purchase row (docchat single, R99). Verified via public URL, real webhook from Paystack's servers (not simulated).
- **Email fix (CRITICAL):** welcome email was failing — gog has TWO tokens both marked default → "missing --account". Fixed: `sendEmail()` now passes `--account info@autoeffortless.com` explicitly. Verified exit 0 + no failure in log.
- All test data cleaned (0 purchases, 7 real users). API healthy.
- ⚠️ **BIG GAP FOUND:** storefront sells 15 apps but NONE are built — buyers log into the client ops portal (WhatsApp/analytics), not a product. Next: build DocChat (flagship) + "My Apps" launcher in portal.

## 2026-08-27 — 💳 Paystack CHECKOUT LIVE (test mode) ✅ (key received 14:51)

- **Key:** `sk_test_...` in dashboard-api/.env → API restarted (com.autoeffortless.api)
- **Plans seeded:** 18 (15 apps + 3 packages) via `node scripts/seed-paystack.js` → `data/plan-codes.json`. ⚠️ Paystack does NOT accept `start_date` on `/plan` — removed; trial now applied at checkout (`transaction/initialize` with `plan` + `start_date` = now+7d)
- **Webhook** `https://app.autoeffortless.com/api/paystack/webhook` — verified: bad sig→401, good sig→`received:true` (tested via public URL)
- **Provisioning tested end-to-end:** signed charge.success → user auto-created (client_admin) + purchase row, idempotent (2 sends = 1 row). Test rows cleaned.
- **Checkout tested:** POST /api/checkout returns valid authorization_url for subscription (plan attached: docchat→PLN_7ylijshxisf0wlv) + single modes. CORS open. /apps frontend already wired + deployed (bundle index-Y3wScy4A.js live).
- **Webhook also handles:** `subscription.create` (instant access at trial start) + `subscription.disable/cancel` (status→cancelled).
- ⏳ **Mr D TODO:** 1) Add webhook URL in Paystack Dashboard → Settings → Webhooks. 2) Test purchase with test card 4084 0840 8408 4081 (exp future, CVV any, PIN 0000, OTP 123456). 3) Live key when ready.

## 2026-08-27 — 📄 DocChat v2 — RAG + CITATIONS BUILT (16:45)

- **RAG pipeline (local, zero AI cost):** chunk (1200 chars, para-aware, overlap) → embed via **Ollama `qwen3-embedding:0.6b`** on this Mac → cosine top-5 retrieval per question. Handles big docs (76k-char workbook → 74 chunks).
- **Citations:** AI answers cite `[n]`; API returns `sources[]` (chunk text + relevance %) → UI renders source cards under each answer.
- **Quick actions:** Summarize / Key points / Follow-ups buttons above chat input.
- **Side-by-side layout:** documents list | document viewer (full extracted text, loads per doc) | chat. `GET /api/app/docchat/documents/:id/text` (falls back to file extraction for pre-upgrade docs).
- **Lazy indexing:** docs uploaded before v2 get indexed on first chat (self-healing). Index stored in `docchat_chunks` table.
- **Tested:** portfolio PDF (3,346 chars → 4 chunks) — cited tier answers; vocabulary workbook (76,212 chars → 74 chunks) — correct structural summary with [1][2] citations + 5 sources with scores.
- **Schema:** docchat_docs gains `text` column (ALTER at startup); docchat_chunks table.
- ⏳ Next: OCR for scanned PDFs, more formats (CSV/PPTX/URL), multi-doc chat, chat history library.

## 2026-08-27 — 📄 DocChat v1 BUILT + TESTED (first real app) ✅ (16:05)

- **Backend:** `dashboard-api/docchat-routes.js` — upload (multer, PDF/DOCX/TXT/MD, 15MB), text extraction (pdf-parse@1.1.1 + mammoth), list/delete, chat. Entitlement-gated: active `docchat` purchase required. Doc text capped at 40k chars; history last 12 msgs.
- **AI:** dedicated `docchat` agent registered via `openclaw agents add` (workspace `~/.openclaw/workspace/docchat`, neutral doc-only SOUL, no tools). Calls `openclaw/docchat` via gateway :18789 with `x-openclaw-light-context`. ⚠️ Gateway restarted once to register the agent.
- **Frontend:** portal route `/app/docchat` — document list + upload (click or drag-drop) + chat UI (gold/cream brand). My Apps "Open app" for docchat → `/app/docchat` (in-app). Purchase-required state for non-buyers.
- **Tested E2E via public URL:** uploaded portfolio PDF (3,346 chars extracted) → "What apps are in the portfolio?" → correct 15-app list with pricing; "Big Mac price?" → correctly refused (not in doc). DocChat R99–199/mo answer verified.
- **Bugs fixed en route:** multer fileFilter `cb(null, undefined)` rejects files → `cb(null, true)`; ESM `require` → createRequire; pdf-parse v2 API break → pinned v1.1.1.
- ⏳ **Next:** Mr D tests UI in browser; then wire real Paystack subscription renewal dates into Billing.

## 2026-08-27 — 🧾 Customer Billing page LIVE ✅ (15:50)

- **Buyer nav now:** My Apps | Billing | Profile (sidebar filter updated; Billing added to navItems with ListIcon)
- **Endpoint:** `GET /api/me/billing` (requireAuth) → purchases by email + summary (total_spent_cents, active_count, subscription_count)
- **Page:** `pages/Billing/Billing.tsx` — summary cards (Total spent / Active apps / Subscriptions) + purchase history (app, kind, date, valid-until, next charge = created+7d for trial subs, status pill, amount) + Paystack notice + mailto support. Gold/cream brand (brand-* classes, matches MyApps).
- Route `/billing` added; verified endpoint with user 14 (3 purchases: docchat R99, website-builder R149, invoice-app R99 = R347 total). Bundle live (index-BtbkfJPL.js).
- ⚠️ Buyer-facing "Admin Portal" wording swept: SignIn heading → "Welcome back", tab titles fixed, UserDropdown shows "Customer · AutoEffortless" for buyers. "Admin Portal" only for overlord.

## 2026-08-27 — 🔐 Email password bug + ghost session FIXED (15:31)

- **Bug (email sent the hash):** welcome email printed `user.password` re-fetched from DB = SHA-256 hash → buyers got a 64-char "password" that could never log in. Fixed: capture `plainPassword` before hashing, email that. **Verified** by reading the actual sent email back via gog: `Password: DNLZUMS_` (short plaintext) + signin works with it.
- **Bug (ghost session):** AuthContext restored sessions from localStorage without server validation → deleted users still saw the admin shell. Fixed: on load, validate token via `/api/auth/me`; on failure clear storage + force sign-in.
- All test accounts cleaned (deonvdberg1@gmail.com ×2, emailfix-verify). 7 real users remain.

## 🎨 Logo & Icons — LOCKED 2026-08-27 (Mr D)

- **Official logo:** `branding/logo-current.png` (Mr D-approved). Wordmarks: website/logo-main.png, logo-white.png.
- **Official icon mark:** dark ink badge + gold orbit ring + gold-light dot + gold AE (`website/logo-icon.svg` / favicon.svg). Portal component `LogoMark.tsx` (React useId-safe).
- **RULE: no old-school/outdated icons, no text-only "AE" badges anywhere.** All surfaces use the official mark + autoeffortless.com icon style.
- **Portal re-skinned (16:55):** real logo (`/logo-main.png` light + `/logo-white.png` dark) in sidebar brand area, mobile header, signin card. Sidebar nav icons → brand sprite (same icons as autoeffortless.com: chart/message/layers/credit-card/settings/user/globe/shield etc.) via `AeIcon.tsx` + `AeSprite` (mounted in App). Favicon → favicon.svg.
- Committed to MEMORY.md + USER.md + BRAND.md. Live bundle index-DeQbD8uM.js; verified signin renders logo img + sprite, 0 old badges.
- **Full icon sweep (17:05):** replaced ALL old TailAdmin icons — `icons/index.ts` remapped to brand sprite (AeIcon) so every import renders brand style; inline SVGs replaced in header (hamburger/menu/search/close), sidebar (close/logout/back), user dropdown chevron, theme toggles (sun/moon), notification bell, breadcrumb chevrons, modal close, alert icons, checkbox checks, phone input chevrons, signin eye/eye-off. AeIcon sprite extended to ~50 feather-style symbols matching autoeffortless.com. Live bundle index-BHIHRytw.js; signin verified (logo + 7 brand symbols, 0 old filled paths).
- **App icons everywhere (17:15):** ALL product/app emoji replaced with brand icons in gold-soft iconboxes (matching autoeffortless.com .iconbox: gold gradient box + gold-deep stroke icon). Portal: MyApps + Billing cards, DocChat page (AppIcon component). Storefront: product cards, product pages, tier headers, package cards, thanks page (BrandIcon.jsx with same sprite). 21 icons mapped (15 apps + 3 packages + categories). Portal bundle index-Dad7-iWH.js; storefront index-CqGbGoSD.js pushed (e23df41). Verified: 0 product emoji in store DOM, iconboxes render.

## 🎨 Brand Consistency — LOCKED 2026-08-27 (Mr D)

- **RULE: everything AutoEffortless = autoeffortless.com look (gold/cream). One brand everywhere.**
- Source of truth: `branding/BRAND.md`. Palette: gold #c8a34e / gold-deep #a8863a / cream #faf8f3 / ink #14142a. Font Outfit.
- **Portal re-themed teal → gold:** `--color-brand-*` scale in dashboard-temp/src/index.css now gold; 50 hardcoded teal/cyan classes swept (`teal-`/`cyan-` → `brand-`); page bg → cream (brand-25); auth page blue-50 → brand tones; sidebar/signin gradients → gold. Verified via pixel scan of live signin page: 0 teal pixels, gold button + cream bg.
- New surfaces (DocChat, apps, super-app, emails, PDFs) MUST follow BRAND.md from day one.

## 2026-08-27 — 🛍️ Buyer experience ironed out (post-purchase flow) ✅ (15:13)

- **Bug 1 (blank product pages):** ProductCard linked `/apps/${slug}` while router basename=`/apps` → `/apps/apps/...` matched nothing → blank. Fixed to `/${slug}` + added `*` catch-all NotFound. Deployed (storefront build → website/apps → git push e5d474f). Verified headless-Chrome render of /apps/docchat.
- **Bug 2 (plaintext passwords):** provisionPurchase stored the raw generated password but sign-in compares SHA-256 → buyers could never log in. Fixed: store hash, email plaintext. Repaired existing test user.
- **Bug 3 (public URL served old portal):** app.autoeffortless.com → whatsapp-server :3000 served its own stale `spa-dashboard/` copy (API proxied to :3001 which had the new build). Fixed: whatsapp-server now serves `dashboard-temp/dist` directly (single source of truth). Restarted, verified new bundle live.
- **Buyer experience built:** new `GET /api/me/purchases`; portal `/my-apps` page (purchase cards from DB, status/price/date, Open app → store page); buyers (client_admin, client_id NULL) skip onboarding wizard, land on My Apps, sidebar shows only My Apps + Profile, brand label "My Apps" (not "Admin Portal"). Welcome email rewritten buyer-facing (product name, /my-apps link).
- Verified: signin via public proxy, /api/me/purchases returns docchat single active, webhook 401 check, whatsapp tunnel 200.
- ⏳ **Still to build:** the actual DocChat app (Open app currently → store product page).

## 2026-08-27 — 🛒 Storefront LIVE (Phase 1 kickoff) ✅

- **store.autoeffortless.com** → `fred/storefront/` (Vite React, port 8092, LaunchAgent `com.autoeffortless.storefront`, vite preview w/ allowedHosts)
- Home + hero + 3 tier sections + 15 product pages (data in `src/data/products.js`, from locked portfolio) + bundle pricing (R199/R499/R999)
- Buy buttons DISABLED for now (checkout wiring = next step)
- Route: `store` hostname added to `files` tunnel (6ba48693) config-files.yml
- ⚠️ Lesson: Vite 5.4 preview blocks unknown Host headers → set `preview.allowedHosts` in vite.config.js

## 2026-08-27 — 🏠 Unified Site LIVE (marketing + app store, one origin) ✅

- **autoeffortless.com** = marketing site (GitHub Pages, repo `deonvdberg1/autoeffortless.com` main branch) + **app store at /apps** (same origin, top nav: Services | **Apps** | How It Works | Capabilities | Pricing | FAQ | Sign In | Contact)
- Store = `fred/storefront/` (Vite React) restyled to gold/cream brand, `base:'/apps/'`, BrowserRouter basename `/apps`
- **Deploy flow:** storefront build → copy dist → `website/apps/` → git push main (Pages auto-deploys). SPA fallback via root `404.html` (guard: non-/apps paths redirect to /)
- Store alias: `store.autoeffortless.com` → site-server :8092 (serves marketing + /apps)
- ⚠️ Lesson: autoeffortless.com DNS is an A record → GitHub Pages (proxied). cloudflared `route dns --overwrite-dns` CANNOT replace it (no CNAME created) — need Cloudflare API token to move site onto own server later

## 2026-08-27 — 💳 Checkout = Paystack (Stripe NOT available in SA) ✅ built, awaiting key

- **Decision (Mr D):** Stripe proper doesn't support SA merchants → SA is "via Paystack" (Stripe-owned). Paystack = SA + international (Visa/MC global, Amex for SA) in ZAR, 2.9%+R1. Paddle/MoR = later if international grows.
- **Offer structure:** per app: 7-day free trial (via plan start_date) / subscription / single-use one-time. Packages: Business Suite R999, Personal R299, University R149 (all with trial). Individual purchases remain.
- **Built:** `dashboard-api/paystack-routes.js` (POST /api/checkout → Paystack initialize; POST /api/paystack/webhook raw body, HMAC-SHA512 verify; auto-creates user + purchases table + welcome email via gog CLI). Mounted in server.js. `scripts/seed-paystack.js` creates plans (15 apps + 3 pkgs, start_date +7d) → `data/plan-codes.json`. Storefront buttons wired → checkout modal → Paystack; /apps/thanks page live.
- ⏳ **BLOCKED ON:** Mr D setting up Paystack account → send `sk_test_...` key; add webhook endpoint `https://app.autoeffortless.com/api/paystack/webhook` (event charge.success). Then: seed plans → test purchase (trial/subscribe/single) → live key later.

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

## 2026-08-28 — DocChat crash FIXED ("Can't find variable: AeIcon") ✅ (10:05)

- **Bug:** DocChat page used `AeIcon` (lines 267/284/343) but never imported it → React crash "Something went wrong" on /app/docchat. Bundle index-Dad7-iWH.js.
- **Fix:** added `import AeIcon from "../../components/common/AeIcon"` in `dashboard-temp/src/pages/DocChat/DocChat.tsx`.
- **Sweep:** grepped all src for AeIcon usage without import — DocChat was the only offender.
- **Deploy:** rebuilt → new bundle index-Cq7Eiwro.js live on app.autoeffortless.com (verified 200).

## 2026-08-28 — 📄 DocChat v3 — Viewer + Notebooks + Cross-Doc Search (12:30)

Mr D's 4 upgrade requests shipped:
1. **Cover-page thumbnails** — PDF page 1 rendered via pdf.js → cached JPEG in the docs list (DOCX/TXT keep icon fallback)
2. **Real document viewer** — middle pane now shows the ACTUAL document: PDF = every page rendered (scroll top→bottom, progress bar, 60-page cap), DOCX = mammoth HTML, TXT/MD = plain. New `GET /api/app/docchat/documents/:id/file` serves the original file (auth + entitlement)
3. **Notebook per document** — chat box shrunk (40vh), notebook below (26vh): add/delete notes (Enter to save), one notebook per doc, "Search notes" button → search across ALL notebooks
4. **Search all documents** — button in docs list header → modal: cross-doc RAG (chunks from all docs, lazy-indexes any missing), AI answer with [n] citations, source cards show doc name + relevance + "Open →" jumps to that doc. LIKE fallback if Ollama down
- **DB:** `docchat_notes` table; delete-doc now cascades notes
- **Stack:** pdfjs-dist 6.2 + mammoth 1.12 added (lazy-loaded chunks — main bundle barely grew); DocViewer/SearchAllModal code-split
- **Verified E2E (puppeteer, real login):** 2 PDF pages render as canvases, 2 cover thumbs (data:image/jpeg), search-all returns table answer + 10 cited sources, notes add/delete in UI, 0 console errors. API endpoints curl-tested (upload/list/file/notes/notes-search/search-all/chat). Test data cleaned (API stopped → sqlite → restart per sql.js lesson)
- **Deploy:** bundle index-g_hrvpr2.js live on app.autoeffortless.com

## 2026-08-28 — 📄 DocChat v4 — Viewer Fix + Full Workspace + Annotations (14:00)

Mr D's 5 requests shipped:
1. **PDF viewer crash FIXED** — root cause: pdf.js v6.2 uses bleeding-edge JS built-ins (`Map.getOrInsertComputed`, `URL.parse`) missing in Mr D's browser → "getOrInsertComputed is not a function". Pinned to **pdfjs-dist 4.8.69** (0 occurrences of those APIs; also 100KB smaller). Verified E2E.
2. **Maximised workspace** — AppLayout sidebar now hide/show with a floating chevron button (persists in localStorage, 256px↔0px). `/app/*` routes (DocChat) break out of the max-w-6xl cap → full-width workspace.
3. **Drag & drop everywhere** — drop onto the Upload button OR the documents panel; multi-file upload queue (input + drop both accept many files).
4. **All file types + cover thumbs for ALL** — now accepts PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, RTF, ODT. Extraction: pdf-parse (PDF), mammoth (DOCX), officeparser (XLSX/PPTX/ODT/RTF), raw (rest). Cover thumbnails generated **server-side via macOS QuickLook (qlmanage) at upload** → every doc type gets a real cover image (verified: PDF/CSV/RTF all produce PNGs). New `GET /documents/:id/thumb`.
5. **Highlight → note annotations** — text is now selectable in PDFs (pdf.js text layer) and all other views; select text → floating "Highlight & note" button → modal (quote prefilled, note, 5 colours) → saved as `<mark>` highlight; click any highlight → popup with note + edit/delete. `docchat_annotations` table + CRUD API. Fixed quote-matching across pdf.js word spans (window matcher + extractContents wrapping).
- **Auth fix:** requireAuth now accepts `?token=` query param (needed for `<img>`/`<iframe>` which can't send headers) — thumbnails were 401ing.
- **Verified E2E (puppeteer, real login):** PDF renders + selectable text (211 spans), 3/3 cover thumbs, sidebar 256→0→256, selection→button→modal→save→mark with note title→popup all work, 0 console errors. API: upload/reject/thumb/text/annotation CRUD all tested.
- **Deploy:** bundle index-xAWWSeF2.js live on app.autoeffortless.com. Test data cleaned (stop API → sqlite → start).

## 2026-08-28 — DocChat v4.1 — Thumb backfill + Notebook highlights + Full-bleed layout (13:40)

Mr D's 3 follow-ups shipped:
1. **Cover icons now work for ALL docs** — root cause: thumbs were only generated at upload, so pre-existing docs had none. Fixed 3 ways: (a) **startup backfill** — API regenerates missing thumbs for every doc on boot, (b) **lazy generation** — /thumb triggers qlmanage on 404, (c) frontend DocThumb retries twice (3.5s apart) before falling back to icon. Verified all 3 paths.
2. **Highlights now live in the Notebook** — annotations lifted into DocChat state; notebook shows a "Highlights" section (colour-coded, quote + note + page). Clicking an entry **jumps to the highlighted section** — scrolls into view, gold flash animation, opens the note popup. Persistence verified E2E: save → reload → mark + note still there.
3. **Zero wasted space** — DocChat is now full-viewport: `h-screen` root, compact single-row header, flex-1 grid with `min-h-0` everywhere; viewer/chat/notebook stretch exactly to the window edges (verified: root = viewport height, page no longer scrollable). AppLayout `/app/*` routes get `p-0`.
- **Deploy:** bundle index-y88swdkm.js live. Verified E2E (layout 900/900, 1/1 thumbs, highlight→notebook→jump→flash→popup→reload-persist, 0 errors). Test data cleaned.

## 2026-08-28 — DocChat v4.2 — Multi-doc chat + OCR + Notebook ✕ + Resizable panes (13:55)

Mr D's 4 requests shipped:
1. **Multi-select & chat across selection** — checkbox on every document row; select any set → chat bar "Chatting with N selected documents" → questions are answered via cross-doc RAG scoped to ONLY those docs (citations show which doc). `/api/app/docchat/chat` now accepts `docIds[]`; single-doc chat unchanged. Clear button to exit selection mode.
2. **Upload error FIXED with real OCR** — scanned/image-only PDFs now OCR automatically: pdftoppm (poppler, installed via brew) rasterizes at 200dpi → tesseract 5.5 per page → text indexed like any doc. ⚠️ LaunchAgent PATH lacks /opt/homebrew/bin → use absolute binary paths. Verified: image-only PDF uploads + answers questions. Clearer error message if truly no text.
3. **Notebook delete ✕** — hover any note OR highlight entry → ✕ top-right (highlight entries are now divs, not nested buttons — fixes invalid HTML); deletes instantly.
4. **Resizable section borders** — drag handles between Documents | Viewer | Chat columns (cursor: col-resize, gold highlight on hover); widths persist in localStorage (left 160–400px, right 280–580px). Only on desktop; mobile unaffected.
- **Deploy:** bundle index-rzgHpwfZ.js live. Verified E2E: checkboxes, selection bar, multi-doc answer with doc-named sources, grid 230→310px on drag, note ✕ delete, highlight ✕ delete, 0 console errors. Test data cleaned.
