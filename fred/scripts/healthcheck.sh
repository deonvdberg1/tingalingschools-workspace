#!/bin/bash
# WhatsApp API Health Check — runs on cron
# Checks: server, tunnel, API, webhook, disk
# Exits: 0 = all good, 1 = warning, 2 = critical

ENV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/.env"
TUNNEL_URL_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/tunnel-url.txt"
LOG_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/healthcheck.log"

# Extract token safely
TOKEN=$(grep -E '^WHATSAPP_TOKEN=' "$ENV_FILE" 2>/dev/null | sed 's/WHATSAPP_TOKEN=//')

FAILURES=""
WARNINGS=""

echo "[$(date)] Health check running..." >> "$LOG_FILE"

# 1. Server check
if curl -sf http://localhost:3000/status > /dev/null 2>&1; then
  echo "  [OK] Server running" >> "$LOG_FILE"
else
  echo "  [FAIL] Server DOWN" >> "$LOG_FILE"
  FAILURES="$FAILURES server"
fi

# 2. Tunnel check
TUNNEL_URL=$(cat "$TUNNEL_URL_FILE" 2>/dev/null)
if [ -n "$TUNNEL_URL" ]; then
  # Try normal DNS first, fall back to direct Cloudflare IP resolve (DNS cache can be stale)
  if curl -sf --connect-timeout 5 "$TUNNEL_URL/status" > /dev/null 2>&1; then
    echo "  [OK] Tunnel live: $TUNNEL_URL" >> "$LOG_FILE"
  elif curl -sf --connect-timeout 8 --resolve "$(echo $TUNNEL_URL | sed 's|https://||;s|/.*||'):443:104.16.231.132" "$TUNNEL_URL/status" > /dev/null 2>&1; then
    echo "  [OK] Tunnel live (via alt DNS): $TUNNEL_URL" >> "$LOG_FILE"
  else
    echo "  [FAIL] Tunnel DOWN: $TUNNEL_URL" >> "$LOG_FILE"
    FAILURES="$FAILURES tunnel"
  fi
else
  echo "  [FAIL] No tunnel URL file" >> "$LOG_FILE"
  FAILURES="$FAILURES tunnel"
fi

# 3. API check — test Meta API
if [ -n "$TOKEN" ]; then
  API_RESULT=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "https://graph.facebook.com/v22.0/1046384845235600?fields=id,quality_rating" 2>/dev/null)

  if echo "$API_RESULT" | grep -q '"quality_rating"'; then
    Q_RATING=$(echo "$API_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('quality_rating','?'))" 2>/dev/null)
    echo "  [OK] API responding — Quality: $Q_RATING" >> "$LOG_FILE"
  else
    ERROR_MSG=$(echo "$API_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',{}).get('message','unknown'))" 2>/dev/null)
    echo "  [FAIL] API error: $ERROR_MSG" >> "$LOG_FILE"
    FAILURES="$FAILURES api"
  fi
else
  echo "  [FAIL] No token found in .env" >> "$LOG_FILE"
  FAILURES="$FAILURES token"
fi

# 4. Disk check
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

# Keep last 500 lines in log
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
  echo "[$(date)] STATUS: OK — All checks passed" >> "$LOG_FILE"
  exit 0
fi
