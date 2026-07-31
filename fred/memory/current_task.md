# Current Task — Master Context

**Last updated:** 2026-07-31 12:17 SAST
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

## 🔴 ACTIVE: Ting-A-Ling Website — Apply Now Flow Fix (2026-07-31)

**Problem:** tingalingschools.com Apply Now buttons submit to a DEAD Supabase backend (`uuisorsrhtiaqvvpgndp.supabase.co` → NXDOMAIN — project deleted). Applications fail to save.

**Decision:** Replace with Google Apps Script web app → appends to "Tingaling Applications" spreadsheet + emails info@tingalingschools.com + sends parent confirmation email. Code READY at `website/supabase/functions/notify-application/appscript_handler.gs`.

**Blocker:** Apps Script API cannot be enabled on GCP project `242592290344` (the "autoeffortless" project behind gog's OAuth client) — it's owned by another Google account (set up 29 May during AutoEffortless email setup), NOT info@tingalingschools.com. Mr D gets permission denied.

**⏳ WAITING ON MR D (either):**
1. **Fast path:** Create script manually at https://script.google.com (signed in as info@tingalingschools.com) → New project → paste code from `appscript_handler.gs` → Deploy → Web app → Execute as: Me → Who has access: Anyone → send me the `/exec` URL.
2. **Alternative:** Create fresh GCP project under school account + new OAuth client → I do everything programmatically forever.

**MY NEXT STEPS (once I have the /exec URL):**
1. Rewire `website/src/pages/Apply.jsx` to POST to the Apps Script URL (use text/plain body to avoid CORS preflight)
2. Rebuild (`npm run build`) + deploy to GitHub Pages (repo: deonvdberg1/tingalingschools-workspace)
3. Test end-to-end: row in spreadsheet + email to school + confirmation to parent

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

1. 🔴 **Finish Apply Now fix** — get /exec URL from Mr D → rewire Apply.jsx → rebuild → deploy → test
2. 🟡 **Cloudflare cache purge** — Mr D action
3. 🟢 **Phase 2: Billing & Subscriptions** — Stripe integration
4. 🟢 **Parent opt-in campaign**
5. 🟢 **Real client onboarding** — Mr D's sales intros
6. 🟢 **UPS purchase** — R1,293 APC 650VA (Takealot)
