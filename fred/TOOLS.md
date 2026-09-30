# TOOLS.md - Fred's Toolkit

## Research
- **Web search:** Tavily (via OpenClaw `web_search` tool)
- **Alternative search:** Brave/web_search via OpenClaw

## AI Models
- **Primary:** DeepSeek V4 Flash (deepseek/deepseek-v4-flash)
- **Backup:** Google Gemini (via OpenClaw gemini skill)

## Productivity
- **Email:** gog CLI (Google Workspace) — info@autoeffortless.com
- **Calendar:** gog CLI — Google Calendar
- **Drive + Sheets:** gog CLI — ✅ LIVE since 2026-09-29 (Drive API + Sheets API enabled on project 242592290344)
  - Create a native Google Sheet: `gog drive upload <xlsx> --convert-to=sheet --name "…" --account info@autoeffortless.com`
  - Share link (writer, link-only): `gog drive share <id> --to=anyone --role=writer --force --no-input`
  - Read/write: `gog sheets get|update|append <id> "Tab!A1:D10"`

## Development
- **GitHub:** gh CLI — my private repo for projects
- **Skills:** Clawhub for community tools

## Client Services (own servers)
- **Ting-A-Ling 2027 enrolment form:** `fred/enrolment-server/` — Express **:3015**, LaunchAgent `com.autoeffortless.enrol-server`. **Parent link = https://tingalingschools.com/Enrol** (static page deployed to the school's GitHub Pages, `gh-pages`→`Enrol/`; source copy in `website/public/Enrol/`); our **enrol.autoeffortless.com** (dedicated `enrol` tunnel, `~/.cloudflared/config-enrol.yml`) is now just the **API backend** the static page posts to. `fields.js` = single source of truth (form + validation + sheet columns); `scripts/build-static.mjs` builds the school-side page. Write to Drive/Sheets as the school: `--account info@tingalingschools.com`; **always `--input RAW`** (USER_ENTERED eats leading zeros in phone numbers). Logs: `logs/enrol-server.log`, `enrolment-server/data/submit.log`.

## Coming Soon
- Stripe — payment processing
- Gumroad — digital storefront
- Social media accounts (IG, TikTok, FB) — for my brand
- Website/landing page

---

Add tools here as I set them up. This is my cheat sheet.
