# Current Task — Master Context

**Last updated:** 2026-08-03 09:10 SAST
**Founder:** Mr D (Richards Bay, SA)
**Agent:** Fred — independent AI entrepreneur, CEO of AutoEffortless

---

## 🏢 Business: AutoEffortless

- **Brand:** AutoEffortless (autoeffortless.com)
- **Tagline:** Effortless Business Communication
- **Offering:** Managed AI assistant for WhatsApp + Instagram
- **Pricing:** R3k–R8k/month + R5k–R12k setup (3 tiers)
- **Digital products:** 3 ready (R99–R199)
- **Revenue target:** R200k/month by Month 6
- **Strategy:** Service-led, product-backed, SaaS-emergent
- **Mr D:** Sales & client intros. **Fred:** All delivery, tech, products.

---

## ✅ DONE: Ting-A-Ling Apply Now Flow Fix (2026-08-03)

**Problem:** tingalingschools.com Apply Now → dead Supabase backend (NXDOMAIN). Applications failed.
**Fix:** Google Apps Script web app (deployed by Mr D under school account, 5-min path) → spreadsheet row + school email + parent confirmation email. **All verified live:**
- Apps Script URL: `https://script.google.com/macros/s/AKfycbxNtZEplTFGRKz7NzvV0o2SBQHAufWvbV0MHMczAjodgp-gotFCToF7KU7yGqh-NsJLxw/exec`
- Handler code: `website/supabase/functions/notify-application/appscript_handler.gs` (deployed copy in school account)
- `Apply.jsx`: single POST to Apps Script (text/plain, avoids preflight; sends raw school param)
- Deployed: gh-pages 9aa2921 + main b7d5817 — live bundle `index-DGDoc7kO.js` at tingalingschools.com
- CORS: `access-control-allow-origin: *` on both hops ✅
- Test data: ~8 test rows/emails ("Test Child") — school to delete from "Tingaling Applications" spreadsheet
- Gotcha: curl needs `-d` WITHOUT `-X POST` (Apps Script embeds payload in 302→GET echo hop); `-X POST` returns 405 Drive error page

---

## 🟡 Pending (awaiting Mr D)
- Cloudflare cache purge (app.autoeffortless.com still serves old cached version)
- UPS purchase (R1,293 APC 650VA, Takealot)
- Parent opt-in campaign
- Client #2 onboarding / sales intros
- Phase 2: Billing & Subscriptions (Stripe) — ready to start when signalled

---

## 🔧 Infrastructure (All Self-Recovery via LaunchAgents)

| Feature | Status |
|---------|:------:|
| WhatsApp server (port 3000) | ✅ LaunchAgent auto-restarts |
| Dashboard API (port 3001) | ✅ LaunchAgent auto-restarts |
| Vite dev server (port 5173) | ✅ LaunchAgent auto-restarts |
| Main tunnel (Cloudflared) | ✅ LaunchAgent auto-restarts |
| Tracking tunnel | ✅ LaunchAgent auto-restarts |
| Caffeinate (stay awake) | ✅ LaunchAgent |
| Crontab (watchman, healthcheck, backup) | ✅ Intact |

---

## 📋 What's Next (Next Session)

1. 🟡 **Cloudflare cache purge** — Mr D action (app.autoeffortless.com serves old cached version)
2. 🟢 **Phase 2: Billing & Subscriptions** — Stripe integration (backend done, frontend + live keys needed)
3. 🟢 **Parent opt-in campaign**
4. 🟢 **Real client onboarding** — Mr D's sales intros
5. 🟢 **UPS purchase** — R1,293 APC 650VA (Takealot)

## 2026-08-04 — Visitor tracking: GoatCounter → SELF-HOSTED (COMPLETE, replaces GoatCounter)
- **~14:40:** GoatCounter replaced by self-hosted beacon (commit 2ec3070, "no third-party analytics") — site now posts pageviews/events to `whatsapp.autoeffortless.com/api/site-track` → dashboard API → `site_hits` table (client_id=6) in dashboard-api/data/autoeffortless.db
- Dashboard Site Analytics page reads same DB. Real data flowing (Google visitor 15:41)
- Daily 08:00 report cron (249af5eb) repointed from GoatCounter API → local sqlite query
- GoatCounter account/dashboard (tingaling.goatcounter.com, secrets/goatcounter.env) now unused — tracker removed from site. Free tier, no cost; can delete later if wanted.
