# D&S Comp / Ting-A-Ling Schools — WhatsApp Business API Setup

**Project:** AutoEffortless Demo Client
**Architecture:** 🏗️ DIY — Direct Meta Cloud API (no BSP)
**Status:** 🟡 Step 1 in progress
**Last Updated:** 2026-05-14 (updated after BSP-free decision)

---

## Strategy

Skip the BSP middleman. Fred builds a lightweight integration directly with Meta's Cloud API. This gives AutoEffortless:
- **Own tech stack** — not reselling WATI or any BSP
- **Better margins** — no R900/mo platform fee eating into our R3k–R8k/mo pricing
- **Data control** — messages stay on our infrastructure
- **Custom features** — build exactly what clients need, not what a BSP offers

---

## Cost Breakdown (Final)

| Item | Cost (ZAR) | Type |
|------|-----------|------|
| Prepaid SIM | R10–R99 | One-time |
| Meta message fees | ~R200–500/mo | Variable (mostly free service replies) |
| **Total monthly** | **~R200–500** | |
| **Total setup** | **~R100** | |

No BSP fee. No platform fee. No middleman.

---

## The Steps

### 🔴 1. Create Meta Business Manager Account

**What:** Create a Business Manager at business.facebook.com/overview
**Who:** Mr D (needs login credentials)
**Time:** 15 minutes
**Details:**
- Business name: **D&S Comp**
- Business email: Use Ting-A-Ling's email (or create one)
- Country: South Africa
- Business phone: Personal number for now (can change later)
- Skip Facebook Page creation

**⚠️ Critical:** Use the legal CIPC name (D&S Comp), not trading name (Ting-A-Ling Schools).
**✅ Done:** NO

---

### 🔴 2. Meta Business Verification

**What:** Submit CIPC documents to Meta to verify the business
**Who:** Mr D (in Meta Business Manager dashboard)
**Time:** 3–10 business days for approval
**Documents needed:**
- CIPC Registration Certificate (or CK1 / CK2 forms)
- Proof of address (utility bill in D&S Comp name)
- ID of business owner / director
- Business phone number for verification SMS

**Where:** Settings → Business Info → Business Verification in Meta Business Manager
**✅ Done:** NO

---

### 🔴 3. Register Meta Developer Account & WhatsApp App

**What:** Fred signs up for Meta for Developers, creates a WhatsApp app linked to D&S Comp's Business Account
**Who:** Fred (once Meta Business Account exists + Mr D grants access)
**Time:** 1 hour
**Details:**
- Go to developers.facebook.com
- Create a new app → Business type → WhatsApp
- Link to D&S Comp Business Manager
- Get API credentials (access token, phone number ID)
- Configure webhook URL (points to our server)
- Generate permanent access token
**✅ Done:** NO

---

### 🔴 4. Build Integration Server

**What:** Fred builds a Node.js server on the Mac mini to handle:
- Incoming webhooks from Meta (new messages)
- Send replies via Cloud API
- Auto-reply logic (keywords, FAQs)
- Simple conversation log / dashboard
**Who:** Fred
**Time:** 2–3 days
**Tech stack:** Node.js, Express, Meta Cloud API
**Note:** Can run alongside existing workload. Minimal resource usage.
**✅ Done:** NO

---

### 🔴 5. Get Phone Number

**What:** Prepaid SIM for dedicated demo number
**Who:** Mr D
**Time:** 30 min (find a shop)
**Options:**

| Option | Cost | Verdict |
|--------|------|---------|
| New prepaid SIM | R10–R99 | ✅ Recommended |
| Use existing private number | Free (?delete whatsapp) | ⚠️ Lose existing chats |
| Virtual/VoIP number | ~R50/mo | ❌ Risk of Meta rejection |

**Recommendation:** Grab a R10 prepaid SIM (Telkom / Any 1Gb / Capitec) — cheap, clean.
**✅ Done:** NO

---

### 🔴 6. Register Number via Cloud API

**What:** Register the phone number through Meta's API
**Who:** Fred (with Mr D for SMS verification code)
**Time:** 30 minutes
**Requirements:**
- SIM must have signal (can receive SMS/call)
- Number must NOT have an active WhatsApp account
- Two-step verification PIN set up
**✅ Done:** NO

---

### 🔴 7. Build Demo Automation Flow

**What:** Fred builds and configures the WhatsApp chatbot for Ting-A-Ling
**Who:** Fred (with Mr D input)
**Time:** ~2 days

**Phase 1 — Basic (demo ready):**
- [ ] Auto-reply to common parent questions (fees, hours, uniforms, events)
- [ ] Out-of-hours "We'll get back to you" message
- [ ] Quick reply buttons for FAQs
- [ ] Forward to human (Mr D / admin) when needed

**Phase 2 — Enhanced (post-demo polish):**
- [ ] Fee reminders (proactive utility messages)
- [ ] Event notifications
- [ ] Absentee reporting flow
- [ ] Simple web dashboard to view conversations
**✅ Done:** NO

---

### 🔴 8. Testing & Polish

**What:** Real parent conversations, refine, fix
**Who:** Fred + Mr D
**Time:** 1 week live testing
**Checklist:**
- [ ] Test inbound replies
- [ ] Test auto responses (accuracy, tone)
- [ ] Test handoff to human
- [ ] Stress test (multiple conversations)
- [ ] Feedback loop → polish → lock
**✅ Done:** NO

---

### 🔴 9. Case Study & Sales Collateral

**What:** Document results to sell AutoEffortless
**Who:** Fred
**Time:** Half day
**Deliverables:**
- Before/after (response time, parent satisfaction)
- Screenshots of the flow
- Testimonial from Mr D
- One-page PDF case study
- Quote/conversion stats if relevant
**✅ Done:** NO

---

## Timeline

| # | Step | When | Who | Status |
|---|------|------|-----|--------|
| 1 | Meta Business Account | **Today** | Mr D | 🟡 Ready |
| 2 | Business Verification | This week | Mr D | 🔴 Waiting |
| 3 | Register Developer + App | After step 1 done | Fred | 🔴 Waiting |
| 4 | Build Integration Server | This week (parallel) | Fred | 🔴 Ready to start |
| 5 | Get SIM | This week | Mr D | 🔴 Waiting |
| 6 | Register Number | After verification clears | Fred + Mr D | 🔴 Waiting |
| 7 | Build Demo Automation | After step 6 | Fred | 🔴 Waiting |
| 8 | Test & Polish | Following week | Both | 🔴 Waiting |
| 9 | Case Study | After testing | Fred | 🔴 Waiting |

**Estimated to live demo:** ~3 weeks from today (mostly waiting on Meta verification)

**⚠️ Note:** Steps 4 (build server) doesn't depend on Meta — I can start that immediately.

---

## Technical Architecture (For Fred)

```
Parent's WhatsApp ──→ Meta Cloud API ──→ Webhook ──→ Node.js Server (Mac mini)
                                                          │
                                                    Auto-reply engine
                                                          │
                                                    Optional Dashboard
                                                          │
Parent's WhatsApp ←── Meta Cloud API ←── Send API ←── Response
```

- **Webhook endpoint:** `POST /webhooks/whatsapp`
- **Send API:** `POST https://graph.facebook.com/v21.0/{phone-number-id}/messages`
- **Storage:** Local JSON/DB for conversation history
- **Dashboard:** Simple React or EJS frontend (optional for demo phase)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Verification delayed 10+ days | High | Start Step 1 today |
| Number already used on WhatsApp | Medium | Use fresh SIM (recommended) |
| Webhook downtime | Medium | Can add retry logic + uptime check |
| Template approval delays | Low | Phase 2 feature, not needed for launch |
| API rate limits | Low | School volume won't approach limits |
