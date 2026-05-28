#!/bin/bash
# WhatsApp API Health Check — runs on cron
# Checks: server, tunnel, API, webhook, disk
# Exits: 0 = all good, 1 = warning, 2 = critical

PERMANENT_URL="https://whatsapp.autoeffortless.com"
ENV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/.env"
LOG_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/healthcheck.log"

# Extract token safely
TOKEN=$(grep -E '^WHATSAPP_TOKEN=' "$ENV_FILE" 2>/dev/null | sed 's/WHATSAPP_TOKEN=//')

FAILURES=""
WARNINGS=""

echo "[$(date)] Health check running..." >> "$LOG_FILE"

# 1. Server check
if curl -sf http://localhost:3000/status > /dev/null 2>&1; then
  echo "  [OK] WhatsApp server running" >> "$LOG_FILE"
else
  echo "  [FAIL] WhatsApp server DOWN" >> "$LOG_FILE"
  FAILURES="$FAILURES server"
fi

# 2. Named tunnel via permanent URL
if curl -sf --connect-timeout 10 "$PERMANENT_URL/status" > /dev/null 2>&1; then
  echo "  [OK] Named tunnel live: $PERMANENT_URL" >> "$LOG_FILE"
else
  echo "  [FAIL] Named tunnel DOWN: $PERMANENT_URL" >> "$LOG_FILE"
  FAILURES="$FAILURES tunnel"
fi

# 3. Dashboard API
if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
  echo "  [OK] Dashboard API running" >> "$LOG_FILE"
else
  echo "  [FAIL] Dashboard API DOWN" >> "$LOG_FILE"
  FAILURES="$FAILURES dashboard-api"
fi

# 4. Meta API check
if [ -n "$TOKEN" ]; then
  API_RESULT=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "https://graph.facebook.com/v22.0/1046384845235600?fields=id,quality_rating" 2>/dev/null)

  if echo "$API_RESULT" | grep -q '"quality_rating"'; then
    Q_RATING=$(echo "$API_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('quality_rating','?'))" 2>/dev/null)
    echo "  [OK] Meta API — Quality: $Q_RATING" >> "$LOG_FILE"
  else
    ERROR_MSG=$(echo "$API_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',{}).get('message','unknown'))" 2>/dev/null)
    echo "  [FAIL] Meta API error: $ERROR_MSG" >> "$LOG_FILE"
    FAILURES="$FAILURES meta-api"
  fi
else
  echo "  [FAIL] No token found in .env" >> "$LOG_FILE"
  FAILURES="$FAILURES token"
fi

# 5. Webhook challenge test
WEBHOOK_CHALLENGE=$(curl -s -o /dev/null -w "%{http_code}" "$PERMANENT_URL/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=tingaling-schools-verify-2026&hub.challenge=ok" 2>/dev/null)
if [ "$WEBHOOK_CHALLENGE" = "200" ]; then
  echo "  [OK] Webhook challenge passed" >> "$LOG_FILE"
else
  echo "  [FAIL] Webhook challenge failed (HTTP $WEBHOOK_CHALLENGE)" >> "$LOG_FILE"
  FAILURES="$FAILURES webhook"
fi

# 6. Disk check
DISK=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK" -gt 85 ]; then
  echo "  [FAIL] Disk critical at ${DISK}%" >> "$LOG_FILE"
  FAILURES="$FAILURES disk"
elif [ "$DISK" -gt 75 ]; then
  echo "  [WARN] Disk at ${DISK}%" >> "$LOG_FILE"
  WARNINGS="$WARNINGS disk"
else
  echo "  [OK] Disk at ${DISK}%" >> "$LOG_FILE"
fi

# 7. LaunchAgent check
if launchctl list | grep -q "com.tingaling.cloudflared-named"; then
  echo "  [OK] Named tunnel LaunchAgent loaded" >> "$LOG_FILE"
else
  echo "  [FAIL] Named tunnel LaunchAgent not loaded" >> "$LOG_FILE"
  FAILURES="$FAILURES launchagent"
fi

# Keep last 500 lines in log
# Send WhatsApp alert on failures
if [ -n "$FAILURES" ]; then
  ADMIN_NUMBER="27615274429"
  TOKEN=$(grep -E "^WHATSAPP_TOKEN=" "$ENV_FILE" 2>/dev/null | sed "s/WHATSAPP_TOKEN=//")
  PHONE_ID=$(grep -E "^PHONE_NUMBER_ID=" "$ENV_FILE" 2>/dev/null | sed "s/PHONE_NUMBER_ID=//")
  if [ -n "$TOKEN" ] && [ -n "$PHONE_ID" ]; then
    ALERT_MSG="🚨 *AutoEffortless Alert*\nService(s) DOWN:$FAILURES\nTime: $(date)"
    curl -s -X POST "https://graph.facebook.com/v22.0/$PHONE_ID/messages" 
      -H "Authorization: Bearer $TOKEN" 
      -H "Content-Type: application/json" 
      -d "{"messaging_product":"whatsapp","to":"$ADMIN_NUMBER","type":"text","text":{"body":"$ALERT_MSG"}}" > /dev/null 2>&1
    echo "  [ALERT] WhatsApp sent to $ADMIN_NUMBER" >> "$LOG_FILE"
  fi
fi
tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" 2>/dev/null && mv "${LOG_FILE}.tmp" "$LOG_FILE"

# Report summary
if [ -n "$FAILURES" ]; then
  echo "[$(date)] STATUS: CRITICAL — Failures:$FAILURES" >> "$LOG_FILE"
  echo "CRITICAL:$FAILURES"
  exit 2
elif [ -n "$WARNINGS" ]; then
  echo "[$(date)] STATUS: WARNING — Warnings:$WARNINGS" >> "$LOG_FILE"
  echo "WARNING:$WARNINGS"
  exit 1
else
  echo "[$(date)] STATUS: OK — All 7 checks passed" >> "$LOG_FILE"
  exit 0
fi
