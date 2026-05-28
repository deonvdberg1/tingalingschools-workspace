# 🚨 AUTOEffORTLESS — Full Risk Assessment
## Date: 2026-05-28 18:30 SAST
## Client: Ting-A-Ling Schools (pre-launch)

### Risk Scale
| Score | Rating | Meaning |
|:-----:|:------:|---------|
| 16-25 | 🔴 CRITICAL | Immediate action required before launch |
| 10-15 | 🟡 HIGH | Must mitigate within 1 week |
| 5-9 | 🟠 MEDIUM | Monitor, fix within 2-4 weeks |
| 1-4 | 🟢 LOW | Acceptable risk, track |

---

## 1. 🔴 INFRASTRUCTURE & RELIABILITY

| # | Risk | Likelihood | Impact | Score | Status | Mitigation |
|---|------|:----------:|:-----:|:-----:|:------:|------------|
| 1.1 | **No UPS — load shedding kills the server** | 5 (daily in SA) | 5 (bot offline until power returns) | **25 🔴** | ❌ Unmitigated | Buy APC 650VA (R1,293, Takealot). Auto-restart works on power restore but downtime = every outage |
| 1.2 | **Internet outage at premises** | 3 (SA fixed-line) | 4 (bot completely offline) | **12 🟡** | ⚠️ Partial | Auto-reconnects when internet returns. No backup connection (4G failover) |
| 1.3 | **Mac mini hardware failure** | 1 (M4 reliability) | 5 (full rebuild needed) | **5 🟠** | ⚠️ Partial | Hourly git backups. No spare hardware. Could redeploy to cloud if needed |
| 1.4 | **Disk fills up from logs** | 2 (rotation in place) | 3 (server crash on full disk) | **6 🟠** | ✅ Mitigated | Log rotation at 1MB. 64Gi free. Monitoring alerts at 85% |
| 1.5 | **Single point of failure — no redundancy** | 3 (any hardware issue) | 5 (everything on one Mac mini) | **15 🟡** | ❌ Unmitigated | Everything on one device. No secondary server, no cloud failover |

---

## 2. 🔴 META / WHATSAPP RISKS

| # | Risk | Likelihood | Impact | Score | Status | Mitigation |
|---|------|:----------:|:-----:|:-----:|:------:|------------|
| 2.1 | **250 messages/day limit hit** | 4 (once parents start using it) | 3 (bot stops responding until next day) | **12 🟡** | ⚠️ Monitor | Meta auto-increases as quality stays GREEN. Need to hit limit and wait |
| 2.2 | **Phone number banned / flagged** | 2 (following policy) | 5 (number lost permanently) | **10 🟡** | ✅ Low risk | Opt-out handling in place. No spam. School-appropriate content only |
| 2.3 | **Display name revoked** | 2 (already approved once) | 4 (can't send business messages) | **8 🟠** | ⚠️ Monitor | Name was already reviewed and approved. Keep quality GREEN |
| 2.4 | **Policy change — Meta shuts down Cloud API** | 1 (unlikely) | 5 (platform dead) | **5 🟠** | ❌ Unmitigated | No alternative platform. Would need to rebuild on Telegram/Signal |
| 2.5 | **Primary Business Location still greyed out** | 3 (not urgent now) | 3 (may block future WABA features) | **9 🟠** | ⚠️ Monitor | Won't stop current operation. Fix when we create AutoEffortless WABA |

---

## 3. 🔴 TECHNICAL & CODE

| # | Risk | Likelihood | Impact | Score | Status | Mitigation |
|---|------|:----------:|:-----:|:-----:|:------:|------------|
| 3.1 | **AI hallucinates — makes up information** | 3 (temperature=0.1, KB-only prompt) | 4 (wrong info to parents, school reputation) | **12 🟡** | ✅ Partially | Strict KB-only rules. Temperature 0.1. But model can still make mistakes — needs ongoing testing |
| 3.2 | **Knowledge base out of sync** | 3 (dashboard writes to wrong file) | 3 (agent has stale info) | **9 🟠** | ⚠️ Needs watch | Two KB files exist (whatsapp-server + tingai workspace). Agent reads its workspace copy, not the dashboard-written copy. Must manually sync |
| 3.3 | **Agent conversation history grows unbounded** | 2 (limit set to 20) | 2 (slow performance) | **4 🟢** | ✅ Mitigated | MAX_HISTORY=20, file size monitored |
| 3.4 | **Unhandled message types (images, audio, location)** | 4 (parents will send these) | 2 (silently dropped, no error) | **8 🟠** | ❌ Unhandled | Code only handles `msg.type === 'text'`. Non-text messages are silently ignored with no feedback to user |
| 3.5 | **Rate limiter bucket memory leak** | 1 (cleanup runs every 60s) | 2 (minor memory growth) | **2 🟢** | ✅ Mitigated | Cleanup interval in place |
| 3.6 | **Gateway / DeepSeek API key expires or runs out of credit** | 2 | 5 (AI agent stops working) | **10 🟡** | ⚠️ Monitor | API key is stored in gateway config. No balance monitoring in place |

---

## 4. 🔴 AI-SPECIFIC RISKS

| # | Risk | Likelihood | Impact | Score | Status | Mitigation |
|---|------|:----------:|:-----:|:-----:|:------:|------------|
| 4.1 | **Agent doesn't know current time** | 5 (confirmed bug) | 2 (wrong greeting) | **10 🟡** | ✅ Fixed today | Added rule: never use time-based greetings |
| 4.2 | **Agent forgets contact info in fallback** | 4 (was happening) | 3 (parents can't reach office) | **12 🟡** | ✅ Fixed today | Hard rule added: ALWAYS include phone+email when saying "contact the office" |
| 4.3 | **Conversation context lost mid-chat** | 3 (was happening before fix) | 3 (agent restarts greeting) | **9 🟠** | ✅ Fixed today | Conversation history persisted and included in every agent call |
| 4.4 | **Agent sounds like an AI / identifies as bot** | 2 (was happening) | 3 (parents feel it's robotic) | **6 🟠** | ✅ Fixed today | SOUL.md + AGENTS.md updated — natural tone, no AI self-ID |
| 4.5 | **Model gives wrong fee amounts** | 2 (temperature low, KB strict) | 5 (parents get wrong pricing) | **10 🟡** | ⚠️ Mitigated | Temperature 0.1. KB-only. But still a risk — test fee questions regularly |
| 4.6 | **Model costs grow unexpectedly** | 2 (only Mr D triggers AI) | 3 (higher API bill) | **6 🟠** | ✅ Mitigated | Admin whitelist limits AI access. Others get templates. When rolling out to more users, costs scale directly with usage |

---

## 5. 🔴 SECURITY

| # | Risk | Likelihood | Impact | Score | Status | Mitigation |
|---|------|:----------:|:-----:|:-----:|:------:|------------|
| 5.1 | **Credentials leaked via .env file** | 1 (local machine, no remote access) | 5 (full Meta API access) | **5 🟠** | ✅ Mitigated | .env is gitignored. Machine is local only. No remote SSH |
| 5.2 | **Conversation data contains personal info** | 5 (parents share names, phone numbers) | 3 (POPIA compliance) | **15 🟡** | ⚠️ Aware | Conversation logs contain parent names + phone numbers. No encryption at rest. No data deletion policy enforced |
| 5.3 | **Unauthorized access to dashboard** | 2 (auth in place) | 4 (can see all clients) | **8 🟠** | ✅ Mitigated | JWT-based auth. Roles enforced. Token in localStorage |
| 5.4 | **Webhook endpoint exposed publicly** | 3 (it's the internet) | 2 (rate-limited, GET is verify-only, POST requires Meta format) | **6 🟠** | ✅ Mitigated | Rate limiting at 20 req/s. POST only processes Meta-formatted payloads |

---

## 6. 🔴 BUSINESS & LEGAL

| # | Risk | Likelihood | Impact | Score | Status | Mitigation |
|---|------|:----------:|:-----:|:-----:|:------:|------------|
| 6.1 | **No company registered yet** | 1 (CIPC lodged) | 5 (can't sign contracts, accept payments) | **5 🟠** | ⏳ Pending | CIPC lodged. Waiting on approval |
| 6.2 | **No payment processor** | 1 (waiting on company) | 5 (can't charge clients) | **5 🟠** | ⏳ Pending | Stripe/PayFast after company reg |
| 6.3 | **Ting-A-Ling hasn't signed anything** | 3 (first client) | 4 (no contract = no legal recourse) | **12 🟡** | ❌ Unmitigated | No signed agreement. Need at minimum a service agreement before charging |
| 6.4 | **No SLA / uptime guarantee** | 3 (one device, no UPS) | 3 (can't promise 99.9%) | **9 🟠** | ⚠️ Aware | Must set expectations: best-effort uptime, no SLA, no compensation for downtime |
| 6.5 | **GDPR / POPIA data compliance** | 4 (processing parent data) | 4 (penalties up to R10M) | **16 🔴** | ❌ Not addressed | Conversations stored in plain JSON. No data retention policy. No user data deletion mechanism exposed to clients. POPIA requires: lawful processing, data subject access, deletion rights |

---

## 7. 🔴 OPERATIONAL

| # | Risk | Likelihood | Impact | Score | Status | Mitigation |
|---|------|:----------:|:-----:|:-----:|:------:|------------|
| 7.1 | **No monitoring alert when bot goes down** | 3 (healthcheck exists but no notification) | 3 (hours of unknown downtime) | **9 🟠** | ⚠️ Partial | Healthcheck runs but only logs to file. No SMS/email/WhatsApp alert to Mr D |
| 7.2 | **No rollback plan if a deploy breaks** | 2 (git has full history) | 3 (git revert + restart) | **6 🟠** | ✅ Mitigated | Git revert + restart server. ~5 min recovery |
| 7.3 | **No documented process for client onboarding** | 3 (only I know the process) | 3 (can't delegate) | **9 🟠** | ❌ Not documented | Only I (Fred) know how to add a client. No written process for Mr D to follow |
| 7.4 | **MAC address / hardware dependent** | 2 | 4 (server tied to this Mac mini) | **8 🟠** | ⚠️ Aware | TUNNEL_ID, credentials, ports, all bound to this machine. Moving to another machine = full reconfig |

---

## 🔴 SUMMARY: TOP 5 MUST-FIX BEFORE MONDAY

| # | Risk | Score | Action Needed |
|---|------|:-----:|--------------|
| 1 | **No UPS — load shedding kills bot** | **25** | Buy APC 650VA (R1,293, Takealot) |
| 2 | **POPIA data compliance** | **16** | Add data deletion flow + privacy notice to conversations |
| 3 | **Single point of failure** | **15** | Accept for now (one Mac mini). Mitigate with UPS |
| 4 | **Conversation data contains personal info** | **15** | Add note in privacy policy. Consider adding auto-delete after 90 days |
| 5 | **No signed agreement with Ting-A-Ling** | **12** | Draft a simple service agreement before any payment changes hands |

## 🟢 WHAT'S ALREADY MITIGATED THIS SESSION
- Time-based greeting bug → Fixed ✅
- Contact info missing from fallback → Fixed ✅
- Conversation persistence → Fixed ✅
- AI self-identifying → Fixed ✅
- Rate limiting → Done ✅
- Env validation → Done ✅
- Named tunnel → Done ✅
- Structured logging → Done ✅

## 📊 RISK MATRIC
```
                Impact →
                1    2    3    4    5
            ┌─────────────────────────
            1 │      3.5      6.3  5.3
            2 │ 3.4  3.6        2.4  5.1
Likelihood  3 │      7.3  2.5  1.2  7.4
            4 │ 6.4  7.1  3.1        6.5
            5 │ 4.4  1.1        5.2
```

**Overall risk posture:** 🟡 HIGH — Go-lift this weekend for testing is acceptable, but do not start charging clients until the 🔴 items are resolved.
