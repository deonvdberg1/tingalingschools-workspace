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
- **Auto-refresh:** Cron **daily 8AM** — checks & refreshes all sessions
- **Expiry check:** Cron **1st of month 9AM** — warns 30 days before cookie expiry
- **Keep awake:** launchd agent `com.openclaw.keepawake` prevents sleep
- **Expiry:** Instagram sessionid ~364d | Facebook c_user ~365d | TikTok sid_tt ~180d

### If a session fails:
1. Run `python3 check_sessions.py` to see what's broken
2. Run `python3 recover_sessions.py` if state file is corrupted
3. Launch browser with saved profile to auto-refresh cookies

## General

- If >8 hours since last check-in, send a brief update
- Quiet hours 23:00–07:00 SAST — only interrupt for genuine urgency
