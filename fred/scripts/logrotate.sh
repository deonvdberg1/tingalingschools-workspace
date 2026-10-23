#!/bin/bash
# ── Simple log rotation for Fred's services (added 2026-10-22) ──────────
# WHY: cloudflared logs had no rotation — tracking hit 26 MB, main 19 MB by
#      Oct 22 (flagged in heartbeats since Oct 21, never actioned).
# HOW: launchd keeps StandardOutPath/StandardErrorPath file handles open with
#      O_APPEND, so we must NOT rename the file (writes would keep going into
#      the renamed inode). Instead: gzip a copy → truncate the live file.
#      Truncation is safe with O_APPEND: the next write lands at offset 0.
# Keeps gzipped history in logs/archive/ for 14 days.
# Run: daily 03:10 via LaunchAgent com.autoeffortless.logrotate
# ─────────────────────────────────────────────────────────────────────────

set -u
BASE="/Users/deonvandenberg/.openclaw/workspace/fred"
ARCHIVE="$BASE/logs/archive"
THRESHOLD_MB=10
KEEP_DAYS=14
LOG="$BASE/logs/logrotate.log"

mkdir -p "$ARCHIVE"
echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] logrotate start (threshold ${THRESHOLD_MB}MB)" >> "$LOG"

rotate_one() {
  local f="$1"
  [ -f "$f" ] || return 0
  local mb
  mb=$(du -m "$f" 2>/dev/null | awk '{print $1}')
  [ -z "$mb" ] && return 0
  if [ "$mb" -lt "$THRESHOLD_MB" ]; then
    return 0
  fi
  local name stamp tmp
  name=$(basename "$f" .log)
  stamp=$(date '+%Y%m%d-%H%M')
  tmp="$ARCHIVE/${name}-${stamp}.log.gz"
  if cp "$f" /tmp/.lrtmp.$$ 2>/dev/null && gzip -c /tmp/.lrtmp.$$ > "$tmp" 2>/dev/null; then
    : > "$f"   # truncate live file (appenders continue at EOF)
    echo "  rotated $name (${mb}MB) → archive/$(basename "$tmp")" >> "$LOG"
  else
    echo "  [!] FAILED to rotate $name (${mb}MB) — left untouched" >> "$LOG"
  fi
  rm -f /tmp/.lrtmp.$$
}

for f in "$BASE"/logs/*.log; do
  case "$f" in
    */logrotate.log) continue ;;   # never rotate our own log
  esac
  rotate_one "$f"
done
rotate_one "$BASE/whatsapp-server/healthcheck.log"

# prune old archives
find "$ARCHIVE" -name '*.log.gz' -type f -mtime +"$KEEP_DAYS" -delete 2>/dev/null

echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] logrotate done" >> "$LOG"
# keep our own log bounded
tail -n 400 "$LOG" > "$LOG.tmp.$$" 2>/dev/null && mv -f "$LOG.tmp.$$" "$LOG" 2>/dev/null
rm -f "$LOG.tmp.$$" 2>/dev/null
exit 0
