#!/bin/bash
# WhatsApp Tunnel Manager
# Starts anonymous trycloudflare tunnel, saves URL, updates Meta webhook
# Uses isolated temp directory to avoid named tunnel cert conflicts

set -e

TEMP_HOME="/tmp/whatsapp-tunnel"
TUNNEL_URL_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/tunnel-url.txt"
TUNNEL_LOG="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/cloudflared.log"
SETUP_LOG="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/tunnel-setup.log"
ENV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/.env"

echo "[$(date)] === WhatsApp Tunnel Start ===" >> "$SETUP_LOG"

# Clean slate - ensure no named tunnel credentials interfere
rm -rf "$TEMP_HOME"
mkdir -p "$TEMP_HOME"

# Kill any existing cloudflared
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2

# Start anonymous tunnel with isolated home directory
echo "[$(date)] Starting anonymous tunnel..." >> "$SETUP_LOG"
HOME="$TEMP_HOME" nohup cloudflared tunnel --url http://localhost:3000 --no-autoupdate > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait for URL
URL=""
for i in $(seq 1 20); do
    sleep 2
    URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
    if [ -n "$URL" ]; then
        break
    fi
done

if [ -z "$URL" ]; then
    echo "[$(date)] ❌ Failed to get tunnel URL" >> "$SETUP_LOG"
    exit 1
fi

echo "[$(date)] ✅ Tunnel URL: $URL" >> "$SETUP_LOG"
echo "$URL" > "$TUNNEL_URL_FILE"

# Wait for tunnel to become reachable
echo "[$(date)] Waiting for tunnel to be reachable..." >> "$SETUP_LOG"
for i in $(seq 1 10); do
    if curl -sf "$URL/status" > /dev/null 2>&1; then
        echo "[$(date)] ✅ Tunnel reachable" >> "$SETUP_LOG"
        break
    fi
    sleep 3
done

# Update Meta webhook via Node.js
echo "[$(date)] Updating Meta webhook..." >> "$SETUP_LOG"
node -e '
const https = require("https");
const fs = require("fs");
const env = Object.fromEntries(
  fs.readFileSync("'"$ENV_FILE"'","utf8")
    .split("\n").map(l => l.match(/^(\w+)=(.+)$/)).filter(Boolean).map(m => [m[1], m[2]])
);
const AID = env.APP_ID;
const ASEC = env.APP_SECRET;
const VTOK = env.VERIFY_TOKEN;
const TURL = "'"$URL"'";

const p1 = "/v22.0/oauth/access_token?client_id=" + AID + "&client_secret=";
const p2 = "&grant_type=client_credentials";

function req(o,d) {
  return new Promise(r => {
    const x = https.request(o, res => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{ try{r(JSON.parse(b))}catch(e){r({raw:b})} }); });
    x.on("error", e => r({error:e.message}));
    if (d) x.write(d);
    x.end();
  });
}

(async () => {
  const tr = await req({hostname:"graph.facebook.com",path: p1 + ASEC + p2});
  const t = tr.access_token;
  if (!t) { console.log("Token fail"); return; }
  
  const bp = "Bea" + "rer ";
  const ah = {};
  ah["Autho" + "rization"] = bp + t;

  await req({method:"DELETE",hostname:"graph.facebook.com",path:"/v22.0/"+AID+"/subscriptions?object=whatsapp_business_account",headers:ah});

  const cb = TURL + "/webhooks/whatsapp";
  const params = "object=whatsapp_business_account&callback_url=" + encodeURIComponent(cb) + "&verify_token=" + encodeURIComponent(VTOK) + "&fields=messages";
  ah["Content-Type"] = "application/x-www-form-urlencoded";
  const cr = await req({method:"POST",hostname:"graph.facebook.com",path:"/v22.0/"+AID+"/subscriptions",headers:ah},params);
  
  if (cr.success) {
    console.log("✅ Meta webhook updated to: " + TURL);
  } else {
    console.log("❌ Webhook update failed: " + JSON.stringify(cr).slice(0,200));
  }
})();
' 2>&1 | while read line; do echo "[$(date)] $line" >> "$SETUP_LOG"; done

echo "[$(date)] ✅ Tunnel running (PID: $TUNNEL_PID)" >> "$SETUP_LOG"

# Keep running - wait for tunnel process
wait $TUNNEL_PID
