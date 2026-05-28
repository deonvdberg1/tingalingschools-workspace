# 🔧 IMPROVEMENT & MITIGATION ROADMAP
## AutoEffortless — 28 May 2026 21:45 SAST

---

## 🟢 QUICK WINS (I can do in <30 min, no dependencies)

| # | Improvement | Risk Mitigated | Effort | Currently |
|---|-------------|---------------|:------:|:---------:|
| 1 | **WhatsApp health alert** — healthcheck sends message to your phone if bot goes down | You don't know when the bot is offline | 30 min | ❌ No alert |
| 2 | **Non-text message reply** — when someone sends an image/audio, reply "I can only help with text messages" | Parents confused when bot ignores their photo | 15 min | ❌ Silently dropped |
| 3 | **Human handoff notification** — when AI can't answer, send you a WhatsApp alert | Pending enquiries sit unanswered | 30 min | ❌ Not notified |
| 4 | **KB sync fix** — dashboard writes to both KB files so agent always gets latest edits | KB out of sync after dashboard edits | 15 min | ⚠️ Manual sync needed |
| 5 | **Add .env to backup script** — include credentials in the backup snapshot (encrypted backup, not git) | Losing .env = full reconfig | 10 min | ❌ Not backed up |

## 🟡 WORTHWHILE (1-2 hours, meaningful improvement)

| # | Improvement | Risk Mitigated | Effort | Currently |
|---|-------------|---------------|:------:|:---------:|
| 6 | **Dashboard auto-start on boot** — add LaunchAgent for Vite frontend | Dashboard dead after restart | 30 min | ❌ Manual start |
| 7 | **Conversation data monitoring** — dashboard shows message volume, active conversations today | No visibility into bot usage | 1 hr | ❌ No dashboard metrics |
| 8 | **DeepSeek balance check** — daily check on API credit balance | Bot goes silent when credits run out | 30 min | ❌ No monitoring |
| 9 | **Uptime tracking** — simple log of when bot was up/down over time | Can't prove reliability to clients | 1 hr | ❌ No history |

## 🔴 HIGHER EFFORT (needs planning or your input)

| # | Improvement | Risk Mitigated | Effort | Currently |
|---|-------------|---------------|:------:|:---------:|
| 10 | **Deploy dashboard to production URL** — serve under dashboard.autoeffortless.com instead of dev ports | Can't give clients a proper URL | 2-3 hrs | ⚠️ Dev ports only |
| 11 | **Landing page** at autoeffortless.com | No public presence | 2-3 hrs | ❌ Missing (needs your design input) |
| 12 | **Client onboarding documentation** — written process for adding a new client | Only I know the process | 1 hr | ❌ Not documented |
| 13 | **Payment processor (Stripe/PayFast)** | Can't collect revenue | ~1 hr | ❌ Needs your bank details |

## ❌ YOUR ACTION NEEDED

| # | Item | What's Needed | Est. Time |
|---|------|--------------|:---------:|
| A | **UPS purchase** | Buy APC 650VA from Takealot (R1,293) | 10 min |
| B | **PayFast/Stripe signup** | Bank account + company details | 30 min |
| C | **Signed DPA with Ting-A-Ling** | Before charging them | 15 min |
| D | **Landing page direction** | Tone/pricing/CTA decisions | 10 min |

---

## MY RECOMMENDED ORDER

**This evening (if you're up for it):**
1. WhatsApp health alert — so you know if the bot dies overnight
2. Non-text message reply — so testers aren't confused
3. KB sync fix — so your dashboard edits take effect

**This weekend:**
4. Human handoff notification
5. Dashboard auto-start
6. .env backup
7. You: buy UPS

**Monday onwards:**
8. Stripe/PayFast
9. Signed DPA
10. Landing page

Pick the first batch and I'll execute. 🚀
