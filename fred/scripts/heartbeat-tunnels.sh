#!/bin/bash
# heartbeat-tunnels.sh — check ALL cloudflared tunnel logs (not just logs/*.log)
# Created 2026-10-07 after flap #15 revealed prior heartbeats only scanned 5 of 8 logs
# (ngkerk, riverwhisperer and the tingaling/named tunnel were being missed).
# Usage: bash scripts/heartbeat-tunnels.sh [YYYY-MM-DD]   (default: today, SAST)
cd "$(dirname "$0")/.." || exit 1
DAY="${1:-$(date +%Y-%m-%d)}"
ZDAY=$(TZ=UTC date -j -f "%Y-%m-%d" "$DAY" +%Y-%m-%d 2>/dev/null || echo "$DAY")
echo "=== tunnel errish scan for $DAY (SAST) / $ZDAY (UTC log stamp) ==="
LOGS=(
  "main:logs/cloudflared-main.log"
  "files:logs/cloudflared-files.log"
  "fred:logs/cloudflared-fred.log"
  "enrol:logs/cloudflared-enrol.log"
  "tracking:logs/cloudflared-tracking.log"
  "tingaling:whatsapp-server/cloudflared-named.log"
  "ngkerk:../ngkerk/cloudflared.log"
  "riverwhisperer:../river-whisperer/cloudflared.log"
)
TOTAL=0
for entry in "${LOGS[@]}"; do
  name="${entry%%:*}"; f="${entry#*:}"
  if [ ! -f "$f" ]; then echo "  $name: MISSING LOG ($f)"; continue; fi
  n=$(grep -a "$DAY\|$ZDAY" "$f" 2>/dev/null | grep -caiE "ERR|failed|timeout")
  last=$(grep -aiE "ERR|failed|timeout" "$f" 2>/dev/null | tail -1 | cut -c1-110)
  TOTAL=$((TOTAL+n))
  printf "  %-16s today:%-4s last: %s\n" "$name" "$n" "$last"
done
echo "  ---- today total errish: $TOTAL"
lastreal=$(for entry in "${LOGS[@]}"; do f="${entry#*:}"; [ -f "$f" ] && grep -aE "^2026.*(ERR|failed|timeout|WRN Connection terminated)" "$f" 2>/dev/null | tail -1; done | sort | tail -1)
echo "  last real errish across all logs: ${lastreal:0:130}"
