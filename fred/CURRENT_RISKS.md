# 🔴 CURRENT RISKS — Prioritised
## AutoEffortless — 28 May 2026 21:45 SAST

---

### CRITICAL — Will cause real problems

| # | Risk | Impact | Mitigation Possible? |
|---|------|--------|:-------------------:|
| 1 | **No health alert** — If the bot goes down at 2am Saturday, you won't know until you check it | Hours of unknown downtime | ✅ I can build WhatsApp alert now |
| 2 | **Non-text messages ignored** — If a parent sends a photo of their child's report, the bot says nothing. Parent thinks it's broken | Confused parents, bad first impression | ✅ I can add a "sorry, text only" reply |
| 3 | **Human handoff = black hole** — When the AI can't answer, it sends "someone will get back to you" but nobody is notified | Enquiries lost forever | ✅ I can forward to your WhatsApp |
| 4 | **KB out of sync** — Editing KB in dashboard writes to one file, but the agent reads a different file | AI uses stale info | ✅ 15-min fix |
| 5 | **No .env backup** — If the SSD dies, all WhatsApp credentials are gone | Full reconfig from Meta dashboards | ✅ 10-min fix |

### MEDIUM — Will cause problems eventually

| # | Risk | Impact | Mitigation Possible? |
|---|------|--------|:-------------------:|
| 6 | **Dashboard frontend won't auto-start** — After a reboot, Mr D can't log into the dashboard until someone runs the Vite command | Annoying, not critical | ✅ 30-min LaunchAgent fix |
| 7 | **DeepSeek credit balance unknown** — If the API key runs out or the account has no credit, the AI stops silently | AI goes dead until you check | ✅ 30-min balance check |
| 8 | **No conversation metrics** — Can't see how many parents messaged, what they asked, how many were answered | No way to prove value to Ting-A-Ling | ✅ 1-hr dashboard widget |
| 9 | **Server log grows unbounded** — It trims at 1MB but there's no archiving | Lose history if we need to debug something | ✅ 30-min log rotation upgrade |
| 10 | **Single .env file** — Only exists on this Mac mini. No copy anywhere else | Disaster recovery is harder than it needs to be | ✅ Add to backup script |

### LOW — Will only hurt if multiple things go wrong

| # | Risk | Impact | Mitigation Possible? |
|---|------|--------|:-------------------:|
| 11 | **Vite dashboard on dev ports** — Can't give clients a proper URL like dashboard.autoeffortless.com | Unprofessional, but works locally | ✅ Deploy to production URL |
| 12 | **No landing page** — autoeffortless.com is blank | No way for potential clients to find/trust us | ✅ Build one-pager |
| 13 | **Client onboarding undocumented** — Only I know the process | If I'm unavailable, you can't add a client | ✅ Write docs |
| 14 | **Conversations.json in memory** — If server crashes before saving, last N messages lost | Minor data loss | ✅ Already mitigated (saves on every message) |

---

## EXECUTION PLAN — Your call

| Batch | Items | Time | Do Now? |
|-------|-------|:----:|:-------:|
| **Batch 1** — Tonight | #1 health alert + #2 non-text reply + #3 human handoff + #4 KB sync + #5 .env backup | ~1.5 hrs | 🟢 |
| **Batch 2** — Weekend | #6 dashboard auto-start + #7 DeepSeek balance + #8 metrics + #9 log rotation + #10 .env copy | ~2 hrs | 🟢 |
| **Batch 3** — Week after | #11 production URL + #12 landing page + #13 docs | ~5 hrs | 🟡 |

Want me to start Batch 1 now? 🚀
