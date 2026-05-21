#!/bin/bash
# Start cloudflare tunnel and auto-update Meta webhook URL
# This ensures the webhook always points to the current tunnel URL

TUNNEL_LOG="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/cloudflared.log"
SCRIPT_LOG="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/tunnel-setup.log"
ENV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/.env"
TUNNEL_URL_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/tunnel-url.txt"
API_VERSION="v22.0"

echo "[$(date)] Tunnel setup starting..." >> "$SCRIPT_LOG"

# Load tokens from .env (never hardcode secrets)
source <(grep -E '^(WHATSAPP_TOKEN|PHONE_NUMBER_ID|WABA_ID|APP_ID|APP_SECRET|VERIFY_TOKEN)=' "$ENV_FILE" 2>/dev/null)

# Fallbacks if .env loading fails
: "${WHATSAPP_TOKEN:=}"
: "${PHONE_NUMBER_ID:=1046384845235600}"
: "${WABA_ID:=1124652154068427}"
: "${APP_ID:=1771774490471649}"
: "${APP_SECRET:=}"
: "${VERIFY_TOKEN:=tingaling-schools-verify-2026}"

# Start tunnel in background
echo "[$(date)] Starting cloudflare tunnel..." | tee -a "$SCRIPT_LOG"
cloudflared tunnel --url http://localhost:3000 --no-autoupdate > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait for tunnel URL to appear
echo "[$(date)] Waiting for tunnel URL..." | tee -a "$SCRIPT_LOG"
URL=""
for i in $(seq 1 15); do
    sleep 2
    URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
    if [ -n "$URL" ]; then
        break
    fi
done

if [ -z "$URL" ]; then
    echo "[$(date)] ❌ Tunnel URL not found after 30s" | tee -a "$SCRIPT_LOG"
    exit 1
fi

echo "[$(date)] ✅ Tunnel URL: $URL" | tee -a "$SCRIPT_LOG"
echo "$URL" > "$TUNNEL_URL_FILE"

# Update Meta webhook subscription via app
CALLBACK_URL="${URL}/webhooks/whatsapp"
echo "[$(date)] Updating webhook URL to: $CALLBACK_URL" | tee -a "$SCRIPT_LOG"

# Get app token
APP_TOKEN=""
if [ -n "$APP_SECRET" ]; then
  APP_TOKEN=$(curl -s -X GET "https://graph.facebook.com/${API_VERSION}/oauth/access_token?client_id=$APP_ID&client_secret=$APP_SECRET&grant_type=client_credentials" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
fi

if [ -n "$APP_TOKEN" ]; then
  # Delete old subscription first, then create new one
  curl -s -X DELETE "https://graph.facebook.com/${API_VERSION}/$APP_ID/subscriptions?object=whatsapp_business_account" \
    -H "Authorization: Bearer $APP_TOKEN" > /dev/null 2>&1

  RESULT=$(curl -s -X POST "https://graph.facebook.com/${API_VERSION}/$APP_ID/subscriptions" \
    -H "Authorization: Bearer $APP_TOKEN" \
    -d "object=whatsapp_business_account" \
    -d "callback_url=$CALLBACK_URL" \
    -d "verify_token=$VERIFY_TOKEN" \
    -d "fields=messages")

  if echo "$RESULT" | python3 -c "import sys,json; print('success' in json.load(sys.stdin).get('data',{}))" 2>/dev/null | grep -q true || echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null | grep -q true; then
    echo "[$(date)] ✅ Webhook URL updated successfully" | tee -a "$SCRIPT_LOG"
  else
    echo "[$(date)] ⚠️ Webhook update result: $RESULT" | tee -a "$SCRIPT_LOG"
  fi
else
  echo "[$(date)] ⚠️ No APP_SECRET — skipping webhook URL update" | tee -a "$SCRIPT_LOG"
fi

# Also subscribe to the real WABA for message delivery events
if [ -n "$WHATSAPP_TOKEN" ]; then
  SUB_RESULT=$(curl -s -X POST \
    -H "Authorization: Bearer $WHATSAPP_TOKEN" \
    "https://graph.facebook.com/${API_VERSION}/996583169477166/subscribed_apps?subscribed_fields=messages,message_deliveries,read_receipts" 2>/dev/null)

  if echo "$SUB_RESULT" | grep -q 'success'; then
    echo "[$(date)] ✅ WABA subscribed for delivery receipts" | tee -a "$SCRIPT_LOG"
  else
    echo "[$(date)] ⚠️ WABA subscribe result: $SUB_RESULT" | tee -a "$SCRIPT_LOG"
  fi
fi

# Wait for tunnel process
wait $TUNNEL_PID