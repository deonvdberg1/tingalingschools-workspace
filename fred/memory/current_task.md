# Current Task — updated 2026-10-22 01:36 SAST

## Status: 🟡 **QUIC FLAP RESUMED (self-healing) · serving fine · 0 hits today · CNY 34.59 ⇒ dry Oct 23 12:30–22:30**

### 01:36 SAST — 🟡 fleet-wide QUIC flap (all 8 tunnels), no outage, no stuck connectors
- **What happened:** from **22:13Z to 23:34:58Z** (00:13–01:35 SAST) all 8 tunnels dropped and re-registered **18 times** — `error="timeout: no recent network activity"` on QUIC control/stream (connIndex 0–3, dur01/jnb06). **Every retry re-registered within 2–25 s.** No stuck connector (the Oct 21 03:36 enrol failure mode did **not** repeat).
- **Impact: none observed** — healthcheck 9/9 OK @01:33 and @01:36; 10/10 hosts correct; 6/6 ports 200. Last errish 23:34:58Z (~2 min before this check), so the flap may still be live.
- **Network layer:** ICMP to 1.1.1.1 = **0% loss, 14 ms avg** over 20 pings ⇒ link fine; points at UDP/QUIC path (router 192.168.31.1 NAT/UDP timeout), not the ISP line. Strengthens the pending **QUIC→http2** case.
- 🔧 **Prepared (not run):** `scripts/tunnel-protocol-trial.sh <tunnel|all> <quic|http2>` — backs up config, edits only the `protocol:` line, kickstarts the LaunchAgent, verifies registrations + host 200, one-command rollback. Recommended first target: `ngkerk http2` (lowest traffic). **Needs Mr D's go-ahead.**
- ✅ **http2 proven on this host (23:38Z):** ran a throwaway 2nd connector `cloudflared --protocol http2 run` against the ngkerk tunnel → **4/4 connectors registered in 4 s** (dur01 + jnb06), stable 43 s, zero errors, then killed. Meanwhile cloudflared's own precheck still `suggested_protocol=quic` — so the failure is silent UDP middlebox state expiry at the router, exactly what http2 bypasses. Switch is safe whenever Mr D says go.
- DeepSeek **CNY 34.59** @01:27 (36.14 @23:26 ⇒ **0.77/h**). Runway 0.77/h ⇒ **~45h** (Oct 23 ~22:30); at 0.99/h ⇒ **~35h** (Oct 23 ~12:30). **Blended dry: Oct 23 12:30–22:30.**
  - 🚨 **Top-up remains the critical path — before Oct 23 11:00.** No fallback provider.
- **Traffic: 0 hits today** (Oct 21 closed at 10, last hit 16:22:44 ⇒ 9h15m silent). Subs 2; purchases 8 / users 20 / leads 4 (flat).
- 20 LaunchAgents all exit 0; enrol health ok (106 cols, 2 subs, 0 pending, dryRun=false); site monitor OK @01:30; backups 31 / 1.6 GB (newest 2026-10-21_02-00, next 02:00); disk 25% (37Gi free); load 1.20/1.40/1.37; up 6d00:47. 0 app errors.
- Housekeeping still open: no log rotation — `cloudflared-tracking.log` 27 MB, `cloudflared-main.log` 20 MB.

### 23:36 SAST Oct 21 — green and quiet; ~37–47h of model budget left
- Tunnels: last errish fleet-wide still **05:38:28Z** (riverwhisperer restart) ⇒ **16h clean**. 8/8 cloudflared procs up, no new reconnects.
- DeepSeek **CNY 36.14** @23:26 (37.67 @21:26 ⇒ **0.765/h**). Runway 0.765/h ⇒ **~47h** (Oct 23 ~22:50); at 0.99/h ⇒ **~37h** (Oct 23 ~12:00). **Blended dry window: Oct 23 12:00–22:50.** Watchdog `ok`, balance/inference/gateway all 200.
  - 🚨 **Top-up remains the critical path — before Oct 23 11:00.** No fallback provider.
- **Traffic: 10 hits today, none since 16:22** (7h14m quiet). Subs 2; purchases 8 / users 20 (flat).
- 12/12 public hosts correct (autoeffortless 200, www 301, rest 200); ports **5/5 200**; **20 LaunchAgents, all exit 0**; enrol health ok (106 cols, 2 subs, 0 pending, dryRun=false).
- Backups **31 / 1.6 GB**; disk **24%** (37Gi free); load 1.97/1.55/1.43; up 5d22:46. No alerts fired.
- 🔧 Fix shipped: the 08:00 daily-report cron still carried the **stale 2026-10-19 "crisis resolved, don't re-escalate"** wording — it would have told tomorrow's run to reassure Mr D while the balance is actually ~37–47h from zero. Rewrote its payload to demand one plain runway line + the three open blockers. (Job `249af5eb-7bf4-4a9d-a25a-d428a86942a3`, next run 08:00 Oct 22.)

### 21:36 SAST — quiet and stable; ~38–46h of model budget left
- Tunnels: last errish fleet-wide still **05:38:28Z** (riverwhisperer restart itself) ⇒ **16h clean**. 8/8 cloudflared procs up.
- DeepSeek **CNY 37.67** @21:26 (39.18 @19:36 ⇒ **0.82/h**). Runway 0.82/h ⇒ **~46h** (Oct 23 ~19:30); at 0.99/h ⇒ **~38h** (Oct 23 ~11:30). **Blended dry window: Oct 23 11:30–19:30.** Watchdog `ok`, all probes 200.
  - 🚨 **Top-up remains the critical path — before Oct 23 11:00 (~38h).** No fallback provider.
- **Traffic: 10 hits today, none since 16:22** (5h14m quiet). Subs still 2; the 6-page organic session never submitted.
- 12/12 public hosts **200**; ports **5/5 200** (3001/3015/8080/8091/18789); **20 LaunchAgents, all exit 0**; enrol health ok (106 cols, 2 subs, 0 pending, dryRun=false). Purchases 8 / users 20 (flat).
- Backups **31 / 1.6 GB**; disk **25%** (37Gi free); load 1.33/1.34/1.32; up 5d20:46. No alerts fired.
- 🧹 Housekeeping: removed stray 0-byte `fred/autoeffortless.db` (side-effect of a 17:36 probe; real DB is `dashboard-api/data/autoeffortless.db`, nothing referenced it).

### 19:36 SAST — infra clean; top-up the only hard deadline
- Tunnels: last errish fleet-wide = **05:38:28Z** (riverwhisperer restart itself) ⇒ **14h clean**. 8/8 tunnels up, no new reconnects.
- DeepSeek **CNY 39.18** @19:36 (was 40.74 @17:35 ⇒ **0.77/h last 2h**; 0.99/h since 09:34). Watchdog `ok`, balance/inference/gateway all 200.
  - Runway at 0.77/h ⇒ **~51h** (Oct 23 ~22:30); at 0.99/h ⇒ **~40h** (Oct 23 ~11:00). **Blended: dry between Oct 23 11:00 and Oct 23 22:30** (window narrowed slightly vs 17:36).
  - 🚨 **Top-up is the critical path.** No fallback provider — dry means portal chat, WhatsApp auto-reply, site AI and DocChat all stop.
- **Traffic: 10 hits today, none since 16:22** (3h14m quiet). Best day since Oct 18. The 6-page Google-organic session (16:21:02→16:22:44, reached `/Apply`) did **not** submit — subs still 2.
- Hosts correct (2 expected 301; only known-cosmetic `www.theriverwhisperer` 200-instead-of-301). Ports **5/5 200** (3001/3015/8080/8091/18789); healthcheck **9/9 ok** @19:36; **20 LaunchAgents, all exit 0**; site monitor OK @19:30 (bundle index-BV2ORYrx.js).
- ⚠️ Probe notes: `riverwhisperer.co.za` does **not** exist (NXDOMAIN) — live domain is **theriverwhisperer.co.za**. Enrol health endpoint is **`/api/enrol/health`** (not `/health`). Traffic DB is **`dashboard-api/data/autoeffortless.db`** (not the root copy); `site_hits` uses `created_at`, not `ts`.
- Enrol health ok: 106 cols, 2 subs, 0 pending, dryRun=false, sheet configured.
- Backups **31 / 1.6 GB**; disk **25%** (36Gi free); load 1.55/1.31/1.34; up 5d18:46.
- Purchases 8 / users 20 (flat). No alerts fired.

### ⚠️ Awaiting Mr D (refreshed 01:36 Oct 22, ordered by cost of delay)
1. **DeepSeek top-up — before Oct 23 11:00** (~35–45h left, no fallback provider).
2. **Second provider / fallback** (Gemini API key or OpenRouter) — plan in `memory/fallback-model-plan.md`, not applied.
3. **Reboot cause + P1 LaunchDaemon migration approval**
4. **UPS (R1,293)**
5. fallback-DNS (1.1.1.1/8.8.8.8 on Mac **and** router 192.168.31.1)
6. **QUIC→http2 tunnel trial** — ⬆️ now the live issue: 18 QUIC drops across all 8 tunnels 00:13–01:35 SAST. Script ready (`scripts/tunnel-protocol-trial.sh`), suggest starting with `ngkerk http2`. One word from Mr D and I run it (low traffic now = best window).

Standing: alert-channel 131047, cloudflared upgrade (2026.5.2 → 2026.10.1), CIPC option, usage-tracking, AI Editor wording, lead emails, enrolment wording sign-off, Pre-Primary geofence pin, GOOGLE_API_KEY rotation, www.theriverwhisperer 301 rule.

### 🔎 Watch item
First real browse session (6 pages, reached /Apply, no submit) ended at 16:22 with no follow-through. If organic traffic keeps arriving without applications, the lever is the Apply→submit conversion, not the funnel top.

---
# Earlier (compact)
- **23:36 Oct 21** 🟢 all green — 16h clean; CNY 36.14 @0.77/h ⇒ dry Oct 23 12:00–22:50; 10 hits (none since 16:22); 12/12 hosts, 5/5 ports, 20 LAs; rewrote stale 08:00 cron payload.
- **21:36 Oct 21** 🟢 all green — 14h clean; CNY 37.67 @0.82/h ⇒ dry Oct 23 11:30–19:30; 10 hits (none since 16:22); 12/12 hosts, 5/5 ports, 20 LAs; removed stray 0-byte root `autoeffortless.db`.
- **19:36 Oct 21** 🟢 all green — 14h clean; CNY 39.18 @0.77–0.99/h ⇒ dry Oct 23 11:00–22:30; 10 hits, 5/5 ports, 20 LAs.
- **17:36 Oct 21** 🟢 all green — 12h clean; **10 hits today (8 Google organic, real 6-page session)**; 14/14 hosts, 5/5 ports, 20 LaunchAgents; CNY 40.74, 0.77–1.02/h ⇒ dry ≈ Oct 23 09:00–22:30.
- **15:36 Oct 21** 🟢 all green — 8h clean; 2 hits today; 14/14 hosts, 5/5 ports, 20 LaunchAgents; CNY 42.30, 0.78–1.10/h ⇒ dry ≈ Oct 23 06:00–22:00.
- **13:36 Oct 21** 🟢 all green — 6h clean; first traffic in 25h (1 hit); 13/13 hosts, 5/5 ports; CNY 43.85, 0.98–1.26/h ⇒ dry ≈ Oct 23 00:30–10:00.
- **11:36 Oct 21** 🟢 all green — ~4h clean; 18/18 hosts, 5/5 ports, 20 LaunchAgents; CNY 45.83, 1.32/h ⇒ dry ≈ Oct 23 ~00:00.
- **09:36 Oct 21** 🟢 all green — 2h clean post-heal; 19/19 hosts, 1.55 CNY/h; CNY 48.93 ⇒ dry ≈ Oct 23 midday.
- **08:00 Oct 21** 🟢 green — post-heal stable (~2.4h clean); 19/19 hosts, 5/5 ports, 9/9 healthchecks, 20 LaunchAgents; CNY 50.58, 0.80/h.
- **07:45 Oct 21** 🟡 green after heal — 3 stuck QUIC connectors (main idx0, fred idx1, rw idx3) kickstarted 05:36–05:38Z; CNY 51.04, 0.98/h.
- **05:36 Oct 21** 🟢 green; CNY 53.00, burn 1.26/h ⇒ dry ≈ Oct 22 late PM–Oct 23; enrol fix 4/4 clean 4h.
- **03:36 Oct 21** 🟢 green; CNY 55.39, burn 1.21/h; 19/19 hosts, 5/5 ports; enrol stuck connector fixed 03:37.
- **01:36 Oct 21** 🟢 green; CNY 58.00, burn 0.76/h ⇒ dry ≈ Oct 24 05:30; tunnels 16h clean.
- **23:36 Oct 20** 🟢 green; CNY 59.52, burn 0.75/h; tunnels 12h clean.
- **21:36 Oct 20** 🟢 green; CNY 61.02, burn 0.76/h.
- **19:36 Oct 20** 🟢 green; CNY 62.54, burn 0.77/h; tunnels 10h clean.
- **17:36 Oct 20** 🟢 green; CNY 64.07, burn 0.78/h; tunnels 8h clean.
- **15:36 Oct 20** 🟢 green; CNY 65.62, burn 0.78/h.
- **13:36 Oct 20** 🟢 green; CNY 67.20, burn 1.05/h.
- **11:36 Oct 20** 🟢 green; CNY 69.30, burn 1.58/h; stuck enrol connIndex=2 fixed.
- **08:00 Oct 20** 🟢 all green, CNY 74.19, burn 1.00/h, hosts 19/19.
- **07:36 Oct 20** 🟢 all green, CNY 74.60, burn 1.04/h; tunnels ~32h clean.
