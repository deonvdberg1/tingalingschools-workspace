#!/bin/bash
# ── Inbound Watchman (v2) ─────────────────────────────────────────────────
# Runs every 5 minutes via LaunchAgent.
# Alerts ONLY on state transition: when silence first crosses 10 min,
# and then every 30 min as a reminder (no spam).
# Resets automatically when a new inbound arrives.
# ──────────────────────────────────────────────────────────────────────────

ENV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/.env"
CONV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/conversations.json"
LOG_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/watchman.log"
STATE_FILE="/tmp/watchman-state.json"
SERVER_URL="http://localhost:3000/status"

now=$(date +%s)

# ── Log helper (always show in log, but only alert on state change) ──
log_info() { echo "  [INFO] $1" >> "$LOG_FILE"; }
log_alert() { echo "  [ALERT] $1" >> "$LOG_FILE"; }
log_ok() { echo "  [OK] $1" >> "$LOG_FILE"; }

echo "[$(date)] Watchman check..." >> "$LOG_FILE"

# 1. Is the server up?
if ! curl -sf "$SERVER_URL" > /dev/null 2>&1; then
  log_alert "Server DOWN — health check handles this"
  exit 0
fi

# 2-3. Conversations file check
if [ ! -f "$CONV_FILE" ]; then
  log_ok "No conversations yet — skipping"
  exit 0
fi

file_size=$(stat -f%z "$CONV_FILE" 2>/dev/null)
if [ "$file_size" -lt 5 ]; then
  log_ok "Conversations file empty — no activity expected"
  exit 0
fi

# 4. Find the most recent inbound message
latest_inbound=$(python3 -c "
import json, os, sys, math
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
print(latest or 0)
" 2>/dev/null)

if [ -z "$latest_inbound" ] || [ "$latest_inbound" = "0" ]; then
  log_ok "No inbound messages in history yet"
  exit 0
fi

# 5. Calculate silence
elapsed=$(( now - latest_inbound ))
elapsed_min=$(( elapsed / 60 ))
[ "$elapsed_min" -lt 1 ] && elapsed_min=1

log_info "Last inbound: ${elapsed_min} min ago ($(date -r $latest_inbound '+%Y-%m-%d %H:%M'))"

# ── State management ─────────────────────────────────────────────────
# Track: last_inbound_timestamp, last_alerted_at_epoch, silence_alerted
SILENCE_THRESHOLD=600      # 10 min — first alert after 10 min silence
REMINDER_INTERVAL=3600    # 60 min between reminders
CIRCUIT_BREAKER=86400     # 24h — stop alerting after this long in silence
CIRCUIT_LOG="/tmp/watchman-circuit.log"

# Read previous state
last_seen_ts=0
last_alerted=0
if [ -f "$STATE_FILE" ]; then
  state=$(cat "$STATE_FILE")
  last_seen_ts=$(echo "$state" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('last_inbound',0))" 2>/dev/null)
  last_alerted=$(echo "$state" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('last_alerted',0))" 2>/dev/null)
fi

# Has a new inbound arrived since our last check? If so, clear alert state.
if [ "$latest_inbound" -gt "$last_seen_ts" ]; then
  last_alerted=0
  log_info "New inbound detected — resetting alert state"
fi

# ── Decision logic ──────────────────────────────────────────────────
should_alert=0
if [ "$elapsed" -gt "$SILENCE_THRESHOLD" ]; then
  # We're in silence territory
  if [ "$last_alerted" -eq 0 ]; then
    # First time crossing threshold — ALERT
    should_alert=1
  else
    # Already alerted — only re-alert if enough time has passed
    time_since_last_alert=$(( now - last_alerted ))
    if [ "$time_since_last_alert" -gt "$REMINDER_INTERVAL" ]; then
      should_alert=1
    fi
  fi
fi

# ── Alert ────────────────────────────────────────────────────────────
# ── Circuit breaker: if silence has lasted >24h, stop alerting ──
# This prevents spam to Mr D on known-cold clients.
if [ "$elapsed" -gt "$CIRCUIT_BREAKER" ]; then
  circuit_alerted=0
  if [ -f "$CIRCUIT_LOG" ]; then
    circuit_alerted=$(cat "$CIRCUIT_LOG")
  fi
  time_since_circuit=$(( now - circuit_alerted ))
  # Log a circuit-breaker note once every 24h
  if [ "$time_since_circuit" -gt "$CIRCUIT_BREAKER" ]; then
    log_info "Circuit breaker active — silence >24h. Silent since $(date -r $latest_inbound '+%Y-%m-%d %H:%M'). Supressing alerts."
    echo "$now" > "$CIRCUIT_LOG"
  fi
  should_alert=0
fi

if [ "$should_alert" -eq 1 ]; then
  log_alert "No inbound messages for ${elapsed_min} minutes! Sending alert..."

  TOKEN=$(grep -E "^WHATSAPP_TOKEN=" "$ENV_FILE" 2>/dev/null | sed 's/WHATSAPP_TOKEN=//')
  PHONE_ID=$(grep -E "^PHONE_NUMBER_ID=" "$ENV_FILE" 2>/dev/null | sed 's/PHONE_NUMBER_ID=//')
  ADMIN_NUMBER="27615274429"

  if [ -n "$TOKEN" ] && [ -n "$PHONE_ID" ]; then
    ALERT_MSG="🚨 *AutoEffortless Alert* — Inbound Silence\\n\\nNo WhatsApp messages received for ${elapsed_min} minutes.\\nServer: ✅ Running\\nMeta routing: ❌ SUSPECTED FAILURE\\n\\nCheck: https://whatsapp.autoeffortless.com\\nTime: $(date '+%Y-%m-%d %H:%M SAST')"

    curl -s -X POST "https://graph.facebook.com/v22.0/$PHONE_ID/messages" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"messaging_product\":\"whatsapp\",\"to\":\"$ADMIN_NUMBER\",\"type\":\"text\",\"text\":{\"body\":\"$ALERT_MSG\"}}" > /dev/null 2>&1

    log_alert "WhatsApp alert sent to $ADMIN_NUMBER"
  else
    log_alert "Cannot send — missing TOKEN or PHONE_ID"
  fi

  # Save alert time as last_alerted
  echo "{\"last_inbound\":$latest_inbound,\"last_alerted\":$now}" > "$STATE_FILE"
else
  # No alert needed. Still save state so we know latest inbound.
  echo "{\"last_inbound\":$latest_inbound,\"last_alerted\":$last_alerted}" > "$STATE_FILE"
fi

# Keep log trimmed
tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp.$$" 2>/dev/null && mv -f "${LOG_FILE}.tmp.$$" "$LOG_FILE"; rm -f "${LOG_FILE}.tmp.$$"

echo "[$(date)] STATUS: OK — Last inbound ${elapsed_min} min ago" >> "$LOG_FILE"
exit 0
