# Fred's Memory

This is where I keep what matters.

## Foundations

- **Created:** 2026-05-13 by my founder, Mr D
- **Purpose:** To build and run an independent, AI-driven business
- **Status:** WhatsApp bot live for Ting-A-Ling demo — full two-way messaging operational
- **Founder:** Mr D (Richards Bay, SA)

## Key Decisions

- **Business name:** AutoEffortless
- **Domain:** autoeffortless.com (Ionos)
- **Tagline:** Effortless Business Communication
- **Offering:** Managed AI assistant for WhatsApp + Instagram
- **Pricing:** R3k–R8k/month + R5k–R12k setup (3 tiers)
- **Digital products:** 3 ready (R99–R199)
- **Revenue target:** R200k/month by Month 6
- **Strategy:** Service-led, product-backed, SaaS-emergent
- **Mr D:** Sales & client intros. **Fred:** All delivery, tech, products.
- **Demo client:** Ting-A-Ling Schools (D&S Comp, CIPC-registered)

## WhatsApp API — LIVE ✅

- **Number:** +27 68 754 8390 (Phone ID: 1046384845235600)
- **Old number:** +27 78 836 3027 (deregistered)
- **WABA:** D&S Comp (ID: 1124652154068427 / real: 996583169477166)
- **App:** Ting-A-Ling Connect (ID: 1771774490471649)
- **Server:** Mac mini M4, port 3000 ✅
- **Tunnel:** Cloudflare trycloudflare — auto-updates webhook ✅
- **Auto-reply:** Fees, hours, uniform, absentee, events, contact, enrolment, greetings ✅
- **PDF statements:** Built and tested ✅
- **Display name:** "Tingaling" — ✅ APPROVED (2026-05-21)
- **Quality:** GREEN | Limit: LIMITED (250/day)

## Infrastructure

- WhatsApp server LaunchAgent: ✅ (auto-starts)
- Tunnel auto-setup script: ✅ (auto-updates Meta webhook — **FIXED 2026-05-21** — now uses Node.js to load secrets safely, no more bash env sourcing issues)
- Auto-restart after power loss: ✅ Enabled
- Log rotation: ✅ Set
- Dedup webhook: ✅ Added
- Backups: ✅ Hourly + git push to GitHub private repo
- Health check monitoring: ✅ Created (runs every 2h, silent unless critical)
- UPS: ❌ Not purchased (R1,293 recommended)

## Telegram

- Bot: @Fredtheautoguy_bot — working ✅
- All context saved in workspace files — seamless channel handover ✅

## Risks

- ~~Display name PENDING_REVIEW~~ ✅ Approved
- Primary Business Location greyed out in Meta
- No UPS for load shedding
- No payment method set in Meta
- Human handoff target not decided
- Token could be revoked if Meta re-inspects the app
- Tunnel URL changes on every restart (trycloudflare ephemeral)
- Messaging limit: LIMITED (250/day) — need 1K unique conversations for upgrade

## What's Next

1. **Named tunnel** (Cloudflare Argo or custom domain) — eliminate tunnel URL risk
2. Add payment method to Meta Business Manager
3. Generate backup token and store securely
4. Parent opt-in campaign
5. Demo video polish
6. Real client onboarding

---

*Last updated 2026-05-21 09:30 SAST — API restored, webhook fixed, start-tunnel.sh hardened, health monitoring live.*
