# Heartbeat Tasks

## Periodic Checks

- [ ] **Email** — Check for urgent unread (not yet configured — needs account)
- [ ] **Calendar** — Check upcoming events (not yet configured — needs integration)
- [ ] **Weather** — Quick morning check if Mr D might go out

## Session Health

- **Session file:** `ig_playwright_state.json` (cookies across IG/FB/TT)
- **Fallback tokens:** `.session_tokens_fallback.json` (manual recovery if state corrupts)
- **Persistent profile:** `ig_profile/` (auto-login, survives restarts)
- **Recovery tool:** `python3 recover_sessions.py` (rebuilds from fallback)
- **Health script:** `python3 check_sessions.py`
- **Auto-recovery:** `python3 auto_recover.py` — fixes Playwright, Python, sessions after updates
- **Auto-refresh:** Cron **daily 8AM** — checks & auto-recovers all systems
- **Expiry check:** Cron **1st of month 9AM** — warns 30 days before cookie expiry
- **Keep awake:** launchd agent `com.openclaw.keepawake` prevents sleep
- **Expiry:** Instagram sessionid ~364d | Facebook c_user ~365d | TikTok sid_tt ~180d

### If a session fails:
1. Run `python3 check_sessions.py` to see what's broken
2. Run `python3 recover_sessions.py` if state file is corrupted
3. Launch browser with saved profile to auto-refresh cookies

## Shared Context (Telegram ↔ WebChat Sync)

- **Current task:** `memory/current_task.md` — read this on session start
- **Context tool:** `python3 context.py --read` to see current state
- **History:** `memory/task_history.md` — rolling log of all major actions
- **Update rule:** After every significant action, update the context file
- **Channel switch:** Switch freely between Telegram and WebChat — context carries over

## General

- If >8 hours since last check-in, send a brief update
- Quiet hours 23:00–07:00 SAST — only interrupt for genuine urgency
