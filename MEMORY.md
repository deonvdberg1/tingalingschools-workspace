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

### Website (Next)
- tingalingschools.com needs move from IONOS to Render
- Get ZIP from IONOS → push to GitHub → deploy on Render free tier
