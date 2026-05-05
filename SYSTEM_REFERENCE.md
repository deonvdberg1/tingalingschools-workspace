# Ting-A-Ling Schools — System Reference

## Overview

This document is the master reference for the entire digital infrastructure.
All accounts, tools, procedures, and recovery steps in one place.

---

## 1. Account Index

### Email (Primary Hub)
| Field | Value |
|-------|-------|
| Address | info@tingalingschools.com |
| Access | gog CLI (OAuth, no password needed) |
| Recovery | Google account recovery via phone |
| Linked | Instagram, TikTok, GitHub |

### Telegram (Communication Channel)
| Field | Value |
|-------|-------|
| Bot ID | 8510041285 |
| Mr D's User ID | 8248125738 |
| Config | OpenClaw gateway `channels.telegram` |
| Recovery | Re-pair via OpenClaw if needed |
| Note | No session to maintain — bot-based, always on |

### Social Media
| Platform | Handle/Page | Login Method | Session Expiry |
|----------|-------------|-------------|----------------|
| Instagram | @tingalingpreprimary | Browser profile + cookies | ~364 days |
| Facebook | /tingalingpreprimaryschool | Browser profile + cookies (c_user) | ~365 days |
| TikTok | @tingalingpreprimary | Browser profile + cookies (sid_tt) | ~180 days |

### GitHub
| Field | Value |
|-------|-------|
| Account | deonvdberg1 |
| Repo | tingalingschools-workspace (private) |
| Auth | SSH key (ed25519) |
| SSH key location | ~/.ssh/id_ed25519_github |
| Backup encryption | recover_from_github.py |

---

## 2. File System

### Workspace Directory
`/Users/deonvandenberg/.openclaw/workspace/`

### Critical Files
| File | Purpose | Safety |
|------|---------|--------|
| `ig_playwright_state.json` | All session cookies (173) | 🔒 Excluded from git |
| `ig_profile/` | Full browser profile (auto-login) | 🔒 Excluded from git |
| `credentials.json` | All account passwords | 🔒 Excluded from git |
| `.session_tokens_fallback.json` | Critical session tokens | 🔒 Excluded from git |
| `.session_backup_github.enc` | Encrypted session backup | ✅ **On GitHub** |
| `.ig_state_backup.json` | State file backup | 🔒 Excluded from git |
| `check_sessions.py` | Daily health check | ✅ On GitHub |
| `recover_sessions.py` | Rebuild state from fallback | ✅ On GitHub |
| `recover_from_github.py` | Full disaster recovery | ✅ On GitHub |
| `save_sessions.py` | Save all platform sessions | ✅ On GitHub |
| `system_audit.py` | Full infrastructure audit | ✅ On GitHub |
| `post_tiktok.py` | TikTok video poster | ✅ On GitHub |
| `ig_tools.py` | Instagram API tool | 🔒 Uses credentials |
| `SESSION_PROCEDURE.md` | Setup steps for new accounts | ✅ On GitHub |

### Posting Tools
| Tool | Platform | Type | How |
|------|----------|------|-----|
| `post_tiktok.py video.mp4 "caption"` | TikTok | Video | TikTok Studio upload |
| `ig_post.py photo img.jpg "caption"` | Instagram | Photo | Playwright browser |
| `ig_post.py carousel img1.jpg img2.jpg --caption "..."` | Instagram | Carousel | Playwright browser |
| `ig_tools.py post img.jpg "caption"` | Instagram | Photo | instagrapi API |
| `post_tip_tuesday.py` | IG+FB | Carousel | Combined script |

---

## 3. Automation & Cron

### Scheduled Tasks
| Job | When | What it does |
|-----|------|-------------|
| `social-session-health` | Daily 8AM | Checks all platforms logged in |

### System Services
| Service | What it does | Status |
|---------|-------------|--------|
| `com.openclaw.keepawake` | Prevents Mac from sleeping | ✅ Active |

---

## 4. Disaster Recovery

### If the Mac dies or disk corrupts:

**Step 1: Get a new Mac**
Set up macOS, install OpenClaw.

**Step 2: Clone the repo**
```bash
git clone git@github.com:deonvdberg1/tingalingschools-workspace.git
```

**Step 3: Install dependencies**
```bash
pip3 install playwright cryptography browser-cookie3
python3 -m playwright install chromium
```

**Step 4: Recover sessions**
```bash
python3 recover_from_github.py
```
This decrypts `.session_backup_github.enc` and rebuilds all session files.

**Step 5: Verify**
```bash
python3 system_audit.py
```

**Step 6: If any platform fails**
Login once via Chrome → run `python3 save_sessions.py` → sessions saved permanently.

### If only sessions expire (long-term):
- Run `check_sessions.py` daily (automated)
- Cron warns 30 days before expiry on the 1st of each month
- Browser auto-refreshes cookies on visit

---

## 5. Adding a New Account (Future-Proofing)

Follow `SESSION_PROCEDURE.md` for every new social media/online account:

1. Save credentials to `credentials.json`
2. Mr D logs in ONCE via Chrome
3. Extract cookies with browser_cookie3
4. Save to `ig_playwright_state.json`
5. Update fallback tokens
6. Run `system_audit.py` to verify
7. Create a posting script
8. Update this reference

---

## 6. Credentials Reference

Located in `credentials.json` (not on GitHub).

| Account | Email | Notes |
|---------|-------|-------|
| Instagram | info@tingalingschools.com | Hashed password |
| TikTok | info@tingalingschools.com | Hashed password |
| Facebook | tingalingpreprimaryschool@gmail.com | Hashed password |
| Gemini | info@tingalingschools.com | API key stored |
| Email | info@tingalingschools.com | gog OAuth (no password needed) |

---

## 7. Key Principles

1. **Login once** — Mr D logs in via Chrome. I do the rest.
2. **Backup everything** — Sessions, scripts, procedures all backed up.
3. **Never re-login** — If a session dies, recover from backup first.
4. **Document always** — Every new account follows SESSION_PROCEDURE.md.
5. **Test regularly** — Daily cron checks all systems.

---

_Last updated: 2026-05-05 | Maintained by Mr. Cool_
