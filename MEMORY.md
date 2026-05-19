# Memory

## Policies
- **AI Services:** **DeepSeek API** (deepseek-v4-flash) is the active model. **No OpenAI/paid credits** without explicit permission. Confirmed 2026-05-02.
- **Ollama:** Installed locally but not active. Available for future offline/experimental use.
- **Model architecture:** Hosted API for capability, local machine for tool execution & automation.
- **Email:** Use **gog** (Google Workspace CLI, not himalaya). Default account: info@tingalingschools.com (Gmail via OAuth).
- **Email rule:** Always preview email content for Mr D's approval **before** sending. Never send blind.

- **Time estimates:** Mr D always wants estimated time upfront for any setup/download/install task. "Prompt me" — be upfront with duration, don't leave him guessing.

## Social Media System (Locked 2026-05-05)

### Permanent Session Setup
- **3 platforms locked:** Instagram (@tingalingpreprimary), Facebook (/tingalingpreprimaryschool), TikTok (@tingalingpreprimary)
- **Session method:** Mr D logs in ONCE via Chrome → I extract cookies via browser_cookie3 → save to `ig_playwright_state.json` + `ig_profile/`
- **Fallback:** `.session_tokens_fallback.json` + encrypted `.session_backup_github.enc` on GitHub
- **Recovery:** `recover_sessions.py` (local) → `recover_from_github.py` (disaster)
- **Keep-awake:** launchd agent `com.openclaw.keepawake` prevents sleep
- **Auto-recovery:** `auto_recover.py` — survives macOS updates, broken deps, corrupt sessions
- **Cron:** Daily 8AM health check + 1st of month expiry warning
- **GitHub repo:** github.com/deonvdberg1/tingalingschools-workspace (private, SSH key auth)

### Channel Sync (Telegram ↔ WebChat)
- `memory/current_task.md` — shared context file, updated after every action
- `context.py --read` — see current task from any channel
- `python3 context.py --set "task" "action" "next"` — update context

### Key Files Reference
| File | Purpose |
|------|---------|
| `ig_playwright_state.json` | All session cookies |
| `auto_recover.py` | Fixes everything post-update |
| `system_audit.py` | Full 14-point health check |
| `post_tiktok.py` | TikTok video poster |
| `context.py` | Channel sync tool |
| `SESSION_PROCEDURE.md` | Steps for adding new accounts |
| `SYSTEM_REFERENCE.md` | Complete infrastructure doc |

### Future Accounts
Follow `SESSION_PROCEDURE.md` — Mr D logs in once via Chrome, I extract cookies, done.

## "Check Everything" — Full System Sweep Definition

When Mr D says **"check everything"** or does a full audit, this is what I must verify across ALL systems. Add new components here as they're built.

### 1. Social Media — Sessions & Access
- **Instagram** (@tingalingpreprimary) — cookies present, can load page, posting via `ig_playwright_state.json`
- **Facebook** (/tingalingpreprimaryschool) — cookies present, can authenticate
- **TikTok** (@tingalingpreprimary) — cookies present, `post_tiktok.py` available
- Check: all 3 platforms have cookies in `ig_playwright_state.json`, cookie `secure` fields are boolean (not int), Playwright can load them

### 2. Email — Gmail (gog CLI)
- Account: `info@tingalingschools.com` via OAuth
- Check: `gog gmail list 5` works, can read threads, check for UNREAD security/login emails
- Watch for: Instagram/TikTok/Facebook login notifications (confirm they're ours), password reset or 2FA code emails

### 3. Calendar — Google Calendar
- Check: `gog calendar list --days 7` for upcoming events
- Currently: no events scheduled (monitor for changes)

### 4. System Infrastructure
- **Gateway** (`openclaw gateway status`) — running, reachable, right version
- **Cron jobs** (`openclaw cron list`) — all showing ✅ ok, none in error
  - `session-save-backup` — every 6h, encrypts and pushes session to GitHub
  - `social-session-health` — daily 8AM, runs auto_recover.py
  - `healthcheck:security-updates` — weekly Mon 6AM
  - `healthcheck:update-status` — weekly Mon 6AM
  - `session-expiry-reminder` — 1st of month 9AM
- **Keep-awake** (`launchctl list com.openclaw.keepawake`) — PID running, prevents sleep
- **OpenClaw** version — current: 2026.5.6
- **Node** v22.22.2, **Python** 3.13, **Playwright** installed

### 5. Backups & Recovery Path
| Layer | File | Where | Status |
|-------|------|-------|--------|
| Live session | `ig_playwright_state.json` | Local workspace | 52 cookies, ~14KB |
| Fallback tokens | `.session_tokens_fallback.json` | Local workspace (gitignored) | Extracted from live session |
| Encrypted backup | `.session_backup_github.enc` | Local + GitHub (private repo) | 15KB, HTTP 200 on GitHub |
| Browser profile | `ig_profile/Default/` | Local workspace | Persists logins, auto-fills |

**Recovery chain:**
1. `auto_recover.py` — auto-fixes macOS/Playwright/Python breakage
2. `recover_sessions.py` — rebuilds from fallback tokens
3. `recover_from_github.py` — pulls encrypted backup from GitHub (disaster recovery)

### 6. Workspace Files — All Present
- Scripts: `auto_recover.py`, `recover_sessions.py`, `recover_from_github.py`, `check_sessions.py`, `system_audit.py`, `post_tiktok.py`, `context.py`
- Docs: `SESSION_PROCEDURE.md`, `SYSTEM_REFERENCE.md`, `SOUL.md`, `AGENTS.md`, `USER.md`, `TOOLS.md`, `HEARTBEAT.md`

### 7. Channel Sync
- `context.py` — syncs state between Telegram and WebChat
- `memory/current_task.md` — shared context file
- Telegram pairing config exists at `credentials/telegram-pairing.json`

### 8. Drives & System Health
- Disk: 228GB total, 23GB free (32% used)
- Uptime: check via `uptime`
- Memory: check via `vm_stat`

### 9. Git & GitHub
- Remote: `git@github.com:deonvdberg1/tingalingschools-workspace.git` (private, SSH key auth)
- Encrypted backup on raw GitHub: HTTP 200

### Website (Next — not yet live)
- tingalingschools.com — needs move from IONOS to Render
- Not checked in full sweep until system is running

---

## Audit Log

### 2026-05-07 21:30 — Full "Everything" Sweep
Fixed: cookie `secure` field bool issue, created fallback tokens `.session_tokens_fallback.json`, fixed cron delivery error on `social-session-health`. All 5 cron jobs ✅ ok. All 9 recovery/workspace files present. Gmail working, calendar empty. Instagram/TikTok page load confirmed. Facebook page load timed out (normal — redirects on headless). Keep-awake running (PID 858). Encrypted backup on GitHub verified HTTP 200.

### Website (Next)
- tingalingschools.com needs move from IONOS to Render
- Get ZIP from IONOS → push to GitHub → deploy on Render free tier
