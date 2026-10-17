#!/bin/bash
# ── API / Model-Provider Watchdog — provider-independent ─────────────────
# WHY (2026-10-15): DeepSeek returned `402 Insufficient Balance` on EVERY
# model call from 2026-10-10T07:02:55Z to 2026-10-15T08:02:56Z. Because the
# whole alerting chain (heartbeats, daily reports, healthcheck logic) needs
# the LLM itself, the outage was completely silent for ~5 days. This script
# does NOT use the LLM — it probes the provider directly and alerts on its
# own, so a dead key/empty balance can never be silent again.
#
# Runs every 10 min via crontab.
#
# Checks:
#   1. DeepSeek balance API  (GET /user/balance)  → is_available + balance
#   2. DeepSeek inference    (1-token chat call)  → real 402/401/5xx
#   3. Local gateway         (127.0.0.1:18789)    → process/port alive
#
# Alerts (best-effort, on state transition + every 2h while still bad):
#   • Email via gog  (info@autoeffortless.com)  ← reliable, no LLM needed
#   • WhatsApp to Mr D (Graph API)              ← only works inside the 24h
#                                                 window; sent anyway
#   • macOS notification + say                  ← if someone is at the Mac
# ─────────────────────────────────────────────────────────────────────────

WS="/Users/deonvandenberg/.openclaw/workspace/fred"
LOG_FILE="$WS/logs/api-watchdog.log"
STATE_FILE="$WS/logs/api-watchdog-state.json"
ENV_FILE="$WS/whatsapp-server/.env"
ADMIN_NUMBER="${ADMIN_NUMBER-27615274429}"
ALERT_EMAIL="${ALERT_EMAIL-info@autoeffortless.com}"
LOW_BALANCE_CNY="${LOW_BALANCE_CNY:-30}"   # warn below this CNY balance (bumped 10→30 on 2026-10-15: observed burn ~CNY 23/day ⇒ old threshold left <1 day of runway)
REALERT_SECS=7200                          # re-alert while still bad (2h)
API_BASE="https://api.deepseek.com"

mkdir -p "$(dirname "$LOG_FILE")"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }
log "watchdog running..."

# ── 0. Find the DeepSeek key (read from the auth store at runtime) ──
KEY=""
for db in "$HOME/.openclaw/agents/fred/agent/openclaw-agent.sqlite" \
          "$HOME/.openclaw/agents/main/agent/openclaw-agent.sqlite"; do
  [ -f "$db" ] || continue
  KEY=$(sqlite3 "$db" "SELECT store_json FROM auth_profile_store;" 2>/dev/null \
    | python3 -c "
import sys,json
for line in sys.stdin:
    try: d=json.loads(line)
    except Exception: continue
    for p in (d.get('profiles') or {}).values():
        k=p.get('key')
        if k: print(k); break
" 2>/dev/null | head -1)
  [ -n "$KEY" ] && break
done

STATUS="ok"; DETAIL=""

if [ -z "$KEY" ]; then
  STATUS="config_error"; DETAIL="deepseek api key not found in auth store"
  log "  [FAIL] $DETAIL"
else
  # ── 1. Balance probe ──
  BAL_JSON=$(curl -s -m 20 -w "\n%{http_code}" "$API_BASE/user/balance" \
    -H "Authorization: Bearer $KEY" 2>/dev/null)
  BAL_CODE=$(echo "$BAL_JSON" | tail -1)
  BAL_BODY=$(echo "$BAL_JSON" | sed '$d')
  AVAIL=$(echo "$BAL_BODY" | python3 -c "
import sys,json,re
raw=sys.stdin.read()
m=re.search(r'\{.*\}',raw,re.S)
if not m: print(''); raise SystemExit
try:
    d=json.loads(m.group(0))
except Exception:
    print(''); raise SystemExit
print('true' if d.get('is_available') else 'false')
" 2>/dev/null)
  CNY=$(echo "$BAL_BODY" | python3 -c "
import sys,json,re
raw=sys.stdin.read()
m=re.search(r'\{.*\}',raw,re.S)
if not m: print(''); raise SystemExit
try: d=json.loads(m.group(0))
except Exception: print(''); raise SystemExit
for b in (d.get('balance_infos') or []):
    if b.get('currency')=='CNY': print(b.get('total_balance','')); break
" 2>/dev/null)
  log "  balance probe: http=$BAL_CODE available=$AVAIL cny=$CNY"

  if [ "$BAL_CODE" != "200" ]; then
    STATUS="provider_down"; DETAIL="balance API http $BAL_CODE"
  elif [ "$AVAIL" = "false" ]; then
    STATUS="balance_empty"; DETAIL="is_available=false (CNY $CNY)"
  fi

  # ── 2. Inference probe (catches 402 on real calls even if balance looks ok) ──
  if [ "$STATUS" = "ok" ]; then
    MODEL="${WATCHDOG_MODEL:-deepseek-chat}"
    CHAT=$(curl -s -m 30 -w "\n%{http_code}" "$API_BASE/chat/completions" \
      -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
      -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":1,\"stream\":false}" 2>/dev/null)
    CHAT_CODE=$(echo "$CHAT" | tail -1)
    CHAT_BODY=$(echo "$CHAT" | sed '$d' | head -c 300 | tr -d '\n')
    log "  inference probe: http=$CHAT_CODE"
    if [ "$CHAT_CODE" != "200" ]; then
      STATUS="provider_down"; DETAIL="chat http $CHAT_CODE: $CHAT_BODY"
      case "$CHAT_CODE" in
        401|403) STATUS="auth_error" ;;
        402)     STATUS="balance_empty" ;;
      esac
    fi
  fi

  # ── low-balance warning (only when otherwise healthy) ──
  if [ "$STATUS" = "ok" ] && [ -n "$CNY" ]; then
    LOW=$(python3 -c "print('1' if float('$CNY') < float('$LOW_BALANCE_CNY') else '0')" 2>/dev/null)
    [ "$LOW" = "1" ] && { STATUS="low_balance"; DETAIL="CNY balance $CNY below $LOW_BALANCE_CNY"; }
  fi
fi

# ── 3. Local gateway liveness (only meaningful when provider is healthy) ──
GW_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 8 http://127.0.0.1:18789/ 2>/dev/null)
GW_CODE=${GW_CODE:-000}
if [ "$GW_CODE" = "000" ] && [ "$STATUS" = "ok" ]; then
  STATUS="gateway_down"; DETAIL="local gateway :18789 unreachable"
fi
log "  gateway :18789 http=$GW_CODE"

# ── state transition + alert ──
PREV=""; PREV_TS=0
if [ -f "$STATE_FILE" ]; then
  PREV=$(python3 -c "import json;print(json.load(open('$STATE_FILE')).get('status',''))" 2>/dev/null)
  PREV_TS=$(python3 -c "import json;print(json.load(open('$STATE_FILE')).get('alerted_at',0))" 2>/dev/null)
  [ -z "$PREV_TS" ] && PREV_TS=0
fi
NOW=$(date +%s)
BAD=0
case "$STATUS" in ok) BAD=0 ;; *) BAD=1 ;; esac

ALERT=0; ALERTED_AT=$PREV_TS
if [ "$STATUS" != "$PREV" ] && [ "$BAD" = "1" ]; then
  ALERT=1; ALERTED_AT=$NOW
elif [ "$BAD" = "1" ] && [ "$PREV" != "" ] && [ "$((NOW - PREV_TS))" -ge "$REALERT_SECS" ]; then
  ALERT=1; ALERTED_AT=$NOW          # still bad after 2h → escalate again
elif [ "$STATUS" = "ok" ] && [ "$PREV" != "ok" ] && [ -n "$PREV" ]; then
  ALERT=1; ALERTED_AT=0             # recovery notice
fi

if [ "$ALERT" = "1" ]; then
  if [ "$STATUS" = "ok" ]; then
    SUBJ="🟢 Model API recovered — Fred's watchdog"
    BODY="Model provider is healthy again.\n\nStatus: ok\nBalance (CNY): $CNY\nGateway :18789: $GW_CODE\nPrevious: $PREV\nTime: $(date '+%Y-%m-%d %H:%M SAST')"
  else
    SUBJ="🔴 Model API problem ($STATUS) — Fred's watchdog"
    BODY="Provider-independent watchdog detected a problem — the AI may be unable to run.\n\nStatus: $STATUS\nDetail: $DETAIL\nBalance (CNY): $CNY\nGateway :18789: $GW_CODE\nTime: $(date '+%Y-%m-%d %H:%M SAST')\n\nThis alert does NOT depend on the LLM. Check the DeepSeek account balance / API key."
  fi
  log "  [ALERT] $PREV→$STATUS :: $DETAIL"

  # (a) WhatsApp (best effort — fails outside the 24h window, code 131047)
  TOKEN=$(grep -E '^WHATSAPP_TOKEN=' "$ENV_FILE" 2>/dev/null | sed 's/WHATSAPP_TOKEN=//')
  PHONE_ID=$(grep -E '^PHONE_NUMBER_ID=' "$ENV_FILE" 2>/dev/null | sed 's/PHONE_NUMBER_ID=//')
  if [ -n "$TOKEN" ] && [ -n "$PHONE_ID" ]; then
    WA_BODY=$(printf '%s' "$BODY" | sed 's/\\n/\\n/g')
    curl -s -m 20 -X POST "https://graph.facebook.com/v22.0/$PHONE_ID/messages" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d "{\"messaging_product\":\"whatsapp\",\"to\":\"$ADMIN_NUMBER\",\"type\":\"text\",\"text\":{\"body\":\"$WA_BODY\"}}" \
      > /dev/null 2>&1 && log "  [ALERT] WhatsApp attempted → $ADMIN_NUMBER" || log "  [ALERT] WhatsApp send failed"
  fi

  # (b) Email (reliable, no LLM involved)
  if command -v gog >/dev/null 2>&1; then
    printf '%b\n' "$BODY" | gog gmail send -a "$ALERT_EMAIL" --to "$ALERT_EMAIL" \
      --subject "$SUBJ" --body-file - --no-input >/dev/null 2>&1 \
      && log "  [ALERT] email sent → $ALERT_EMAIL" \
      || log "  [ALERT] email send FAILED"
  fi

  # (c) macOS notification (only if a user is logged into the GUI)
  /usr/bin/osascript -e "display notification \"$STATUS: $DETAIL\" with title \"$SUBJ\"" >/dev/null 2>&1
fi

echo "{\"status\":\"$STATUS\",\"detail\":\"$DETAIL\",\"balance_cny\":\"$CNY\",\"gateway\":\"$GW_CODE\",\"alerted_at\":$ALERTED_AT,\"updated\":\"$(date '+%Y-%m-%d %H:%M SAST')\",\"checked_at\":$NOW}" > "$STATE_FILE"

# trim log
tail -n 800 "$LOG_FILE" > "${LOG_FILE}.tmp.$$" 2>/dev/null && mv -f "${LOG_FILE}.tmp.$$" "$LOG_FILE" 2>/dev/null
rm -f "${LOG_FILE}.tmp.$$" 2>/dev/null

case "$STATUS" in
  ok)          log "STATUS: OK — provider + gateway healthy"; exit 0 ;;
  low_balance) log "STATUS: WARNING — $DETAIL"; exit 1 ;;
  *)           log "STATUS: CRITICAL — $STATUS :: $DETAIL"; exit 2 ;;
esac
