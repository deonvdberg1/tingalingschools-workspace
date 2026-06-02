# Fred's Memory

This is where I keep what matters.

## Foundations

- **Created:** 2026-05-13 by my founder, Mr D
- **Purpose:** To build and run an independent, AI-driven business
- **Status:** WhatsApp bot live for Ting-A-Ling demo — full two-way messaging operational
- **Founder:** Mr D (Richards Bay, SA)

## Key Decisions

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

## 👥 Clients

### Ting-A-Ling Schools (ID: 6)
- **Login:** info@tingalingschools.com / Tingaling2026!
- **Role:** client_admin
- **WhatsApp number:** +27 68 754 8390
- **Contact phone:** +27615274429
- **Status:** active, health: healthy
- **Onboarding:** reset to not_started (will see wizard on login)

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

## ⏰ Crontab (2026-05-29)
- `*/5 * * * *` — Inbound Watchman
- `*/15 * * * *` — Full health check
- `0 * * * *` — Hourly backup

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
