#!/bin/bash
# Fred's Startup Validation
# Runs on session start to verify all systems are healthy
# Silent unless something is wrong

set -e

WORKSPACE="/Users/deonvandenberg/.openclaw/workspace/fred"
URL_FILE="$WORKSPACE/whatsapp-server/tunnel-url.txt"
LOG="$WORKSPACE/whatsapp-server/server.log"
DASH_LOG="$WORKSPACE/dashboard-api/api.log"

errors=0

# 1. WhatsApp server
if curl -sf http://localhost:3000/status > /dev/null 2>&1; then
  echo "[OK] WhatsApp server on port 3000"
else
  echo "[FAIL] WhatsApp server not responding"
  errors=$((errors+1))
fi

# 2. Dashboard API
if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
  echo "[OK] Dashboard API on port 3001"
else
  echo "[FAIL] Dashboard API not responding"
  errors=$((errors+1))
fi

# 3. Named tunnel
if curl -m 10 -sf "https://whatsapp.autoeffortless.com/status" > /dev/null 2>&1; then
  echo "[OK] Named tunnel - whatsapp.autoeffortless.com"
else
  echo "[FAIL] Named tunnel not reachable"
  errors=$((errors+1))
fi

# 4. Webhook URL matches tunnel
if [ -f "$URL_FILE" ]; then
  URL=$(cat "$URL_FILE")
  if [ "$URL" = "https://whatsapp.autoeffortless.com" ]; then
    echo "[OK] Tunnel URL matches expected"
  else
    echo "[WARN] Tunnel URL file has unexpected value: $URL"
  fi
else
  echo "[WARN] Tunnel URL file missing"
fi

# 5. Disk space
DISK_USED=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USED" -lt 85 ]; then
  echo "[OK] Disk: ${DISK_USED}% used"
else
  echo "[WARN] Disk at ${DISK_USED}%"
fi

# 6. Log sizes
for f in server.log; do
  if [ -f "$WORKSPACE/whatsapp-server/$f" ]; then
    SIZE=$(stat -f%z "$WORKSPACE/whatsapp-server/$f" 2>/dev/null)
    if [ "$SIZE" -gt 1048576 ]; then
      echo "[WARN] $f is ${SIZE} bytes (may need rotation)"
    fi
  fi
done

echo ""
echo "=== Startup check complete: $errors errors ==="
exit $errors
