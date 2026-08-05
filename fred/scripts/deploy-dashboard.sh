#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy the AutoEffortless dashboard SPA to the public portal
# Builds dashboard-temp (vite) → syncs into whatsapp-server/spa-dashboard/
# which is what app.autoeffortless.com serves via the tunnel (port 3000).
# ─────────────────────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")/.."

echo "[1/3] Building dashboard SPA (vite)..."
(cd dashboard-temp && npx vite build)

echo "[2/3] Syncing build to whatsapp-server/spa-dashboard/ ..."
rm -rf whatsapp-server/spa-dashboard/assets whatsapp-server/spa-dashboard/images
cp -R dashboard-temp/dist/. whatsapp-server/spa-dashboard/

echo "[3/3] Verifying localhost:3000 ..."
BUNDLE=$(curl -s http://localhost:3000/ | grep -oE 'index-[^"]+\.js' | head -1)
echo "Serving: $BUNDLE"
echo "Public URL: https://app.autoeffortless.com  (cf-cache-status DYNAMIC = no purge needed)"
echo "✅ Deploy complete"
