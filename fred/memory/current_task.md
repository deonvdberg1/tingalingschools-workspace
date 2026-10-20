# Current Task — updated 2026-10-20 01:36 SAST

## Status: 🟢 **ALL GREEN — DeepSeek healthy at CNY 82.03**

### DeepSeek / model provider
🟡 **Balance CNY 82.03** (01:28). Burn 23:28→01:28 = **1.65 over 2h ⇒ 0.82/h** (steady, 8th consecutive ~0.8/h window) ⇒ runway **~4.2 days** at this pace, ~2.3 days at 1.5/h daytime ⇒ dry ≈ **Oct 24–25**. Inference 200, gateway 200, watchdog `status: ok` (01:28). No pings sent; no action until watchdog thresholds.
🚨 **Residual risk unchanged:** DeepSeek is the ONLY configured provider, no `fallbacks`; `gemini` CLI has no auth; ollama has only llama3.2:3b/moondream (no tool-calling) ⇒ a future zero still blacks out the whole fleet (Oct 10–15 repeat). Plan ready in `memory/fallback-model-plan.md`, **not applied** — needs schema lookup + Mr D's ok.
✅ 08:00 report job payload already rewritten to report the top-up as resolved and chase the 2 remaining blockers.

### Infra (01:36)
- Public hosts **18/18 OK** (www.autoeffortless.com = 301, normal)
- Local ports **5/5 200**: 3001 / 3015 / 8080 / 8091 / 18789
- LaunchAgents **20 loaded / 21 plists** — all running or exit 0, no bad PIDs; `storefront` disabled by design.
- Backups 31; disk 24% (39Gi free); load 1.43; up 4d00:46
- enrol health ok (106 cols, 2 submissions, 0 pending)
- 0 ERROR/FATAL today (all tunnel/host/service logs)
- Tunnels **0 errish today / ~26h clean** — last errish 2026-10-18T23:35:31Z (riverwhisperer datagram WRN, self-healed)

### Traffic / business
Oct 19 closed **7** (best day this week), Oct 18 = 4, Oct 17 = 3. Business flat: 8 purchases / 20 users / 4 leads.
*01:36 check: hosts 18/18 (www=301), ports 5/5 200, LaunchAgents 20 loaded/21 plists, backups 31, disk 24% (39Gi free), load 1.43, up 4d00:46, enrol ok (106 cols/2 subs/0 pending), 0 errish tunnels today (last 2026-10-18T23:35:31Z), 0 real ERROR/FATAL.*

### ⚠️ Awaiting Mr D
1. **Second provider / fallback** (Gemini API key or OpenRouter) — plan written, not applied
2. **Reboot cause + P1 LaunchDaemon migration approval**
3. **UPS (R1,293)**
4. fallback-DNS (1.1.1.1/8.8.8.8 on Mac **and** router 192.168.31.1)
5. QUIC→http2 tunnel trial (needs 8-connector restart; daytime)
Standing: alert-channel 131047, cloudflared upgrade (2026.5.2 → 2026.10.1), CIPC option, usage-tracking, AI Editor wording, lead emails, enrolment wording sign-off, Pre-Primary geofence pin, GOOGLE_API_KEY rotation.

---
# Earlier (compact)

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
