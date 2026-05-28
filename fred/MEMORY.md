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
- **Auto-reply:** Fees, hours, uniform, absentee, events, contact, enrolment, greetings ✅
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
- **Next step:** CIPC registration + new Meta WABA under AutoEffortless

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

## What's Next

1. ~~Named tunnel~~ ✅ RESOLVED — DNS delegation propagated, tunnel on permanent URL
2. **Company registration** — Register AutoEffortless at CIPC
3. Parent opt-in campaign — need parent contact list from Ting-A-Ling
4. Demo video polish
5. Real client onboarding (walk Ting-A-Ling through wizard)

---

*Last updated 2026-05-28 09:23 SAST — Named tunnel live on permanent URL. DNS propagated. trycloudflare fully removed.*
