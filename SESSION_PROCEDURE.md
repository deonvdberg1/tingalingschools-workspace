# Social Media Session Setup Procedure
Follow this for EVERY new social media account to ensure permanent access.

## Steps

### 1. Save Credentials
- Add to `credentials.json` with proper structure
- Add login info to `TOOLS.md`

### 2. Login via Chrome (Mr D logs in ONCE)
- `open -a "Google Chrome" "https://platform.com/login"`
- Mr D logs in (handle 2FA, security challenges)
- I extract cookies: `python3 -c "from browser_cookie3 import chrome"`

### 3. Save to Playwright State
- Add cookies to `ig_playwright_state.json`
- Update fallback: `python3 -c "..."` to extract session tokens
- Save to `.session_tokens_fallback.json` and `.session_tokens_compact.json`

### 4. Verify Cold-Start Access
- `python3 verify_sessions.py`
- Must pass without ANY login prompts

### 5. Create Posting Tool
- Script in `post_{platform}.py`
- Uses saved state + profile for auto-login

## Files That Must Exist

| File | Purpose | Auto-recovery? |
|------|---------|---------------|
| `ig_playwright_state.json` | Main session state | Rebuild from fallback |
| `.session_tokens_fallback.json` | Critical tokens backup | Yes |
| `.session_tokens_compact.json` | Quick-reference tokens | Yes |
| `.ig_state_backup.json` | State file backup | Yes |
| `ig_profile/` | Full browser profile | No (manually recreate) |

## Cron Jobs

| Job | When | What |
|-----|------|------|
| `social-session-health` | Daily 8AM | Check all platforms logged in |
| `session-expiry-reminder` | 1st of month 9AM | Warn if cookies <30 days left |

## Troubleshooting

**"Not logged in":** Run `python3 recover_sessions.py` then `python3 check_sessions.py`

**"State file missing":** Copy from `.ig_state_backup.json` or rebuild from `.session_tokens_fallback.json`

**"All sessions dead":** Worst case — need Mr D to log in once via Chrome again. Follow Step 2 above.
