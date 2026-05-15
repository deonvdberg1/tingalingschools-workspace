# Heartbeat Monitor
# Fred checks these on every session start

SERVER_LOG="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/server.log"

# Check if server is running
if curl -sf http://localhost:3000/status > /dev/null 2>&1; then
    echo "[$(date)] ✅ WhatsApp server running"
else
    echo "[$(date)] ❌ WhatsApp server DOWN"
fi

# Check if tunnel is up
TUNNEL_URL=$(cat /Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/tunnel-url.txt 2>/dev/null)
if [ -n "$TUNNEL_URL" ] && curl -sf "$TUNNEL_URL/dashboard" > /dev/null 2>&1; then
    echo "[$(date)] ✅ Tunnel live: $TUNNEL_URL"
else
    echo "[$(date)] ❌ Tunnel DOWN"
fi

# Check disk space
DISK=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK" -gt 80 ]; then
    echo "[$(date)] ⚠️  Disk at ${DISK}%"
fi
