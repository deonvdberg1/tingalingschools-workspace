#!/bin/bash
# Fred's Auto-Backup Script
# Pushes workspace to GitHub so nothing is ever lost

WORKSPACE="/Users/deonvandenberg/.openclaw/workspace"
FRED="$WORKSPACE/fred"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S SAST")

# Local snapshot (for memory files + full state)
SNAPSHOT="$FRED/backups/$(date +%Y-%m-%d_%H-%M)"
mkdir -p "$SNAPSHOT"
cp -R "$FRED/memory" "$SNAPSHOT/memory" 2>/dev/null
cp "$FRED/MEMORY.md" "$SNAPSHOT/" 2>/dev/null
cp "$FRED/SOUL.md" "$FRED/AGENTS.md" "$FRED/IDENTITY.md" "$FRED/USER.md" "$FRED/TOOLS.md" "$SNAPSHOT/" 2>/dev/null
cp -R "$FRED/projects" "$SNAPSHOT/projects" 2>/dev/null
cp "$FRED/whatsapp-server/server.js" "$SNAPSHOT/" 2>/dev/null
cp "$FRED/whatsapp-server/conversations.json" "$SNAPSHOT/" 2>/dev/null
cp "$FRED/whatsapp-server/tunnel-url.txt" "$SNAPSHOT/" 2>/dev/null
# 5. .env backup (encrypted) — copy to local snapshot for disaster recovery
cp "$FRED/whatsapp-server/.env" "$SNAPSHOT/.env" 2>/dev/null
echo "[BACKUP] .env backed up to snapshot"
# Clean up old backup folders (keep 30 days)
find "$FRED/backups" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null

# Git push (off-site backup) — only push config, code, and products, not backup snapshots
cd "$WORKSPACE"
git add fred/scripts/ fred/products/ fred/whatsapp-server/ 2>/dev/null
git add fred/SOUL.md fred/AGENTS.md fred/IDENTITY.md fred/USER.md fred/TOOLS.md fred/MEMORY.md 2>/dev/null
git add fred/projects/ fred/memory/ 2>/dev/null
if ! git diff --cached --quiet; then
    git commit -m "Fred auto-backup $TIMESTAMP"
    git push origin main
fi

# 9. Log archiving — archive before trimming, keep 7 days
LOG_DIR="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server"
ARCHIVE_DIR="$LOG_DIR/archive"
mkdir -p "$ARCHIVE_DIR"

for f in server.log cloudflared.log cloudflared-named.log healthcheck.log; do
    LOGFILE="$LOG_DIR/$f"
    if [ -f "$LOGFILE" ] && [ $(stat -f%z "$LOGFILE") -gt 1048576 ]; then
        # Archive with date stamp before trimming
        ARCHIVE_NAME="$ARCHIVE_DIR/$(basename $f)-$(date +%Y%m%d-%H%M%S)"
        cp "$LOGFILE" "$ARCHIVE_NAME"
        echo "[LOG ARCHIVE] Archived $f to $ARCHIVE_NAME"
        
        # Trim to last 512KB
        tail -c 524288 "$LOGFILE" > "${LOGFILE}.tmp" && mv "${LOGFILE}.tmp" "$LOGFILE"
        echo "[LOG ROTATION] Trimmed $f to 512KB"
    fi
done

# Delete archived logs older than 7 days
find "$ARCHIVE_DIR" -name "*.log-*" -mtime +7 -delete 2>/dev/null
echo "[LOG ARCHIVE] Cleaned logs older than 7 days"
