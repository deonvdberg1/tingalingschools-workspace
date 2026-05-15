#!/bin/bash
# Start cloudflare tunnel and auto-update Meta webhook URL
# This ensures the webhook always points to the current tunnel URL

TUNNEL_LOG="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/cloudflared.log"
SCRIPT_LOG="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/tunnel-setup.log"
SERVER_LOG="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/server.log"

echo "[$(date)] Tunnel setup starting..." >> "$SCRIPT_LOG"
TOKEN="EAAZALa2UgbOEBRfGmd0TdVlZAfW1ZB0dAtJWX0nUbpeH6fTUNB01KvrGsbWTTcZABycEHqzkkprJ6vzF6QiUFmrq9To8proavvtL7lUAqaFanUFjAlQkJ2FMHZBrt8ds2QF8IUUvAeTzbYxLMFNz0efZBNjmZBco8vRWw3V2J1H9ZCH5ZC7qosH41bSNjBXKFLYZCoNAZDZD"
PHONE_ID="1046384845235600"
WABA_ID="1124652154068427"
APP_ID="1771774490471649"
APP_SECRET="0bbe38af7da7c916126eca7576453619"
VERIFY_TOKEN="tingaling-schools-verify-2026"

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
echo "$URL" > /Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/tunnel-url.txt

# Update Meta webhook subscription via app
CALLBACK_URL="${URL}/webhooks/whatsapp"
echo "[$(date)] Updating webhook URL to: $CALLBACK_URL" | tee -a "$SCRIPT_LOG"

# Get app token
APP_TOKEN=$(curl -s -X GET "https://graph.facebook.com/v21.0/oauth/access_token?client_id=$APP_ID&client_secret=$APP_SECRET&grant_type=client_credentials" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

# Update the subscription
RESULT=$(curl -s -X POST "https://graph.facebook.com/v21.0/$APP_ID/subscriptions" \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"object\": \"whatsapp_business_account\",
    \"callback_url\": \"$CALLBACK_URL\",
    \"verify_token\": \"$VERIFY_TOKEN\",
    \"fields\": [\"messages\"]
  }")

if echo "$RESULT" | python3 -c "import sys,json; print('success' in json.load(sys.stdin))" 2>/dev/null | grep -q true; then
    echo "[$(date)] ✅ Webhook URL updated successfully" | tee -a "$SCRIPT_LOG"
else
    echo "[$(date)] ❌ Failed to update webhook: $RESULT" | tee -a "$SCRIPT_LOG"
fi

# Wait for tunnel process
wait $TUNNEL_PID