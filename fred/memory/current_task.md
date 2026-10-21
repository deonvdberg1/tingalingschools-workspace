# Current Task — updated 2026-10-21 01:36 SAST

## Status: 🟢 **ALL GREEN — CNY 58.00 (burn 0.76/h ⇒ dry ≈ Oct 24 05:30) · tunnels ~16h clean since 09:37Z**

### DeepSeek / model provider
🟢 **Balance CNY 58.00** (01:32). Rolling 2h (23:32→01:32): 59.52→58.00 = 1.52 ⇒ **0.76/h** (6 windows flat: 0.78 / 0.78 / 0.77 / 0.76 / 0.75 / 0.76). Runway ~76h ⇒ **dry ≈ Oct 24 05:30** (worst 1.6/h ⇒ Oct 22 10:00). Inference 200, gateway 200, watchdog `status: ok`. ⚠️ **Top-up by Oct 21 evening still the call.**
🚨 **Residual risk unchanged:** DeepSeek is the ONLY configured provider, no `fallbacks`; `gemini` CLI unauthenticated; ollama has only llama3.2:3b/moondream (no tool-calling) ⇒ a future zero blacks out the whole fleet (Oct 10–15 repeat). Plan ready in `memory/fallback-model-plan.md`, **not applied** — needs schema lookup + Mr D's ok.

### Infra (01:36)
- Public hosts **18/18 OK** (all 200 with -L, 0.08-0.44s)
- Local ports **5/5 200**: 3001 / 3015 / 8080 / 8091 / 18789
- LaunchAgents 20 listed, all exit 0, none bad; `storefront` disabled by design.
- Backups 31; disk 25% (35Gi free); load 1.46/1.37/1.32; up 5d00:46
- enrol health ok (106 cols, 2 submissions, 0 pending)
- 0 app ERROR/FATAL today; **0 tunnel errish today** — last real errish 2026-10-20T09:37:00Z
- ✅ **Tunnels clean ~16h since 09:37Z**. No stuck connectors.
- QUIC→http2 trial + fallback DNS still the top infra lever (daytime window open tomorrow).

### Traffic / business
Oct 20 closed **1 hit** (10:09; nothing in **15.5h** since). Oct 19 = 7, Oct 18 = 4, Oct 17 = 3. Business flat: 8 purchases / 20 users. **Zero traffic for 15.5h = the real problem, not uptime.**

### ⚠️ Awaiting Mr D
1. **Second provider / fallback** (Gemini API key or OpenRouter) — plan written, not applied
2. **Reboot cause + P1 LaunchDaemon migration approval**
3. **UPS (R1,293)**
4. fallback-DNS (1.1.1.1/8.8.8.8 on Mac **and** router 192.168.31.1)
5. QUIC→http2 tunnel trial (needs 8-connector restart; daytime)
Standing: alert-channel 131047, cloudflared upgrade (2026.5.2 → 2026.10.1), CIPC option, usage-tracking, AI Editor wording, lead emails, enrolment wording sign-off, Pre-Primary geofence pin, GOOGLE_API_KEY rotation.

---
# Earlier (compact)

- **23:36 Oct 20** 🟢 green; CNY 59.52, burn 0.75/h (2h) ⇒ dry ≈ Oct 24 06:30; 19/19 hosts, 5/5 ports, tunnels 12h clean.
- **21:36 Oct 20** 🟢 green; CNY 61.02, burn 0.76/h (2h) ⇒ dry ≈ Oct 24 05:00; 18/18 hosts, 5/5 ports, tunnels 10h clean.
- **19:36 Oct 20** 🟢 green; CNY 62.54, burn 0.77/h (2h) ⇒ dry ≈ Oct 24; 18/18 hosts, 5/5 ports, tunnels 10h clean.
- **17:36 Oct 20** 🟢 green; CNY 64.07, burn 0.78/h (2h) ⇒ dry ≈ Oct 24; 18/18 hosts, 5/5 ports, tunnels 8h clean.
- **15:36 Oct 20** 🟢 green; CNY 65.62, burn 0.78/h (2h) ⇒ dry ≈ Oct 23-24; 19/19 hosts, 5/5 ports, tunnels 4h clean.
- **13:36 Oct 20** 🟢 green; CNY 67.20, burn 1.05/h (2h) ⇒ dry ≈ Oct 22; 18/18 hosts, 5/5 ports, tunnels 4h clean.
- **11:36 Oct 20** 🟢 green; CNY 69.30, burn 1.58/h (2h) ⇒ dry ≈ Oct 22; hosts 18/18, ports 5/5; restart fixed stuck enrol connIndex=2; QUIC blips #5/#6 today.
- **08:00 Oct 20** 🟢 all green, CNY 74.19, burn 1.00/h (2.5h), hosts 19/19, tunnels clean.
- **07:36 Oct 20** 🟢 all green, CNY 74.60, burn 1.04/h (2h), hosts 19/19, tunnels ~32h clean.
- **03:36 Oct 20** 🟢 all green, CNY 79.98, burn 1.03/h (2h), hosts 18/18, tunnels 28h clean.
- **23:36 Oct 19** 🟢 all green, CNY 83.68, burn 0.82/h, 18/18 hosts, tunnels 24h clean.
- **21:36** 🟢 all green, CNY 85.33, burn 0.82/h, 18/18 hosts, tunnels 22h clean.
- **19:36** 🟢 all green, CNY 86.97, burn 0.84/h, 18/18 hosts, tunnels 20h clean.
- **17:36** 🟢 all green, CNY 88.64, burn 0.83/h, 18/18 hosts, tunnels 18h clean.
- **15:36** 🟢 all green, CNY 90.29, burn 0.82/h, 18/18 hosts, tunnels 16h clean.
- **13:36** 🟢 all green, CNY 91.93, burn 1.11/h, 18/18 hosts, tunnels 13.7h clean.
- **11:36** 🟢 all green, CNY 93.99, burn 1.69/h, 18/18 hosts, tunnels 12h clean.
- **05:36** 🔴 DeepSeek CNY 1.58, dry ~06:00 — escalated WhatsApp (+27 61 527 4429, delivered) + email (deonvdberg1@gmail.com, `1a1523bcbb72d617`), ask = top up CNY 200. **Resolved by top-up at 06:54.**
- **03:36** 🟢 all green, CNY 4.16, tunnels 2h clean.
- **01:36 Oct 19** 🟢 QUIC blip #3 (00:16 SAST, all connectors + resolver fail to 192.168.31.1, self-healed 23 s).
- **23:36 / 21:36 Oct 18** 🟢 QUIC blip #2 (20:59Z, healed <50 s); tunnel flap fix holding.

---
# 🔧 Permanent probe notes (do not relearn these)

- **Authoritative host list = the 18 hostnames in `~/.cloudflared/config*.yml` ingress**: autoeffortless.com, www (301), dashboard, enrol, snowman, snowman-v2, app, store, files, portfolio, fred, tracking, whatsapp, ngkerk, tingaling, tingalingschools.com, theriverwhisperer.co.za + www.
- **Never probe**: `portal.` (no DNS by design), `qr.`, `river-whisperer.`, `api.`, `ai.autoeffortless.com` — all nonexistent.
- Local ports 3001 / 3015 / 8080 / 8091 / 18789 (+5173 dashboard-temp vite, 8092 api). LAN: Mac 192.168.31.21, router/resolver 192.168.31.1.
- Analytics = `dashboard-api/data/autoeffortless.db` table `site_hits` (column **`created_at`**, `client_id=6` for Ting-A-Ling).
- Enrol health = `http://127.0.0.1:3015/api/enrol/health`. Tunnel logs via `scripts/heartbeat-tunnels.sh` (undercounts just-after-midnight events — cross-check `T22:|T23:`).
- DeepSeek balance = `logs/api-watchdog-state.json` (`balance_cny`) / `logs/api-watchdog.log`.
- `com.autoeffortless.storefront` is intentionally `disabled` — don't flag it. Backups rotate at ~31 — a count drop is normal.
- `scripts/healthcheck.sh` = WhatsApp-server health only (logs to `whatsapp-server/healthcheck.log`, silent on success) — the 18-host/port sweep must be run manually as above.
- WhatsApp alerts work inside the 24h window; email = `gog gmail send -a info@autoeffortless.com --to deonvdberg1@gmail.com --body-file <f>` (`--body*` required, plain stdin fails).
- **Burn-rate lesson:** never estimate runway from the night average (0.60/h badly under-called the real ~1.5/h). Always use a rolling 2h window.
- `crontab <file>` hangs on this Mac (TCC prompt) — new schedules go in **LaunchAgents**.
- **Errish counts ≠ incidents:** one 4-connector reconnect burst writes ~19–24 errish lines *per tunnel log* (~157 total). Always check the timestamp window + `INF Registered tunnel connection` lines to tell one 16-second blip from a real outage.
- **Stuck-connector signature:** `Retrying connection ... connIndex=N` repeating every 2-5 min with **no matching `Registered tunnel connection connIndex=N`** in between = that connector is dead while the rest serve (no public outage, silent redundancy loss). Detect by comparing per-index `Retrying` vs `Registered` counts per log; heal with `launchctl kickstart -k gui/$(id -u)/com.autoeffortless.cloudflared-<tunnel>` (recovers in ~4 s).
