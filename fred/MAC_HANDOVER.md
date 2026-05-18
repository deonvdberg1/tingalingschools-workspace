# 🖥️ Mac Mini — Complete Handover Document

**Prepared:** 2026-05-15  
**Last Updated:** 2026-05-18  
**Mac:** Deon's Mac mini (Apple Silicon, macOS 15.5)  
**Purpose:** WhatsApp Business API server + OpenClaw AI agent platform

---

## 📌 Purpose of This Machine

This Mac mini runs two critical systems:

1. **WhatsApp Business API Server** — Handles inbound/outbound WhatsApp messages for Ting-A-Ling Schools (demo client). Processes auto-replies via AI.
2. **OpenClaw Gateway** — AI agent platform running Fred, the independent business AI. Connects via Telegram and manages the WhatsApp server.

---

## 🟢 What's Running (Active Services)

| Service | Status | Port | Auto-restart |
|---------|--------|------|-------------|
| **WhatsApp Server** (`server.js`) | ✅ Running | 3000 | ✅ LaunchAgent (`com.tingaling.whatsapp-server.plist`) |
| **Cloudflare Tunnel** (`cloudflared`) | ✅ Running | → 3000 | ✅ LaunchAgent (`com.tingaling.cloudflared.plist`) — also auto-updates webhook URL |
| **OpenClaw Gateway** | ✅ Running | 18789 | ✅ LaunchAgent (`ai.openclaw.gateway.plist`) |
| **Keep Awake** (caffeinate) | ✅ Running | — | ✅ LaunchAgent (`com.openclaw.keepawake.plist`) |

---

## 🔧 Restart Instructions (After Shutdown / Power Loss)

### Step 1: Ensure Mac turns back on
- macOS is set to auto-start after power loss (System Settings → Energy)
- No action needed — it boots up when power returns

### Step 2: OpenClaw starts automatically
- LaunchAgent `ai.openclaw.gateway.plist` runs at boot
- Gateway comes up on port 18789
- Telegram bot comes back online
- **No action needed**

### Step 3: Verify WhatsApp Server & Tunnel
Both are LaunchAgent-managed and start automatically on boot. No manual steps needed.

If you need to check:
- Dashboard: http://localhost:3000/dashboard
- Status: http://localhost:3000/status
- Tunnel URL: `cat whatsapp-server/tunnel-url.txt`

**The tunnel URL auto-updates** via `scripts/start-tunnel.sh` which:
1. Starts cloudflared
2. Captures the new trycloudflare URL
3. Saves to `whatsapp-server/tunnel-url.txt`
4. Attempts to update Meta webhook subscription

⚠️ Meta API currently blocked (display name PENDING_REVIEW) — webhook auto-update fails until resolved.

---

## 📍 File Locations

### Fred's Workspace (`/Users/deonvandenberg/.openclaw/workspace/fred/`)
| File | Purpose |
|------|---------|
| `MEMORY.md` | Long-term business memory |
| `memory/current_task.md` | Active project tracker |
| `whatsapp-server/server.js` | WhatsApp API server code (716 lines) |
| `whatsapp-server/.env` | API credentials (see below) |
| `whatsapp-server/conversations.json` | WhatsApp chat history |
| `whatsapp-server/BACKUP_2026-05-14.md` | Original server setup guide |
| `projects/demo-tingaling-whatsapp-setup.md` | Full WhatsApp setup documentation |
| `projects/infrastructure-reliability.md` | Backup/UPS/security planning |
| `playbook/one-pager.md` | AutoEffortless business one-pager |
| `playbook/sales-playbook.md` | Sales playbook & pricing |
| `services/service-offering.md` | Service tiers & packages |
| `products/` | 3 digital product blueprints |
| `website/` | Landing page for autoeffortless.com |
| `scripts/backup.sh` | Hourly backup script |
| `MAC_HANDOVER.md` | This document |

### OpenClaw Configuration
- **Config file:** `/Users/deonvandenberg/.openclaw/openclaw.json`
- **LaunchAgents:** `~/Library/LaunchAgents/`
  - `ai.openclaw.gateway.plist` — Gateway daemon
  - `com.openclaw.keepawake.plist` — Prevents Mac from sleeping
  - `com.openclaw.session-bootstrap.plist` — Session recovery on boot

---

## 🔑 Credentials (Critical — Keep Secure)

All credentials are stored in the `.env` file. Do NOT share these publicly.

| Credential | Where to Find |
|-----------|---------------|
| WhatsApp Permanent Token | `whatsapp-server/.env` → `WHATSAPP_TOKEN` |
| Meta App Secret | Meta Developer Portal → Ting-A-Ling Connect app |
| Telegram Bot Token | `openclaw.json` → `channels.telegram.botToken` |
| DeepSeek API Key | `openclaw.json` → `auth.profiles` |
| Tavily API Key | `openclaw.json` → `plugins.entries.tavily` |
| Gateway Auth Token | `openclaw.json` → `gateway.auth.token` |
| GitHub Deploy Key | SSH key in `~/.ssh/` — used for git backup |

---

## 🏗️ Meta WhatsApp Business Setup

| Item | Value |
|------|-------|
| Business Portfolio | D&S Comp |
| WABA ID | `1124652154068427` |
| Old Number | ~~+27 78 836 3027~~ (deregistered) |
| New Number | +27 68 754 8390 — Verified ✅ but API blocked (display name PENDING_REVIEW — resubmitted as "Ting-A-Ling Schools") |
| App Name | Ting-A-Ling Connect (App ID: 1771774490471649) |
| Verify Token | `tingaling-schools-verify-2026` |
| Webhook URL | Cloudflare tunnel URL + `/webhooks/whatsapp` |
| Dashboard | http://localhost:3000/dashboard |

**Meta Manager URL:** https://business.facebook.com/wa/manage

---

## 🔄 Backup System

- **Script:** `scripts/backup.sh`
- **Frequency:** Runs via cron/system (automated)
- **Location:** `backups/YYYY-MM-DD_HH-MM/` — kept for 30 days
- **Git remote:** `git@github.com:deonvdberg1/tingalingschools-workspace.git`
- **What's backed up:** Workspace files, memory, projects, server code

---

## 💰 Monthly Costs

| Item | Cost |
|------|------|
| Mac mini electricity | ~R100–200/mo |
| WhatsApp messaging fees | ~R200–500/mo |
| SIM for Ting-A-Ling number | ~R10–99/mo |
| GitHub (free tier) | Free |
| **Total** | **~R310–800/mo** |

---

## ⚠️ Common Issues & Fixes

### "Cannot GET /health" on the server
The server doesn't have a `/health` endpoint. Use `/status` or `/dashboard` instead.

### "API access blocked" — OAuthException code 200
Entire API is blocked by Meta. Likely cause: display name pending/rejected. Resubmit with the business's actual registered name.
- **Current display name:** "Ting-A-Ling Schools" (resubmitted 2026-05-18)
- **Check:** Meta WhatsApp Manager → Phone Numbers → Display name status

### Webhook returns 403 on GET
That's normal for direct GET requests without proper verify token. The verification flow uses `hub.verify_token` parameter.

### Cloudflare tunnel URL changed
The trycloudflare.com URL is temporary. The tunnel LaunchAgent + script auto-captures the new URL and saves it to `whatsapp-server/tunnel-url.txt`.
- The startup script tries to update Meta's webhook automatically
- If Meta API is blocked, you'll need to update webhook URL manually once access is restored

---

## 📋 To-Do After Handover

- [ ] New number approved → verify via API, update server `.env`
- [ ] Test inbound WhatsApp messages
- [ ] Record demo video for Ting-A-Ling
- [x] Set up WhatsApp server as a LaunchAgent for auto-start on boot
- [x] Set up Cloudflare tunnel as a LaunchAgent for auto-start on boot
- [ ] Resolve Meta API block (display name)
- [ ] Buy UPS (~R1,200) for power outage protection
- [ ] Enable macOS auto-start after power failure (System Settings → Energy)

---

## 📞 Contact

- **Fred:** Available via Telegram @Fredtheautoguy_bot
- **Mr D:** Founder — reachable via Telegram or WhatsApp
- **Tunnel (live):** https://appendix-employ-highs-eliminate.trycloudflare.com

---

*End of Handover Document — Last updated 2026-05-18*
