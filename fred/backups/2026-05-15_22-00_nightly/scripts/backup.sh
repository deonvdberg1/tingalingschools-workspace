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
# Clean up old backup folders (keep 30 days)
find "$FRED/backups" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null

# Git push (off-site backup)
cd "$WORKSPACE"
git add fred/ 2>/dev/null
git add fred/memory/ 2>/dev/null
if ! git diff --cached --quiet; then
    git commit -m "Fred auto-backup $TIMESTAMP"
    git push origin main
fi

# Rotate server logs (keep last 1MB)
LOG_DIR="/Users/deonvandenberg/.openclaw/workspace/fred/whatsapp-server"
for f in server.log cloudflared.log tunnel-setup.log; do
    LOGFILE="$LOG_DIR/$f"
    if [ -f "$LOGFILE" ] && [ $(stat -f%z "$LOGFILE") -gt 1048576 ]; then
        tail -c 524288 "$LOGFILE" > "${LOGFILE}.tmp" && mv "${LOGFILE}.tmp" "$LOGFILE"
        echo "[LOG ROTATION] Trimmed $f to 512KB"
    fi
done
