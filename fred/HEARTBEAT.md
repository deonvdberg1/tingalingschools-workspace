# Heartbeat Monitor
# Fred checks these on every session start

## 2026-05-28 09:23 SAST — MAJOR UPGRADE: Permanent Named Tunnel
✅ WhatsApp server running (PID 1069, port 3000)
✅ Dashboard API running (PID 1077, port 3001)
✅ Named Cloudflare Tunnel **tingaling** running (PID 31057) — 2 edge connections
✅ **Permanent URL**: `https://whatsapp.autoeffortless.com` — DNS propagated
✅ Meta webhook updated to permanent URL: `https://whatsapp.autoeffortless.com/webhooks/whatsapp`
✅ LaunchAgent auto-start: `com.tingaling.cloudflared-named`
✅ Old trycloudflare LaunchAgents removed (no more ephemeral URLs)
✅ Disk space OK (66Gi free)
✅ Server responds via named tunnel

### What Changed
- DNS delegation from Ionos→Cloudflare finally propagated (May 21 → May 28, ~7 days)
- DNS routes created: `whatsapp.autoeffortless.com` and `tingaling.autoeffortless.com` point to tunnel
- No more trycloudflare — permanent tunnel means webhook URL won't break on restart
- `tunnel-url.txt` now stores `https://whatsapp.autoeffortless.com`
- `cloudflared-named.log` for tunnel debugging
