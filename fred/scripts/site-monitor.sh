#!/bin/bash
# ── Website Monitor — tingalingschools.com ───────────────────────────────
# Runs every 10 min via crontab.
# Checks the PUBLIC school site (GitHub Pages SPA):
#   1. HTTP status must be 200
#   2. Raw HTML must reference the app bundle
#   3. REAL RENDER CHECK: headless Chrome must execute the React app and
#      produce expected content with NO crash markers (this catches the
#      "HTTP 200 but blank/broken page" class of bugs — e.g. the
#      useAuth/AuthProvider crash on 2026-08-05).
# Alerts via WhatsApp ONLY on state transitions (OK→FAIL or FAIL→OK).
# ─────────────────────────────────────────────────────────────────────────

URL="https://tingalingschools.com"
ENV_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server/.env"
LOG_FILE="/Users/deonvandenberg/.openclaw/workspace/fred/logs/site-monitor.log"
STATE_FILE="/tmp/site-monitor-state.json"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP_DOM="/tmp/site-monitor-dom.html"

TOKEN=$(grep -E '^WHATSAPP_TOKEN=' "$ENV_FILE" 2>/dev/null | sed 's/WHATSAPP_TOKEN=//')
PHONE_ID=$(grep -E '^PHONE_NUMBER_ID=' "$ENV_FILE" 2>/dev/null | sed 's/PHONE_NUMBER_ID=//')
ADMIN_NUMBER="27615274429"

FAILURES=""
WARNINGS=""

mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Site monitor running..." >> "$LOG_FILE"

# ── 1. HTTP status ──
HTTP_CODE=$(curl -sL -o /dev/null -w "%{http_code}" --connect-timeout 15 --max-time 30 "$URL/" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo "  [OK] HTTP 200" >> "$LOG_FILE"
else
  echo "  [FAIL] HTTP $HTTP_CODE" >> "$LOG_FILE"
  FAILURES="$FAILURES http($HTTP_CODE)"
fi

# ── 2. Raw HTML sanity (bundle referenced) ──
RAW_HTML=$(curl -sL --connect-timeout 15 --max-time 30 "$URL/" 2>/dev/null)
if echo "$RAW_HTML" | grep -q '/assets/index-.*\.js'; then
  BUNDLE=$(echo "$RAW_HTML" | grep -oE 'index-[^"]+\.js' | head -1)
  echo "  [OK] Bundle referenced: $BUNDLE" >> "$LOG_FILE"
else
  echo "  [FAIL] No app bundle referenced in HTML" >> "$LOG_FILE"
  FAILURES="$FAILURES no-bundle"
fi

# ── 3. Real render check (headless Chrome) ──
render_check() {
  rm -f "$TMP_DOM"
  "$CHROME" --headless=new --disable-gpu --no-sandbox --user-agent="TingalingSiteMonitor/1.0" \
    --virtual-time-budget=20000 --dump-dom "$URL/" > "$TMP_DOM" 2>/dev/null &
  local CPID=$!
  local waited=0
  while kill -0 "$CPID" 2>/dev/null; do
    sleep 1; waited=$((waited+1))
    [ "$waited" -gt 90 ] && kill -9 "$CPID" 2>/dev/null && break
  done
  wait "$CPID" 2>/dev/null

  local problems=""
  [ ! -s "$TMP_DOM" ] && { echo "render: empty DOM"; return 1; }

  if grep -q 'useAuth must be used' "$TMP_DOM"; then problems="$problems auth-crash"; fi
  if grep -q 'Something went wrong' "$TMP_DOM"; then problems="$problems error-boundary"; fi
  if grep -q 'Back to Home' "$TMP_DOM"; then problems="$problems error-page"; fi
  if ! grep -q 'Ting-A-Ling Schools' "$TMP_DOM"; then problems="$problems missing-title"; fi
  if ! grep -q 'Pre-Primary' "$TMP_DOM"; then problems="$problems missing-content"; fi

  if [ -z "$problems" ]; then return 0; else echo "render:$problems"; return 1; fi
}

render_check_problem_desc() {
  local d=""
  grep -q 'useAuth must be used' "$TMP_DOM" && d="$d auth-crash"
  grep -q 'Something went wrong' "$TMP_DOM" && d="$d error-boundary"
  grep -q 'Back to Home' "$TMP_DOM" && d="$d error-page"
  grep -q 'Ting-A-Ling Schools' "$TMP_DOM" || d="$d missing-title"
  grep -q 'Pre-Primary' "$TMP_DOM" || d="$d missing-content"
  [ -s "$TMP_DOM" ] || d="$d empty-dom"
  echo "${d:-unknown}"
}

if [ -x "$CHROME" ]; then
  if render_check; then
    echo "  [OK] Render check passed — app boots, content present, no crash markers" >> "$LOG_FILE"
  else
    # Retry once before failing (avoids false alarms on CDN/deploy flakiness)
    echo "  [WARN] Render check failed, retrying in 30s..." >> "$LOG_FILE"
    sleep 30
    if render_check; then
      echo "  [OK] Render check passed on retry" >> "$LOG_FILE"
    else
      RENDER_PROBLEM=$(render_check_problem_desc)
      echo "  [FAIL] Render check failed: $RENDER_PROBLEM" >> "$LOG_FILE"
      FAILURES="$FAILURES render($RENDER_PROBLEM)"
    fi
  fi
else
  echo "  [WARN] Chrome not found at $CHROME — cannot verify render" >> "$LOG_FILE"
  WARNINGS="$WARNINGS chrome-unavailable"
fi

# ── State transition logic (alert only on change, no spam) ──
current_status="ok"
[ -n "$WARNINGS" ] && current_status="warning"
[ -n "$FAILURES" ] && current_status="critical"

previous_status=""
[ -f "$STATE_FILE" ] && previous_status=$(grep -o '"status":"[^"]*"' "$STATE_FILE" 2>/dev/null | cut -d'"' -f4)

if [ "$current_status" != "$previous_status" ]; then
  if [ -n "$TOKEN" ] && [ -n "$PHONE_ID" ]; then
    if [ "$current_status" = "critical" ]; then
      ALERT_MSG="🔴 *Ting-A-Ling Website Alert* — tingalingschools.com BROKEN\\n\\nFailures:$FAILURES\\nTime: $(date '+%Y-%m-%d %H:%M SAST')\\n\\nCheck: $URL"
    elif [ "$current_status" = "warning" ]; then
      ALERT_MSG="🟡 *Ting-A-Ling Website Alert* — Degraded\\n\\nWarnings:$WARNINGS\\nTime: $(date '+%Y-%m-%d %H:%M SAST')"
    else
      if [ -z "$previous_status" ]; then
        ALERT_MSG="🟢 *Ting-A-Ling Website Monitor* — Live ✅\\n\\n$URL is healthy — all checks passing (HTTP, bundle, real render).\\nTime: $(date '+%Y-%m-%d %H:%M SAST')"
      else
        ALERT_MSG="🟢 *Ting-A-Ling Website* — Restored ✅\\n\\n$URL is serving correctly again.\\nTime: $(date '+%Y-%m-%d %H:%M SAST')"
      fi
    fi

    curl -s -X POST "https://graph.facebook.com/v22.0/$PHONE_ID/messages" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"messaging_product\":\"whatsapp\",\"to\":\"$ADMIN_NUMBER\",\"type\":\"text\",\"text\":{\"body\":\"$ALERT_MSG\"}}" > /dev/null 2>&1

    echo "  [ALERT] State change ($previous_status→$current_status): WhatsApp sent to $ADMIN_NUMBER" >> "$LOG_FILE"
  fi
fi

echo "{\"status\":\"$current_status\",\"updated\":\"$(date '+%Y-%m-%d %H:%M SAST')\"}" > "$STATE_FILE"

# Keep log trimmed
tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp.$$" 2>/dev/null && mv -f "${LOG_FILE}.tmp.$$" "$LOG_FILE"; rm -f "${LOG_FILE}.tmp.$$"

if [ -n "$FAILURES" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] STATUS: CRITICAL — Failures:$FAILURES" >> "$LOG_FILE"
  exit 2
elif [ -n "$WARNINGS" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] STATUS: WARNING — Warnings:$WARNINGS" >> "$LOG_FILE"
  exit 1
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] STATUS: OK — all checks passed" >> "$LOG_FILE"
  exit 0
fi
