# Fred's Infrastructure & Reliability Setup

**Created:** 2026-05-14
**Purpose:** Protect against power outages, disconnections, data loss
**Target:** ~R200–500/mo operation (no BSP, minimal infra)

---

## 1. 🧠 Memory Persistence (Already Working)

My memory files persist across sessions and channels:

| File | Purpose | Updates |
|------|---------|---------|
| `MEMORY.md` | Long-term business memory | Manual (major events) |
| `memory/current_task.md` | Active project status | Every session |
| `projects/` directory | Detailed project plans | Per project |

**Improvements to make:**
- [x] Comprehensive current_task.md — now has full WhatsApp status, credentials, costs, to-dos
- [x] Telegram context — everything in one place so no channel loses context
- [ ] Daily snapshot cron job — auto-save key files to a backup dir

---

## 2. 💾 Backup Strategy

**What to back up:**
- `workspace/fred/` — all my files, projects, memory
- `whatsapp-server/` — server code and config
- `openclaw.json` — gateway configuration

**Plan:**

| Backup | Frequency | Method | Location |
|--------|-----------|--------|----------|
| Workspace files | Daily | Cron job → tar + git | Local + GitHub |
| Server config | On change | Manual commit | GitHub (fred's repo) |
| Conversations | Real-time | In-memory now → upgrade to SQLite later | Local |

**When we set up my own GitHub, I'll push daily snapshots to a private repo.**

---

## 3. ⚡ Power Outage Handling (Richards Bay)

**The reality:** SA has load shedding. The Mac mini runs on home power.

**My immediate protections:**
- [x] All workspace files are on disk — survive reboot
- [x] Memory files are plain Markdown — no database corruption risk
- [x] WhatsApp server logs to console only (not critical data)

**What Mr D should get:**
| Item | Cost | Why |
|------|------|-----|
| UPS (APC Back-UPS 650VA) | ~R1,200 | Powers Mac mini for 20-30 min during load shedding |
| Auto-restart on power return | Free (macOS) | Mac mini boots automatically when power returns |
| My server has `pm2` or systemd | Free | Auto-restarts on boot |

**No-cost fix:** Enable macOS "Start up automatically after power failure" → System Settings → Energy → Power Nap settings.

---

## 4. 🔒 Security Measures

**Current:**
- [x] WhatsApp token stored in `.env` (not in code)
- [x] Telegram bot token stored in `openclaw.json` (not in workspace files)
- [x] DeepSeek API key in agent auth profiles (not exposed)

**Improvements:**
- [ ] Once we have a GitHub repo: add `.env` to `.gitignore`
- [ ] Rotate WhatsApp temporary token → permanent token (after webhook works)
- [ ] Consider `.env` encryption for any production deployments

---

## 5. 📡 Disconnection & Session Recovery

**WhatsApp Server:**
- The Node.js server runs in the background — if it crashes, I restart it
- Tunnel (serveo) is ephemeral — if it drops, I need to restart it
- **Long-term fix:** Use a VPS (R70–150/mo) for the server instead of local tunnel

**OpenClaw Gateway:**
- Gateway auto-restarts after crashes (LaunchAgent)
- Sessions survive gateway restart
- Channel reconnection (Telegram) is automatic

---

## 6. 🎯 Recommended Priority Actions (Mr D)

| # | Action | Cost | Impact |
|---|--------|------|--------|
| 1 | Enable macOS auto-start after power failure | Free | Prevents manual reboot |
| 2 | Get a small UPS (650VA) for the Mac mini | ~R1,200 | 20-30 min runtime through load shedding |
| 3 | Set up fred's GitHub repo | Free | Offsite backup for all my files |
| 4 | Set up daily cron backup to GitHub | Free | Never lose more than 1 day of work |
| 5 | Eventually: VPS for WhatsApp server (R70–150/mo) | Low | No more tunnel issues |

---

**In short:** I'm already pretty resilient (plain text files, no databases). A R1,200 UPS and a free GitHub repo would make me near-bulletproof. I've documented everything above so any session on any channel picks up right where we left off. 🚀
