#!/bin/bash
# ── Inbound Watchman ──────────────────────────────────────────────────────
# Runs every 5 minutes via cron.
# If no inbound WhatsApp message received in the last 10 minutes while the
# server is running, something is wrong at Meta's end — alert immediately.
# ──────────────────────────────────────────────────────────────────────────

ENV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/.env"
CONV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/conversations.json"
LOG_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/watchman.log"
SERVER_URL="http://localhost:3000/status"

now=$(date +%s)
echo "[$(date)] Watchman check..." >> "$LOG_FILE"

# 1. Is the server up?
server_ok=$(curl -sf "$SERVER_URL" > /dev/null 2>&1; echo $?)
if [ "$server_ok" != "0" ]; then
  echo "  [ALERT] Server DOWN — not a Meta issue, but escalating" >> "$LOG_FILE"
  # Don't alert for server down — the health check already handles that
  # We're watching for Meta-side failures specifically
  tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" 2>/dev/null && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  exit 0
fi

# 2. Does the conversations file exist?
if [ ! -f "$CONV_FILE" ]; then
  echo "  [OK] No conversations yet — skipping (new install)" >> "$LOG_FILE"
  tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" 2>/dev/null && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  exit 0
fi

# 3. Check conversation file size
file_size=$(stat -f%z "$CONV_FILE" 2>/dev/null)
if [ "$file_size" -lt 5 ]; then
  echo "  [OK] Conversations file empty — no activity expected" >> "$LOG_FILE"
  tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" 2>/dev/null && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  exit 0
fi

# 4. Find the most recent inbound message across ALL conversations
# We use python3 for reliable JSON parsing
latest_inbound=$(python3 -c "
import json, os, sys
try:
    with open('$CONV_FILE', 'r') as f:
        data = json.load(f)
except:
    sys.exit(0)

latest = 0
for phone, conv in data.items():
    for msg in conv.get('messages', []):
        if msg.get('direction') == 'in':
            ts = msg.get('timestamp', '')
            if ts:
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(ts.replace('Z', '+00:00').split('.')[0])
                    epoch = int(dt.timestamp())
                    if epoch > latest:
                        latest = epoch
                except:
                    pass
print(latest)
" 2>/dev/null)

if [ -z "$latest_inbound" ] || [ "$latest_inbound" = "0" ]; then
  echo "  [OK] No inbound messages in history yet" >> "$LOG_FILE"
  tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" 2>/dev/null && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  exit 0
fi

# 5. Calculate silence duration
elapsed=$(( now - latest_inbound ))
elapsed_min=$(( elapsed / 60 ))
elapsed_max=$(( elapsed_min > 1 ? elapsed_min : 1 ))

echo "  [INFO] Last inbound: ${elapsed_max} min ago ($(date -r $latest_inbound '+%Y-%m-%d %H:%M'))" >> "$LOG_FILE"

# 6. Alert if silent for 10+ minutes
SILENCE_THRESHOLD=600  # 10 minutes
if [ "$elapsed" -gt "$SILENCE_THRESHOLD" ]; then
  echo "  [ALERT] No inbound messages for ${elapsed_max} minutes! Sending alert..." >> "$LOG_FILE"

  # Load env vars
  TOKEN=$(grep -E "^WHATSAPP_TOKEN=" "$ENV_FILE" 2>/dev/null | sed 's/WHATSAPP_TOKEN=//')
  PHONE_ID=$(grep -E "^PHONE_NUMBER_ID=" "$ENV_FILE" 2>/dev/null | sed 's/PHONE_NUMBER_ID=//')
  ADMIN_NUMBER="27615274429"

  if [ -n "$TOKEN" ] && [ -n "$PHONE_ID" ]; then
    ALERT_MSG="🚨 *AutoEffortless Alert* — Inbound Silence\\n\\nNo WhatsApp messages received for ${elapsed_max} minutes.\\nServer: ✅ Running\\nMeta routing: ❌ SUSPECTED FAILURE\\n\\nCheck: https://whatsapp.autoeffortless.com\\nTime: $(date '+%Y-%m-%d %H:%M SAST')"

    curl -s -X POST "https://graph.facebook.com/v22.0/$PHONE_ID/messages" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"messaging_product\":\"whatsapp\",\"to\":\"$ADMIN_NUMBER\",\"type\":\"text\",\"text\":{\"body\":\"$ALERT_MSG\"}}" > /dev/null 2>&1

    echo "  [ALERT] WhatsApp alert sent to $ADMIN_NUMBER" >> "$LOG_FILE"
  else
    echo "  [FAIL] Cannot send alert — missing TOKEN or PHONE_ID" >> "$LOG_FILE"
  fi

  # Also write a critical timestamp so the health check can pick it up
  echo "$(date '+%s')" > /tmp/inbound-watchman-critical
else
  # Clear any previous critical flag
  rm -f /tmp/inbound-watchman-critical
fi

# Keep log trimmed
tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" 2>/dev/null && mv "${LOG_FILE}.tmp" "$LOG_FILE"

echo "[$(date)] STATUS: OK — Last inbound ${elapsed_max} min ago" >> "$LOG_FILE"
exit 0
