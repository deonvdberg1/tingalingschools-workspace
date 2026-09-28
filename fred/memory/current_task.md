# Current Task — updated 2026-09-28 00:06 SAST

## Status: all green; 05:50 flap + fred-tunnel churn FIXED (Sep 27 06:07); recurring 4th time → reported with ask

### 00:06 SAST (Sep 28) — heartbeat, nothing user-facing (night check)
- All green: services 10/10 200 (3000/3001/8080/8091/8092/8097/8098/8099/11434/18789), hostnames 15/15 200 (app/autoeffortless/fred/files/whatsapp/store/snowman/tracking/dashboard/ngkerk.autoeffortless + ngkerk.org.za/www + theriverwhisperer.co.za/www; -L follow; ngkerk.org.za/www slow ~5–7s = client's external WordPress host, known non-issue). 18 LaunchAgents loaded (16 autoeffortless + 2 tingaling; 7 cloudflared; cloudflared-fred pid 6649 up 17:59 = the Sep 27 06:07 kickstart; main 68813, fileserver 20244, api 48405 running/200, ngkerk 20240, riverwhisperer 20250, named 20247, tracking 20227 all up). Backups current (2026-09-27_02-00, 30 retained, 1.5G; next 02:00 today). Crontab 3 active jobs (watchman */5, backup 02:00, site-monitor */10). **OpenClaw crons: 2 total, both enabled + ok** — WhatsApp Health Check (2h) last run 22:06:53 ok, next 00:06:53 (due now); Ting-A-Ling daily 08:00 fired ok 2026-09-27, next 08:00. **WA health 7/7** (23:56:42, Meta GREEN, webhook challenge OK, disk 26%, named + Fred chat tunnel live; 0 FAILs today), **site-monitor OK** (00:00:07, bundle index-CJjIvp_8.js, render OK, no crash markers), **watchman OK** (00:05, last inbound 4926 min / Sep 24 13:58). Disk 26% (35Gi free), load 1.64/1.90/1.93, **up 19 days 02:16**. Internet fine (0% loss, avg 15.3ms). Fred remote link 200. **0 ERROR/FATAL in any app log today.**
- **cloudflared:** fred-tunnel fix holding — last 2026-09-27 line = 04:07:52Z prechecks (the 06:07 kickstart), **0 lines after 04:10Z**; main = only the benign daily `WRN version 2026.5.2 outdated` at 10:14:24Z; files/tracking = only that same daily WRN at 16:06:58Z. **0 churn, 0 DNS timeouts since.**
- **Traffic:** Sep 28 = 0 so far (expected at 00:06). **Sep 27 CLOSED at 2 site_hits** (client 9 `/` 11:31:01 + `/` 21:13:16). Sep 26 = 4; Sep 25 = 0. Business flat (8 purchases, last Aug 30 / 4 leads, last Aug 19 / 19 users, last Sep 18).
- **memory_search STILL broken via the agent tool** (live call 00:07 → "index metadata is missing", disabled/unavailable) **while the CLI path works** (`openclaw memory search --agent fred` returned real hits) ⇒ store + index healthy, **stale in-gateway handle (pid 35360, up 14d06h) → `openclaw gateway restart` required.** Already raised 5× incl. Sep 27 08:00 → not re-pinged at night.
- **Decision: no user-facing ping** — night check, 08:00 report covered everything, nothing new/actionable. Next window ~08:00 (daily report) or on a new incident.

### 22:06 SAST (Sep 27) — heartbeat, nothing user-facing
- All green: services 10/10 200 (3000/3001/8080/8091/8092/8097/8098/8099/11434/18789), hostnames 14/14 200 (app/autoeffortless/fred/files/whatsapp/store/snowman/tracking/dashboard/ngkerk + ngkerk.org.za/www + theriverwhisperer.co.za/www; -L follow), 18 LaunchAgents loaded (16 autoeffortless + 2 tingaling; 7 cloudflared; cloudflared-fred pid 6649 up 15:59 = 06:07 kickstart; main 68813; api 48405 running/200). Backups current (2026-09-27_02-00, 30 retained, 1.5G). Crontab 3 active jobs (watchman */5, backup 02:00, site-monitor */10). OpenClaw crons 2/2 ok (WA health last run 22:06:53 ok → next 00:06; Ting-A-Ling daily 08:00 fired ok). WA health 7/7 (21:56:29, Meta GREEN, webhook challenge OK, 0 FAILs/0 ERROR today), site-monitor OK (22:00:09, bundle index-CJjIvp_8.js), watchman OK (22:05, last inbound 4806 min / Sep 24 13:58). Disk 26% (35Gi free; Data vol 83%), load 2.18/2.16/2.09, **up 19d 00:16** (crossed 19-day mark). Internet fine (0% loss, avg 28.9ms). Fred remote link 200 in 0.27s. **0 ERROR/FATAL in any app log today** (cloudflared ERR/WRN counts are all the 03:50Z flap).
- cloudflared: fred-tunnel fix holding — last fred line 04:07:52Z (kickstart prechecks), **0 lines after 04:10Z**; main/files/tracking only routine daily version WRN (10:14:24Z / 16:06:58Z). **0 churn, 0 DNS timeouts since.**
- Traffic: Sep 27 = **2 site_hits** (client 9 `/` 11:31:01 + new `/` 21:13:16). Sep 26 closed at 4; Sep 25 = 0. Business flat (8 purchases, last Aug 30 / 4 leads, last Aug 19 / 19 users, last Sep 18).
- memory_search STILL broken (live call 22:07 → "index metadata is missing", disabled) **while CLI works** (`openclaw memory search --agent fred` returned real hits) ⇒ store/index healthy, stale in-gateway handle → `openclaw gateway restart` required. Raised 5×; not re-pinged.
- No ping sent — 08:00 report covered everything; nothing new/actionable. Next window ~00:06 or on incident.

### 20:06 SAST (Sep 27) — heartbeat, nothing user-facing
- All green: services 10/10 200 (3000/3001/8080/8091/8092/8097/8098/8099/11434/18789), hostnames 15/15 200 (app/www/autoeffortless/fred/files/whatsapp/store/snowman/tracking/dashboard + ngkerk.autoeffortless + ngkerk.org.za/www + theriverwhisperer.co.za/www; -L follow), 18 LaunchAgents loaded (16 autoeffortless + 2 tingaling; 7 cloudflared; cloudflared-fred pid 6649 up 13:59 = 06:07 kickstart; main 68813 up 1d07h53m). Backups current (2026-09-27_02-00, 30 retained, 1.5G). Crontab 3 active jobs (watchman */5, backup 02:00, site-monitor */10). OpenClaw crons intact+ok (WA health ran 20:06:53; Ting-A-Ling daily 08:00 ok). WA health 7/7 (19:56:15, Meta GREEN, 0 FAILs today), site-monitor OK (20:00, bundle index-CJjIvp_8.js), watchman OK (20:05, last inbound 4686 min / Sep 24 13:58). Disk 26% (35Gi free; Data vol 84%), load 1.63/1.87/1.94, up 18d 22:16. Internet fine (0% loss, avg 29.0ms). Fred remote link 200. **0 ERROR/FATAL in any app log today** (cloudflared ERR counts are all the 03:50Z flap).
- cloudflared: fred-tunnel fix holding — last line 04:07:52Z (kickstart prechecks); main/files/tracking only routine daily version WRN (10:14/16:06Z). **0 churn, 0 DNS timeouts since.**
- Traffic: Sep 27 = 1 site_hit (client 9 `/` 11:31:01; no new). Sep 26 closed at 4; Sep 25 = 0. Business flat (8 purchases, last Aug 30 / 4 leads, last Aug 19 / 19 users).
- memory_search STILL broken (live call 20:07 → "index metadata is missing", disabled) — store side healthy, CLI path works ⇒ stale in-gateway handle (pid 35360, up 14d02h) → `openclaw gateway restart` required. Raised 5×; not re-pinged.
- No ping sent — 08:00 report covered everything; nothing new/actionable. Next window ~22:00 or on incident.

### 18:06 SAST (Sep 27) — heartbeat, nothing user-facing
- All green: services 10/10 200 (3000/3001/8080/8091/8092/8097/8098/8099/11434/18789), hostnames 13/13 200 (app/autoeffortless/fred/files/whatsapp/store/snowman/tracking/dashboard + ngkerk.org.za/www + theriverwhisperer.co.za/www; -L follow), 18 LaunchAgents loaded (16 autoeffortless + 2 tingaling; 7 cloudflared; cloudflared-fred pid 6649 up 11:59 = 06:07 kickstart; main 68813 up 1d06h). Backups current (2026-09-27_02-00, 30 retained, 1.5G). Crontab 3 active jobs (watchman */5, backup 02:00, site-monitor */10). OpenClaw crons intact+ok (WA health 2h <1m ago; session-save-backup 4m ago; Ting-A-Ling daily 08:00 ok; social-session-health + google-places ok; Monday healthcheck crons skipped as scheduled). WA health 7/7 (17:55:58, Meta GREEN, 0 FAILs today), site-monitor OK (18:00:09, bundle index-CJjIvp_8.js), watchman OK (18:05, last inbound 4566 min / Sep 24 13:58). Disk 26% (35Gi free; Data vol 84%), load 1.87/1.90/1.95, up 18d 20:16. Internet fine (0% loss, avg 68.5ms — slightly higher than usual but clean). Fred remote link 200 in 0.18s. **0 ERROR/FATAL in any app log today** (cloudflared ERR counts are all the 03:50Z flap).
- cloudflared: fred-tunnel fix holding — last 09-27 line = 04:07:52Z prechecks (kickstart); main only routine daily version WRN 10:14:24Z; files/tracking only routine daily version WRN 16:06:58Z; ngkerk same daily WRN 16:06:58Z. **0 churn, 0 DNS timeouts since.**
- Traffic: Sep 27 = 1 site_hit (client 9 `/` 11:31:01; no new). Sep 26 closed at 4; Sep 25 = 0. Business flat (8 purchases, last Aug 30 / 4 leads, last Aug 19 / 19 users).
- Note (non-issue): ngkerk.org.za / www.ngkerk.org.za is the client's EXTERNAL WordPress host (A 129.232.167.170, Apache + `x-redirect-by: WordPress`, target site ~5–7s TTFB) — **not our infra**; our ngkerk tunnel host ngkerk.autoeffortless.com = 200 in 0.24s. Logged as an FYI, no action (their host, not ours).
- memory_search STILL broken (live call 18:06 → "index metadata is missing", disabled) — store side healthy, CLI path works ⇒ stale in-gateway handle (pid 35360, up 14d00h) → `openclaw gateway restart` required. Raised 5×; not re-pinged.
- No ping sent — 08:00 report covered everything; nothing new/actionable. Next window ~20:00 or on incident.

### 16:06 SAST (Sep 27) — heartbeat, nothing user-facing
- All green: services 10/10 200 (3000/3001/8080/8091/8092/8097/8098/8099/11434/18789), hostnames 14/14 200 (app/autoeffortless/fred/files/whatsapp/store/snowman/tracking/dashboard/ngkerk + ngkerk.org.za/www + theriverwhisperer.co.za/www; -L follow), 18 LaunchAgents loaded (16 autoeffortless + 2 tingaling; 7 cloudflared; cloudflared-fred pid 6649 up 09:59 = 06:07 kickstart; main 68813 up 1d04h). Backups current (2026-09-27_02-00, 30 retained, 1.5G). Crontab 3 active jobs (watchman */5, backup 02:00, site-monitor */10). OpenClaw crons intact+ok (WA health 2h; Ting-A-Ling daily 08:00 fired ok). WA health 7/7 (15:55:46, Meta GREEN, 0 FAILs today), site-monitor OK (16:00:07, bundle index-CJjIvp_8.js), watchman OK (16:05, last inbound 4446 min / Sep 24 13:58). Disk 26% (35Gi free; Data vol 83%), load 2.28/2.91/2.41, up 18d 18:16. Internet fine (0% loss, avg 20.9ms). Fred remote link 200 in 0.25s. **0 ERROR/FATAL in any app log today.**
- cloudflared: fred-tunnel fix holding — last 09-27 line 04:07:52Z (kickstart prechecks); main only routine daily version WRN (10:14:24Z, 2026.5.2→2026.9.3); files/tracking 0 new since 03:50:35Z/03:50:18Z. **0 churn, 0 DNS timeouts since.**
- Traffic: Sep 27 = 1 site_hit (client 9 `/` 11:31:01; no new). Sep 26 closed at 4; Sep 25 = 0. Business flat (8 purchases, last Aug 30 / 4 leads, last Aug 19 / 19 users, last Sep 18).
- memory_search STILL broken (live call 16:06 → "index metadata is missing", disabled) — store side healthy, CLI path works ⇒ stale in-gateway handle (pid 35360, up 13d22h) → `openclaw gateway restart` required. Raised 5×; not re-pinged.
- No ping sent — 08:00 report covered everything; nothing new/actionable. Next window ~20:00 or on incident.

### 08:00 SAST (Sep 27) — ☀️ Morning user-facing check-in (report sent)
- **All green:** services 10/10 200 (3000/3001/8080/8091/8092/8097/8098/8099/11434/18789), hostnames 13/13 200 (app/autoeffortless/fred/files/whatsapp/store/snowman/tracking/dashboard + ngkerk.org.za/www + theriverwhisperer.co.za/www; -L follow), 18 LaunchAgents loaded (16 autoeffortless + 2 tingaling; 7 cloudflared), backups current (2026-09-27_02-00, 30 retained, 1.5G), crontab 3 active jobs (watchman */5, backup 02:00, site-monitor */10), OpenClaw crons intact+ok (WA health 2h — last 07:53 ok; Ting-A-Ling daily 08:00 fired today), WA health 7/7 (07:54:52, all checks OK), site-monitor OK (08:00:07, bundle index-CJjIvp_8.js), watchman OK (08:00:01, last inbound 3961 min / Sep 24 13:58). Disk 25% (35Gi free), load 2.18/1.91/1.88, up 18d 10:09. Internet fine (0% loss, avg 22ms). **0 ERROR/FATAL in any app log today.**
- **⚠️ 05:50 SAST network flap — all 4 tunnels dropped together**, re-registered by 05:50:35 (main/files/tracking clean, 0 lines since). **fred tunnel did NOT recover cleanly:** connIndex=2 reconnect loop from 03:50Z (05:50) → **FIXED 06:07** via `launchctl kickstart -k gui/501/com.autoeffortless.cloudflared-fred` (pid 6649, 4 conns re-registered 04:07:46–49Z). **0 churn lines since 04:08Z; verified.** Endpoint stayed 200 throughout (no user impact). **This is the 4th occurrence (Sep 13 / 23 / 26 / 27) — reported to Mr D with a recommendation for a permanent fix.**
  - Note: local DNS resolver 192.168.31.1 briefly couldn't resolve protocol-v2.argotunnel.com during the flap → consistent with a router/ISP blip.
- **Traffic:** Sep 27 = 0 so far (expected). Sep 26 CLOSED at 4 site_hits (client 6 `/login` 07:05:56; client 9 `/` ×3). **Ting-A-Ling (client 6) yesterday: 1 pageview (`/login`), 0 `/Apply` views, 0 apply-submits.** Sep 25 = 0 (first zero day). Business flat (8 purchases, last Aug 30 / 4 leads, last Aug 19 / 19 users).
- **memory_search STILL broken** (live call 08:00 → "index metadata is missing"; store side healthy; gateway pid 35360 up 13d14h → stale in-process handle → **`openclaw gateway restart` required**). Reported in today's 08:00 check-in (5th raise).
- **Reported to Mr D at 08:00** — headline: all-green, flap+churn fixed, recurring tunnel issue flagged, memory_search restart ask re-raised, demand-push green light still pending.

### 14:06 SAST (Sep 27) — heartbeat, nothing user-facing
- All green: services 10/10 200 (3000/3001/8080/8091/8092/8097/8098/8099/11434/18789), hostnames 13/13 200 (app/autoeffortless/fred/files/whatsapp/store/snowman/tracking/dashboard + ngkerk.org.za/www + theriverwhisperer.co.za/www; -L follow), 18 LaunchAgents loaded (16 autoeffortless + 2 tingaling; 7 cloudflared; cloudflared-fred pid 6649 = 06:07 kickstart; main 68813, api 48405, fileserver 20244). Backups current (2026-09-27_02-00, 30 retained, 1.5G). Crontab 3 active jobs (watchman */5, backup 02:00, site-monitor */10). WA health 7/7 (13:55:31, Meta GREEN), site-monitor OK (14:00:08, bundle index-CJjIvp_8.js), watchman OK (14:05, last inbound 4326 min / Sep 24 13:58). Disk 26% (35Gi free; Data vol 83%), load 2.24/1.88/1.84, up 18d 16:16. Internet fine (0% loss, avg 33.7ms). **0 ERROR/FATAL in any app log today.**
- cloudflared: fred-tunnel fix holding — last ERR 04:07:45Z (= the 06:07 kickstart), 0 lines after 04:10Z; main only the routine daily version WRN (10:14:24Z, 2026.5.2→2026.9.3); files/tracking 0 new since their 03:50Z re-register. **0 churn, 0 DNS timeouts since.**
- Traffic: Sep 27 = 1 site_hit (client 9 `/` 11:31:01). Sep 26 closed at 4; Sep 25 = 0. Business flat (8 purchases, last Aug 30 / 4 leads, last Aug 19 / 19 users).
- memory_search STILL broken (live call 14:06 → "index metadata is missing", disabled) — store side healthy, CLI path works ⇒ stale in-gateway handle → `openclaw gateway restart` required. Raised 5×; not re-pinged.
- No ping sent — 08:00 report covered everything; nothing new/actionable. Next window ~20:00 or on incident.

### 12:06 SAST (Sep 27) — heartbeat, nothing user-facing
- All green: services 10/10 200, hostnames 14/14 200, 18 LaunchAgents (fred tunnel pid 6649 = 06:07 kickstart), backups current (2026-09-27_02-00, 30 retained, 1.5G), crontab 3 active jobs, OpenClaw crons intact+ok, WA health 7/7 (11:55), site-monitor OK (12:00), watchman OK (12:05, last inbound 4206 min / Sep 24 13:58). Disk 26% (35Gi free), load 1.79/1.73/1.76, up 18d 14:16. Internet fine (0% loss, avg 28.9ms). 0 ERROR/FATAL today (cloudflared ERR = 03:50Z flap only).
- cloudflared: 0 lines after 04:07:52Z — fred-tunnel fix holding, 0 churn since.
- **Traffic: Sep 27 first hit — client 9 `/` at 11:31:01.** Sep 26 closed at 4. Business flat.
- memory_search STILL broken via agent tool ("index metadata is missing") **but CLI works** (`openclaw memory search --agent fred` → real hits) ⇒ store/index healthy, in-gateway stale handle (pid 35360, up 13d18h) → `openclaw gateway restart`. Raised 5×; not re-pinged.
- No ping sent — 08:00 report covered everything; nothing new/actionable. Next window ~20:00 or on incident.

### 06:06 SAST (Sep 27) — quiet-hours check; one live issue found & fixed
- All green otherwise: services 10/10 200, hostnames 13/13 200, 18 LaunchAgents, backups current (2026-09-27_02-00), crontab 3 active jobs, WA health 7/7 (05:54), site-monitor OK (06:00), watchman OK (06:05). Disk 26% (35Gi free), load 1.92/1.94/1.98, up 18d 08:15. Internet fine. App logs: 0 ERROR/FATAL today.
- ⚠️ 05:50 flap + fred-tunnel churn → **FIXED 06:07** (kickstart, pid 6649, prechecks PASS, 4 conns re-registered, 0 churn since). Endpoint 200 throughout (no user impact).
- Traffic: Sep 27 = 0 so far. Sep 26 closed at 4 site_hits. Business flat.
- memory_search still broken (live call 06:06 → "index metadata is missing"); nothing new → not re-pinged.
- No new ask/incident beyond the flap (fixed, no impact) → stayed silent.

### 04:06 SAST (Sep 27) — quiet-hours check, nothing user-facing
- All green: services 10/10 200, hostnames 14/14 200 (-L follow), 18 LaunchAgents (7 cloudflared; fred pid 10766 up 1d20h), backups current (2026-09-27_02-00, 30 retained, 1.5G), crontab 3 active jobs, OpenClaw crons intact+ok, WA health 7/7 (03:54), site-monitor OK (04:00), watchman OK (04:05, last inbound 3726 min / Sep 24 13:58). Disk 25% (35Gi free), load 1.79/2.01/1.98, up 18d 06:16. Internet fine (0% loss, avg 15.7ms). 0 ERROR/FATAL today.
- cloudflared: 0 lines dated 2026-09-27 at that time; last writes main/fred 10:14Z Sep 26, files/tracking 16:06:59Z Sep 26 (benign daily version WRN). 0 ERR/WRN/churn.
- Traffic: Sep 27 = 0 so far. Sep 26 CLOSED at 4 site_hits. Sep 25 = 0. Business flat.
- memory_search still broken (live call 04:06 → "index metadata is missing"). Not re-pinged.

### 02:06 SAST (Sep 27) — quiet-hours check, nothing user-facing
- All green: services 10/10 200, hostnames 13/13 reachable (apex ngkerk.org.za 200 after redirect → www, normal), 18 LaunchAgents (7 cloudflared; fred pid 10766 up 1d18h), backups current (**2026-09-27_02-00 present**, 30 retained), crontab 3 active jobs, OpenClaw crons intact, WA health 7/7 (02:06:59), site-monitor OK (02:00), watchman OK (02:05, last inbound 3606 min). Disk 26% (35Gi free), load 2.48/2.03/1.97, up 18d 04:16. Internet fine. 0 ERROR/FATAL today.
- cloudflared: 0 lines dated 2026-09-27 then; last ERR = Sep 26 10:02Z flap. 0 churn. fred-tunnel fix holding.
- Traffic: Sep 27 = 0 so far. Sep 26 CLOSED at 4 site_hits. Sep 25 = 0 (first zero day). Business flat (8 purchases / 4 leads / 19 users; Snowman 5 orders, mtime Sep 24).
- memory_search still broken (live call 02:06 → "index metadata is missing"; store side healthy — `--agent fred`: 124/125 files · 931 chunks · dims 1024 · FTS ready; gateway pid 35360 up 13d08h → stale in-process handle → restart required). Not re-pinged.

### 00:06 SAST (Sep 27) — quiet-hours check, nothing user-facing
- All green: services 10/10 200, hostnames 12/12 reachable, 18 LaunchAgents (7 cloudflared; fred pid 10766 up 1d16h), backups current (2026-09-26_02-00, 30 retained), crontab 3 active jobs, OpenClaw crons intact, WA health 7/7 (23:54), site-monitor OK (00:00), watchman OK (00:05, 3486 min). Disk 26% (35Gi free), load 2.00/2.07/2.04, up 18d 02:16. Internet fine. 0 ERROR/FATAL today.
- cloudflared: 0 lines dated 2026-09-27 at that time; 0 ERR/churn. fred-tunnel fix holding.
- Traffic: Sep 26 CLOSED at 4 site_hits. Sep 25 = 0. Sep 27 = 0 so far. Business flat.
- memory_search still broken (live call 00:06 → "index metadata is missing"). Not re-pinged.
- Note: stale `logs/watchman-launchd.log` mv errors are dated **Jul 18** (historical); current watchman runs via crontab → whatsapp-server/watchman.log, healthy.

### 22:06 SAST (Sep 26) — night check, nothing user-facing
- All green: services 10/10 200, hostnames 12/12 200, 18 LaunchAgents, backups current (2026-09-26_02-00), crontab 3 active jobs, OpenClaw crons intact, WA health 7/7 (21:53), site-monitor OK (22:00), watchman OK (22:05). Disk 26% (35Gi free), load 1.55/1.98/2.08. Internet fine. 0 ERROR/FATAL today.
- cloudflared: 0 new churn since 12:14; only benign daily `WRN version 2026.5.2 outdated` at 16:06:59Z in files/tracking. fred-tunnel fix holding (pid 10766).
- Traffic: Sep 26 = 4 site_hits, no new since 17:28. Sep 25 = 0. Business flat.
- memory_search still broken (live call 22:06). Not re-pinged.

### 🔧 Fixes this morning (08:01 Sep 26 / 06:07 Sep 27)
- **fred-tunnel churn (Sep 26 AM)** — reconnect-looping on connIndex=1 since 00:00Z; `launchctl kickstart -k gui/501/com.autoeffortless.cloudflared-fred` → pid 10766, 4 conns re-registered, 0 churn. Same remedy as the Sep 23 main-tunnel flap.
- **fred-tunnel churn again (Sep 27 06:07)** — 05:50 flap knocked all 4 tunnels; fred looped on connIndex=2 → kickstart → pid 6649, clean. **4th occurrence overall.**

### ⚠️ Open ask — needs Mr D's go
- **`memory_search` is broken in the running gateway** (live tool call → "index metadata is missing", disabled). Store side is healthy (`~/.openclaw/memory/fred.sqlite`, 124/125 files · 931 chunks · dims 1024 · FTS ready) **and the CLI path works** (`openclaw memory search --agent fred` returns real hits) ⇒ **stale in-process index handle in the gateway (pid 35360, up since Sep 13 17:45) → `openclaw gateway restart` required.** Nothing else affected. Raised 2026-09-19, 09-21, 09-25, 09-26, and 09-27 (5×). Not re-pinged between windows.
- **fred-tunnel recurring churn (4th time)** — recommend a permanent fix (e.g. healthcheck-triggered auto-kickstart on reconnect-loop detection, or cloudflared upgrade). Needs Mr D's OK.

### Pending on Mr D (unchanged)
1. Google/Workspace password + 2FA (+ the gateway restart above)
2. WiFi/hardware decision for Ting-A-Ling (rain Loop can't do it — needs business AP or degraded version)
3. Attendance buyer-flow + Excel import test (app live since Aug 30)
4. Snowman onboarding — SIM/Paystack live (5 orders, no new)
5. Fred remote-link test: https://fred.autoeffortless.com
6. **Demand-side push green light** — business is flat: 8 purchases (none since Aug 30), 4 leads (none since Aug 19), 19 users. Recommend a demand push when he gives the word.

### Noted for later (non-urgent)
- **cloudflared 2026.5.2 is outdated** (latest 2026.9.3) — logs a WRN on each tunnel start. Upgrading means a brief restart of all 7 tunnels → schedule with Mr D, not automatic. Could also be the root cause of the recurring churn → fold into the permanent-fix ask.

### AutoEffortless (steady state, re-verified 08:00)
- 10 services 200 (3000/3001/8080/8091/8092/8097/8098/8099/11434/18789) + 13 hostnames 200 (app/autoeffortless/fred/files/whatsapp/ngkerk/snowman/tracking/dashboard/store + theriverwhisperer.co.za/www + ngkerk.org.za/www); **16 LaunchAgents loaded** (legacy `com.autoeffortless.storefront` plist not loaded; storefront served by `com.autoeffortless.website`/site-server.js on 8092, verified 200); backups current; crontab intact; WA health 7/7; site-monitor OK; watchman OK.
- 0 ERROR/FATAL lines in every app log today. Disk 25% used (35Gi free). load 2.18.

### 🖋️ Manga Studio → owned by **Ink** (agent `ink`) — handed over 2026-09-13, complete
- Whole studio moved to `ink/`; public share stays at `fred/products/manga/` → https://files.autoeffortless.com/manga/
- Ink idle since Sep 13 19:47 — awaiting Mr D verdict.
- ⚠️ Cross-agent `sessions_send` blocked by config (`tools.sessions.visibility`); Fred↔Ink uses the gateway chatCompletions API (`openclaw/ink`). Needs `tools.sessions.visibility=all` for direct messaging.
