#!/bin/bash
# =================================================================
# One-Click Upload & Deploy to Hosting Script
# Project: RVM Master Developer Dashboard (ISP Environmental Solutions)
# Supports: aaPanel, cPanel, Direct VPS (Ubuntu/Debian), SSH, SCP, or ZIP
# =================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================================="
echo "📦 ISP SMART RECYCLING DASHBOARD - ONE-CLICK HOSTING UPLOADER   "
echo "================================================================="

ZIP_NAME="rvm-dash-production.zip"
TARGET_DEST="$1"

# 1. Build Production Frontend Assets
echo "⚡ [1/3] Building production frontend bundle with Vite..."
npm run build

# 2. Package Clean Production Archive
echo "📦 [2/3] Creating lightweight production bundle ($ZIP_NAME)..."
rm -f "$ZIP_NAME"

# Files and directories required in production runtime
REQUIRED_ITEMS=(
  "dist"
  "server"
  "package.json"
  "package-lock.json"
  "ecosystem.config.cjs"
  ".env.example"
  "deploy-aapanel.sh"
  "update-server.sh"
  "nginx-aapanel.conf"
)

# Use tar or zip to create clean archive
if command -v tar &> /dev/null; then
  tar -acf "$ZIP_NAME" "${REQUIRED_ITEMS[@]}"
elif command -v zip &> /dev/null; then
  zip -r -q "$ZIP_NAME" "${REQUIRED_ITEMS[@]}"
elif command -v python3 &> /dev/null; then
  python3 -c "
import zipfile, os
items = ['dist', 'server', 'package.json', 'package-lock.json', 'ecosystem.config.cjs', '.env.example', 'deploy-aapanel.sh', 'update-server.sh', 'nginx-aapanel.conf']
with zipfile.ZipFile('$ZIP_NAME', 'w', zipfile.ZIP_DEFLATED) as z:
    for item in items:
        if os.path.isdir(item):
            for root, dirs, files in os.walk(item):
                for f in files:
                    fp = os.path.join(root, f)
                    z.write(fp, os.path.relpath(fp, '.'))
        elif os.path.isfile(item):
            z.write(item)
print('Compressed using python3')
"
else
  tar -czf "rvm-dash-production.tar.gz" "${REQUIRED_ITEMS[@]}"
  ZIP_NAME="rvm-dash-production.tar.gz"
fi

ZIP_SIZE="$(du -h "$ZIP_NAME" 2>/dev/null | cut -f1 || echo "Ready")"
echo "✅ Production package created: $ZIP_NAME ($ZIP_SIZE)"

# 3. Direct Upload or Instructions
if [ -n "$TARGET_DEST" ]; then
  echo ""
  echo "🚀 [3/3] Uploading package to remote hosting destination: $TARGET_DEST..."
  
  # Format expected: user@host:/path/to/rvm-dash
  REMOTE_HOST="${TARGET_DEST%%:*}"
  REMOTE_PATH="${TARGET_DEST#*:}"
  
  if [ "$REMOTE_HOST" = "$TARGET_DEST" ]; then
    # Default path if only user@host provided
    REMOTE_PATH="/www/wwwroot/rvm-dash"
  fi

  echo "   -> Target Host: $REMOTE_HOST"
  echo "   -> Target Directory: $REMOTE_PATH"

  # SCP the package
  scp "$ZIP_NAME" "$REMOTE_HOST:$REMOTE_PATH/$ZIP_NAME"
  
  # Run remote extraction and zero-downtime PM2 reload
  echo "🔄 Executing remote extraction & PM2 reload on server..."
  ssh "$REMOTE_HOST" "
    cd '$REMOTE_PATH' &&
    chattr -i dist/.user.ini 2>/dev/null || true
    unzip -o -q '$ZIP_NAME' 2>/dev/null || tar -xzf '$ZIP_NAME'
    rm -f '$ZIP_NAME'
    [ ! -f .env ] && cp .env.example .env || true
    npm install --omit=dev --no-audit
    node server/migrate.js || true
    if command -v pm2 &> /dev/null; then
      pm2 reload ecosystem.config.cjs --env production || pm2 restart rvm-dash || pm2 start ecosystem.config.cjs --env production
      pm2 save
    fi
    echo 'Remote deployment complete! Checking health...'
    curl -s http://127.0.0.1:5009/api/health || true
  "
  echo ""
  echo "🎉 [SUCCESS] Dashboard uploaded and live on remote hosting server!"
else
  echo ""
  echo "================================================================="
  echo "🎉 PRODUCTION PACKAGE READY FOR INSTANT UPLOAD!                  "
  echo "================================================================="
  echo "Archive File: $SCRIPT_DIR/$ZIP_NAME"
  echo ""
  echo "Choose your upload method below:"
  echo ""
  echo "👉 OPTION 1: 1-Click Upload via aaPanel / cPanel Web File Manager:"
  echo "   1. Open aaPanel ➔ Files ➔ Go to: /www/wwwroot/rvm-dash"
  echo "   2. Click 'Upload' ➔ Select '$ZIP_NAME'"
  echo "   3. Right-click the uploaded '$ZIP_NAME' ➔ Click 'Unzip' / 'Extract'"
  echo "   4. Go to aaPanel ➔ Website ➔ Node project ➔ Click 'Restart'"
  echo ""
  echo "👉 OPTION 2: 1-Command Automated Remote Upload via SSH:"
  echo "   Run:"
  echo "   bash upload-to-hosting.sh root@YOUR_SERVER_IP:/www/wwwroot/rvm-dash"
  echo ""
  echo "👉 OPTION 3: Direct Server Update via Git Terminal on Server:"
  echo "   SSH to your server and run:"
  echo "   bash deploy-aapanel.sh"
  echo "================================================================="
fi
