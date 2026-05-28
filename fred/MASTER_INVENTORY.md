# 📋 MASTER INVENTORY — AutoEffortless
## 28 May 2026 19:15 SAST
## Every component, account, credential, and dependency

---

## 1. 🖥️ HARDWARE

| Item | Details | Status | Dependency |
|------|---------|:------:|------------|
| **Mac mini M4** | 16GB RAM, 256GB SSD, Serial: MMWXJJTXLN | ✅ Live | Physical device — everything runs on this |
| **Mac mini power** | 220V wall outlet | ⚠️ No UPS | If power goes out, everything goes down. Auto-restarts on return |
| **Internet** | Fibre (assumed) | ⚠️ Not monitored | If internet goes out, bot goes out. Auto-reconnects |
| **macOS** | Sequoia 15.5 | ✅ Running | OS updates could break things — don't update without checking |

---

## 2. 🏗️ LOCAL SERVICES (Mac mini)

| # | Service | Port | PID | Auto-Start | What It Does |
|---|---------|:----:|:---:|:----------:|-------------|
| 1 | **WhatsApp Server** | 3000 | 29994 | ✅ LaunchAgent | Handles webhooks, routing, AI dispatch |
| 2 | **Dashboard API** | 3001 | 2756 | ⚠️ Manual | Client management, KB, templates |
| 3 | **Dashboard Frontend (Vite)** | 5173 | auto | ⚠️ Manual | React SPA for client dashboards |
| 4 | **OpenClaw Gateway** | 18789 | auto | ✅ OpenClaw | AI model routing, agent management |
| 5 | **Cloudflare Tunnel** | — | 13417 | ✅ LaunchAgent | Named tunnel to permanent URL |

### Dependencies

| Service | Depends On | If It Fails |
|---------|-----------|-------------|
| WhatsApp Server | Node.js, .env, OpenClaw Gateway | Bot stops responding |
| Dashboard API | Node.js, SQLite DB | Dashboard dead |
| OpenClaw Gateway | DeepSeek API key, openclaw.json | AI agent stops working |
| Cloudflare Tunnel | Cloudflare account, DNS, tunnel token | Webhook breaks, bot unreachable |

---

## 3. 🌐 EXTERNAL SERVICES & ACCOUNTS

### 3.1 Meta / WhatsApp Business

| Account / Resource | ID / Value | Purpose | Critical? |
|--------------------|-----------|---------|:---------:|
| **Meta Business Account** | D&S Comp | Holds WABA | 🔴 |
| **WABA** | 1124652154068427 (real: 996583169477166) | WhatsApp Business API access | 🔴 |
| **Phone Number** | +27 68 754 8390 (ID: 1046384845235600) | The bot's number | 🔴 |
| **Display Name** | "Tingaling" | Shown to parents | 🔴 |
| **Quality Rating** | GREEN | Determines messaging limits | 🟡 |
| **Messaging Limit** | 250 conversations/day | Starter cap | 🟡 |
| **App** | Ting-A-Ling Connect (ID: 1771774490471649) | App registration | 🔴 |
| **Verify Token** | `tingaling-schools-verify-2026` | Webhook verification | 🔴 |
| **Webhook URL** | `https://whatsapp.autoeffortless.com/webhooks/whatsapp` | Where Meta sends messages | 🔴 |
| **Primary Business Location** | Greyed out | Needed for full verification | 🟡 |

### 3.2 Cloudflare

| Resource | Value | Purpose | Critical? |
|----------|-------|---------|:---------:|
| **Cloudflare Account** | (D&S Comp email) | DNS + Tunnel management | 🔴 |
| **Named Tunnel** | `tingaling` (ID: 41e8685d-...) | Permanent tunnel to Mac mini | 🔴 |
| **Tunnel Token** | `secrets/cert.pem` + `secrets/41e8685d-...json` | Auth for tunnel | 🔴 |
| **DNS: autoeffortless.com** | A → Cloudflare IPs | Root domain | 🟡 |
| **DNS: whatsapp.autoeffortless.com** | CNAME → tunnel | Bot's permanent URL | 🔴 |
| **DNS: tingaling.autoeffortless.com** | CNAME → tunnel | Alternative access | 🟡 |

### 3.3 Ionos

| Resource | Value | Purpose | Critical? |
|----------|-------|---------|:---------:|
| **Domain** | autoeffortless.com | Our brand domain | 🔴 |
| **Nameservers** | Delegated to Cloudflare (athena.ns.cloudflare.com, stan.ns.cloudflare.com) | DNS resolution | 🔴 |
| **Ionos Account** | (Mr D's) | Domain management | 🟡 |

### 3.4 DeepSeek (AI Model)

| Resource | Value | Purpose | Critical? |
|----------|-------|---------|:---------:|
| **API Key** | `sk-d4f…ab7d` (in openclaw.json) | AI responses | 🔴 |
| **Model** | deepseek/deepseek-v4-flash | The AI brain | 🔴 |
| **Account** | (Mr D's) | API key management | 🟡 |

### 3.5 GitHub

| Resource | Value | Purpose | Critical? |
|----------|-------|---------|:---------:|
| **Repo** | `deonvdberg1/tingalingschools-workspace` | All code + backups | 🟡 |
| **SSH Key** | (on Mac mini) | Git push access | 🟡 |

### 3.6 Email / Business

| Resource | Value | Purpose | Critical? |
|----------|-------|---------|:---------:|
| **Company** | AutoEffortless (Pty) Ltd, CIPC registered | Legal entity | 🔴 |
| **Bank Account** | Existing (other company) | Payment collection | 🔴 |
| **info@autoeffortless.com** | (claimed, being set up) | Business contact | 🟡 |

---

## 4. 🤖 OPENCLAW AGENTS

| Agent ID | Workspace | Purpose | Critical? |
|----------|-----------|---------|:---------:|
| **fred** | `workspace/fred` | CEO agent (me) | 🟡 |
| **tingai** | `workspace/tingai` | Ting-A-Ling AI assistant | 🔴 |
| **cool** | `workspace` | Mr. Cool (unused) | 🟢 |
| **main** | `workspace` | Default (unused) | 🟢 |
| **side** | `workspace/side` | Side project (unused) | 🟢 |

---

## 5. 📁 CRITICAL DATA FILES

| File | Size | Content | Backed Up? |
|------|:----:|---------|:----------:|
| `whatsapp-server/conversations.json` | ~2 B | WhatsApp conversation log (POPIA-deleted) | ✅ Git |
| `whatsapp-server/ai-conversations.json` | 3.4 KB | AI conversation history | ✅ Git |
| `whatsapp-server/.env` | 529 B | All WhatsApp API credentials | ❌ **Gitignored** |
| `dashboard-api/data/autoeffortless.db` | 56 KB | Clients, users, templates, KB | ✅ Git |
| `secrets/cert.pem` | — | Cloudflare tunnel cert | ❌ **Gitignored** |
| `secrets/41e8685d-...json` | — | Cloudflare tunnel credentials | ❌ **Gitignored** |
| `secrets/ionos-api.env` | — | Ionos API key | ❌ **Gitignored** |
| `openclaw.json` | 9.7 KB | All AI config & API keys | ❌ **Gitignored** |
| `whatsapp-server/server.log` | 16 KB | Runtime logs | ❌ (auto-rotated) |

---

## 6. 🔧 AUTOMATION & SCRIPTS

| Script | Schedule | Purpose | Last Run |
|--------|:--------:|---------|:--------:|
| `scripts/backup.sh` | Every hour | Git push + local snapshot | Today |
| `scripts/healthcheck.sh` | Every 2h (assumed cron) | 7-point system check | Today |
| `scripts/startup-check.sh` | On session start | Manual validation | Today |
| `scripts/seed-templates.js` | On demand | Seed DB with templates | Once |
| Log rotation | On backup | Auto-trims at 1MB | Today |
| Conversation auto-expiry | Every 6h | Deletes conversations >90 days | Today |

### Cron Jobs / Timed Events
| What | Interval | How |
|------|:--------:|-----|
| Auto-backup | Hourly | backup.sh via system cron |
| Healthcheck | Every 2h | healthcheck.sh (silent unless critical) |
| Data retention cleanup | Every 6h | In server.js (expireOldConversations) |
| Rate limiter cleanup | Every 60s | In server.js |

---

## 7. 🧾 DB CONTENTS (SQLite)

| Table | Records | What It Holds |
|-------|:-------:|--------------|
| **clients** | 1 | Ting-A-Ling Schools (+ config for future clients) |
| **users** | 2 | Mr D (overlord) + Ting-A-Ling Admin |
| **templates** | 27 | Fallback templates (used only if AI is offline) |
| **settings** | 1 | Company name, tagline, timezone, currency |
| **profile** | 1 | Mr D's profile info |

---

## 8. 🛡️ SECURITY

| Layer | Status | Notes |
|-------|:------:|-------|
| .env files | ✅ Gitignored | Not in repo |
| openclaw.json secrets | ✅ Gitignored | API keys local only |
| Machine access | ✅ No remote SSH | Local access only |
| Dashboard auth | ✅ JWT tokens | Protected routes |
| Dashboard roles | ✅ overlord vs client_admin | Clients can't see each other |
| Rate limiting | ✅ 20 req/s | Webhook protection |
| Admin whitelist | ✅ Only Mr D triggers AI | Others get fallback |
| POPIA compliance | ✅ | Deletion, export, 90-day expiry, DPA, IO |
| UPS | ❌ | Load shedding vulnerability |

---

## 9. 💰 COST BREAKDOWN

| Item | Monthly | Yearly |
|------|:-------:|:------:|
| DeepSeek API (~1000 calls/mo) | ~R20 | R240 |
| Cloudflare (free tier) | R0 | R0 |
| Ionos domain | ~R50 | ~R600 |
| GitHub (free tier) | R0 | R0 |
| Electricity (Mac mini) | ~R200 | ~R2,400 |
| **Subtotal** | **~R270/mo** | **~R3,240/yr** |
| One-time: UPS (APC 650VA) | — | **R1,293** |
| One-time: CIPC registration | — | ✅ Done (cost included in reg) |

---

## 10. 📋 WHAT NEEDS HUMAN MANAGEMENT

| Item | Frequency | Who | Notes |
|------|:---------:|:---:|-------|
| Check Meta quality rating | Weekly | Mr D | Log into Meta Business Suite |
| Monitor message limit | Weekly | Both | Will auto-increase as quality stays GREEN |
| Respond to human handoffs | As needed | Mr D / Ting-A-Ling | When AI can't answer |
| Review KB accuracy | Monthly | Mr D | Keep school info current |
| Update backup health | Monthly | Fred | Verify git pushes worked |
| Test AI responses | Monthly | Both | Regression testing |
| UPS battery replacement | Every 3 years | Mr D | Standard UPS lifecycle |
| Domain renewal (autoeffortless.com) | Yearly | Mr D | Don't let it expire |

---

## 11. ⚠️ SINGLE POINTS OF FAILURE

| Component | What Happens If It Fails | Recovery Time | Mitigation |
|-----------|-------------------------|:-------------:|------------|
| **Mac mini** | Everything stops | Hours (replace/repair) | Git backup — could re-deploy |
| **Power** | Everything stops | Until power returns | ❌ None (UPS would fix) |
| **Internet** | Bot unreachable | Until internet returns | Auto-reconnects |
| **DeepSeek API** | AI stops responding | Minutes (switch model) | Could swap to another provider |
| **Meta / WhatsApp API** | Can't send or receive | Days (appeal) | No alternative |
| **Cloudflare** | Tunnel breaks, webhook dies | Hours | No alternative tunnel provider |
| **.env file** | Server won't start | Minutes (restore from backup) | Backup is local — unprotected |

---

## 12. 🔑 QUICK REFERENCE (Emergency Cheat Sheet)

| If This Happens | Do This |
|----------------|---------|
| Bot stops responding | Check Mac mini power → check internet → `curl localhost:3000/status` |
| Webhook fails | Verify tunnel is running: `cloudflared tunnel info tingaling` |
| Mac mini reboots | Nothing — LaunchAgents auto-start everything |
| Need to restart server | `kill (PID)` → LaunchAgent auto-restarts |
| Need to check logs | `tail -50 whatsapp-server/server.log` |
| Messages not delivering | Check Meta quality rating → check messaging limit |
| New client onboard | Create in dashboard → create KB → register agent → set agent_id |

---

*Everything in one place. Save this for reference.* 🚀
