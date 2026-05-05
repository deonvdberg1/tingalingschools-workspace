# Social Media Automation — Persistent Access Setup Plan

## Problem
Social platforms detect automated login attempts from new devices and block with security challenges (challenge_required, 2FA, anti-bot). This happens for ~72h after account creation or new device login.

## Permanent Solution

### 1. Persistent Browser Profile ✅
- Dedicated Chrome profile at `/Users/deonvandenberg/.openclaw/browser/openclaw/user-data`
- Already exists and has Facebook/Instagram cookies
- Once logged in from the Mac, sessions persist across restarts
- **Needs:** One-time manual login from Mac for each platform

### 2. Instagram API Session 🔄
- Use `instagrapi` with saved session file (`ig_session.json`)
- Once logged in successfully, session tokens save locally
- Future API calls reuse the session — no challenge
- **Needs:** One successful login to generate the session file

### 3. Challenge Handler (Email-based)
- When Instagram fires a challenge, it sends code to info@tingalingschools.com
- I can check the email inbox automatically and extract the code
- Then complete the challenge → save session → done

### 4. Ironing Out Chrome Connection
- OpenClaw browser runs on port 18800 with CDP
- I connect to it via Playwright for all browser automations
- Need to stabilize the connection (was dropping earlier)

## Step-by-Step Setup (when you're at the Mac, ~15 min)

1. **Open Instagram in the browser** — log in, approve the verification on your phone
   → I save the session → done forever

2. **Run the API login once** while you're here to approve any challenge
   → I save the session token → done forever

3. **Test Facebook posting** — navigate to the page composer, let me handle the post
   → Works from then on

## Post-Setup Flow (daily use)
- I check the saved sessions are valid
- Compose post → upload → publish
- If session expired, notify you to refresh login
