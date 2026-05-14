# Current Task — Master Context

**Last updated:** 2026-05-14
**Channels active:** WebChat, Telegram (@Fredtheautoguy_bot)
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
- **Mr D's role:** Sales & client introductions
- **Fred's role:** All delivery, tech, products
- **Competition gap:** Everyone sells a tool. We sell a managed service.

---

## 🟢 Demo Client: Ting-A-Ling Schools (D&S Comp)

- **Legal entity:** D&S Comp (CIPC-registered)
- **Trading as:** Ting-A-Ling Schools (incl. Ting-A-Ling Pre Primary School)
- **Location:** Richards Bay, SA
- **Purpose:** Demo client for AutoEffortless WhatsApp automation

### WhatsApp API Setup Status

| Step | Status | Notes |
|------|--------|-------|
| ✅ Meta Business Portfolio | Done | Created via Instagram route, named D&S Comp |
| ✅ Meta Business name | Done | Updated to D&S Comp |
| ⏸️ Meta Business Verification | Skipped | Meta said "not needed" for this use case |
| ✅ Meta Developer Account | Done | Mr D has access |
| ✅ WhatsApp App created | Done | "Ting-A-Ling Connect" |
| ✅ API Credentials | Captured | Token, Phone ID, WABA ID |
| ✅ Integration Server | Built & running | Node.js, port 3000, on Mac mini |
| ✅ Public Tunnel | Live (serveo) | For webhook callbacks |
| ❌ Webhook Verification | Failed | Meta can't reach tunnel URL — needs alternative approach |
| 🔴 SIM bought | Done | Not yet registered |
| 🔴 Automation flow | Not built | Waiting for webhook |
| 🔴 Live testing | Not started | |
| 🔴 Case study | Not started | |

### Phone Number Details
- New prepaid SIM bought (Mr D has it)
- Do NOT install WhatsApp on it — register directly via Meta API later
- Old private WhatsApp number stays as-is

### Server Details
- **Path:** `/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/`
- **Running:** Yes, port 3000
- **Tunnel:** serveo → `https://f11021d87d9ebc43-156-155-24-201.serveousercontent.com`
- **Webhook URL:** `/webhooks/whatsapp`
- **Verify Token:** `tingaling-schools-verify-2026`
- **Dashboard:** `/dashboard` (shows conversations)
- **API creds stored in:** `.env` file in server directory

### WhatsApp Cloud API Credentials
- **WABA ID:** 1124652154068427
- **Phone Number ID:** 1020592707198678
- **Token:** Stored in `/whatsapp-server/.env` (temporary — expires in 24h, needs permanent token)

---

## 🟢 Telegram Integration (Just Set Up)

- **Bot username:** @Fredtheautoguy_bot
- **Token:** Updated in openclaw.json (gateway restart done)
- **Gateway restart:** Scheduled, should be live
- **Action needed:** Mr D needs to DM the bot on Telegram to pair
- **Config:** `channels.telegram.enabled: true`, dmPolicy: pairing

---

## 🟢 Infrastructure — Mr Cool Inquiry

- **Sub-agent spawned:** YES (label: contact-mr-cool-infra)
- **Purpose:** Ask Mr Cool about his security, memory persistence, backup strategy, power outage handling
- **Status:** Waiting for response
- **When response arrives:** Document in `projects/mr-cool-infrastructure.md`

---

## 💰 Costs

**WhatsApp demo plan (no BSP):**
- Meta message fees: ~R200–500/mo (mostly free service conversations)
- SIM: R10–R99 (one-time)
- **Total: ~R200–500/mo**

**AutoEffortless pricing model:**
- 3 tiers: R3k–R8k/month + R5k–R12k setup
- Digital products: R99–R199
- Target: R200k/month by Month 6

---

## 📋 Immediate To-Do

### Mr D:
1. ✅ ~~Create Meta Business Manager~~ Done
2. ✅ ~~Create Telegram bot~~ Done - DM @Fredtheautoguy_bot to test
3. ❌ Get Telegram pairing approved (DM the bot)
4. 🔴 Try webhook verification again when ready
5. 🔴 Keep SIM ready for registration

### Fred:
1. 🔄 Waiting for Mr Cool's infrastructure response
2. 🔴 Need better tunnel solution for WhatsApp webhooks (try cloudflared or ngrok auth)
3. 🔴 Once webhook works: register SIM, build auto-reply flow
4. 🔴 Make token permanent after webhook is set up
