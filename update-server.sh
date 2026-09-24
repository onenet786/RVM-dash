#!/bin/bash
# =================================================================
# Production Update Script for aaPanel / Ubuntu Server
# Project: RVM Master Developer Dashboard (ISP Environmental Solution)
# Usage: 
#   bash update-server.sh               (Deploys 24-Public-App-0 by default)
#   bash update-server.sh B23           (Rolls back to B23 anytime)
# =================================================================

set -e

# Target branch (defaults to '24-Public-App-0')
BRANCH="${1:-24-Public-App-0}"

echo "=========================================================="
echo "🚀 [1/6] Starting Server Update to branch: $BRANCH"
echo "=========================================================="

# 1. Navigate to script directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
echo "📂 Working directory: $PROJECT_DIR"

# 2. Fetch all latest branches from GitHub
echo "🔄 [2/6] Fetching latest branches from GitHub..."
git fetch origin --prune

# 3. Switch cleanly to the target branch
echo "🌿 [3/6] Switching to branch '$BRANCH'..."
# Stash or discard local uncommitted artifact edits if any
git clean -fd dist/ 2>/dev/null || true
git checkout -- dist/ 2>/dev/null || true
git checkout -- server/index.js 2>/dev/null || true

# Switch to branch tracking origin
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  git checkout -b "$BRANCH" "origin/$BRANCH"
fi

echo "✅ Active branch is now: $(git rev-parse --abbrev-ref HEAD) (Commit: $(git rev-parse --short HEAD))"

# 4. Install Dependencies
echo "📦 [4/6] Installing npm dependencies..."
npm install --production=false

# 5. Unlock aaPanel .user.ini and Build Vite Frontend
echo "⚡ [5/6] Building production frontend..."
if [ -f "dist/.user.ini" ]; then
  chattr -i dist/.user.ini 2>/dev/null || true
  rm -f dist/.user.ini 2>/dev/null || true
fi
npm run build

# 6. Restart PM2 Process
echo "🔄 [6/6] Reloading PM2 backend service..."
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.cjs --env production || pm2 restart rvm-dash || pm2 start ecosystem.config.cjs --env production
  pm2 save
else
  echo "⚠️ PM2 not found globally, restarting node background process..."
  NODE_CMD="$(which node 2>/dev/null || echo "node")"
  pkill -f "node server/index.js" 2>/dev/null || true
  nohup "$NODE_CMD" server/index.js > server.log 2>&1 &
fi

echo "=========================================================="
echo "🎉 SUCCESS: Server updated to $BRANCH!"
echo "🌐 Dashboard is live on http://127.0.0.1:5009"
echo "ℹ️  To roll back to B23 at any time, run: bash update-server.sh B23"
echo "=========================================================="
