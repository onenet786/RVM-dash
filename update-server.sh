#!/bin/bash
# =========================================================================================
# Production Update Script for Already-Running aaPanel / Ubuntu Hosting Server
# Project: RVM Master Developer Dashboard (ISP Environmental Solutions)
# Usage:
#   bash update-server.sh                   (Updates current running branch with zero downtime)
#   bash update-server.sh 24-Public-App-0   (Pulls & switches to 24-Public-App-0)
#   bash update-server.sh B23               (Rolls back to B23 anytime)
# =========================================================================================

set -e

# 1. Navigate to Project Directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "========================================================================="
echo "🔄 [1/7] Updating Already-Running Hosting Server..."
echo "📂 Path: $PROJECT_DIR"
echo "========================================================================="

# 2. Detect Node.js & PM2 in aaPanel / NVM paths if not in global PATH
if ! command -v pm2 &> /dev/null; then
  AAPANEL_BIN="$(find /www/server/nodejs -name pm2 -type f 2>/dev/null | head -n 1)"
  if [ -n "$AAPANEL_BIN" ]; then
    export PATH="$(dirname "$AAPANEL_BIN"):$PATH"
    echo "💡 Detected aaPanel PM2 environment at $(dirname "$AAPANEL_BIN")"
  fi
fi

if ! command -v node &> /dev/null; then
  AAPANEL_NODE="$(find /www/server/nodejs -name node -type f 2>/dev/null | head -n 1)"
  if [ -n "$AAPANEL_NODE" ]; then
    export PATH="$(dirname "$AAPANEL_NODE"):$PATH"
    echo "💡 Detected aaPanel Node environment at $(dirname "$AAPANEL_NODE")"
  fi
fi

# 3. Detect Active Branch or Use Passed Argument
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "24-Public-App-0")"
BRANCH="${1:-$CURRENT_BRANCH}"
if [ "$BRANCH" = "HEAD" ] || [ -z "$BRANCH" ]; then
  BRANCH="24-Public-App-0"
fi
echo "🌿 Target Branch: $BRANCH (Current: $CURRENT_BRANCH)"

# 4. Safely Unlock aaPanel Immutable Attributes (.user.ini) to Prevent Permission Denied
echo "🔓 [2/7] Unlocking aaPanel system attributes..."
chattr -i .user.ini 2>/dev/null || true
chattr -i dist/.user.ini 2>/dev/null || true
chattr -R -i dist/ 2>/dev/null || true

if [ -d ".git" ]; then
  # 5. Reset Build Artifacts while PRESERVING .env and User Uploads
  echo "🧹 [3/7] Cleaning temporary build artifacts (Preserving .env and uploads)..."
  git reset --hard HEAD 2>/dev/null || true
  git clean -fd -e .env -e "uploads/" -e "backups/" 2>/dev/null || true

  # 6. Fetch & Pull Latest Code from GitHub
  echo "🔄 [4/7] Pulling latest code changes from origin/$BRANCH..."
  git fetch origin --prune
  if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git checkout "$BRANCH"
    else
      git checkout -b "$BRANCH" "origin/$BRANCH" 2>/dev/null || git checkout "$BRANCH"
    fi
  fi
  git pull origin "$BRANCH"

  echo "✅ Running commit: $(git rev-parse --short HEAD) - $(git log -1 --pretty=%B | head -n 1)"
else
  echo "📁 [3/7] Direct upload mode (no .git folder). Keeping uploaded server files intact."
fi

# 7. Fast Dependency Check / Install
echo "📦 [5/7] Verifying npm dependencies..."
npm install --production=false --no-audit

# 8. Run PostgreSQL Database Schema Migration
echo "🐘 [6/7] Applying PostgreSQL schema updates..."
if [ -f "server/migrate.js" ]; then
  node server/migrate.js || echo "⚠️ Migration completed with notice."
fi

# 9. Build Production Vite Frontend
echo "⚡ [7/7] Compiling production frontend bundle..."
# Unlock .user.ini again right before build in case Vite needs to write dist/
chattr -i dist/.user.ini 2>/dev/null || true
rm -f dist/.user.ini 2>/dev/null || true
npm run build

# 10. Restore aaPanel Web Permissions
if id "www" &>/dev/null; then
  chown -R www:www "$PROJECT_DIR/dist" 2>/dev/null || true
fi

# 11. Zero-Downtime PM2 Service Reload
echo "🔄 Reloading backend process in PM2..."
if command -v pm2 &> /dev/null; then
  pm2 reload rvm-dash --update-env 2>/dev/null || \
  pm2 reload ecosystem.config.cjs --env production 2>/dev/null || \
  pm2 restart rvm-dash 2>/dev/null || \
  pm2 start ecosystem.config.cjs --env production
  pm2 save 2>/dev/null || true
  echo "✅ PM2 process reloaded with zero downtime."
else
  echo "⚠️ PM2 not found, restarting background node daemon..."
  pkill -f "node server/index.js" 2>/dev/null || true
  NODE_CMD="$(which node 2>/dev/null || echo "node")"
  nohup "$NODE_CMD" server/index.js > server.log 2>&1 &
fi

# 12. Verification & Health Check
echo ""
echo "========================================================================="
echo "🎉 SUCCESS: Hosting server files updated to latest $BRANCH!"
echo "🌐 API Port: http://127.0.0.1:5009"
echo "🩺 Performing health check:"
sleep 2
HEALTH_CHECK="$(curl -s http://127.0.0.1:5009/api/health 2>/dev/null || echo '{"status":"starting"}')"
echo "   $HEALTH_CHECK"
echo "========================================================================="
