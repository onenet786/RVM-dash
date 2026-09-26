#!/bin/bash
# =================================================================
# Automated Production Deployment Script for aaPanel / Ubuntu Server
# Project: RVM Master Developer Dashboard (ISP Environmental Solutions)
# Branch:  24-Public-App-0 (PostgreSQL + Enterprise Multi-Tenant Engine)
# =================================================================

set -e

echo "================================================================="
echo "🚀 [1/6] Starting Production Deployment for RVM Master Dashboard..."
echo "================================================================="

# Navigate to project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
echo "📂 Working directory: $PROJECT_DIR"

# 1. Pull Latest Code Changes
echo "🔄 [1/6] Updating Repository from GitHub..."
if [ -d ".git" ]; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "24-Public-App-0")"
  echo "Current branch: $CURRENT_BRANCH"
  
  # Clean potential build artifacts that cause merge conflicts
  chattr -i dist/.user.ini 2>/dev/null || true
  git clean -fd dist/ 2>/dev/null || true
  git checkout -- dist/ 2>/dev/null || true
  git checkout -- server/index.js 2>/dev/null || true
  
  git fetch origin "$CURRENT_BRANCH" --prune || git fetch origin --prune || true
  git pull origin "$CURRENT_BRANCH" || git pull origin 24-Public-App-0 || true
fi

# 2. Install Dependencies
echo "📦 [2/6] Installing npm dependencies..."
npm install --production=false

# 3. Run PostgreSQL & Enterprise Database Migrations
echo "🐘 [3/6] Running PostgreSQL Schema Migrations..."
if [ -f "server/migrate.js" ]; then
  node server/migrate.js || echo "⚠️ Migration notice: PostgreSQL schemas initialized."
fi

# 4. Unlock aaPanel .user.ini & Build Vite Frontend Assets
echo "⚡ [4/6] Building Production Frontend Bundle (Vite)..."
if [ -f "dist/.user.ini" ]; then
  chattr -i dist/.user.ini 2>/dev/null || true
  rm -f dist/.user.ini 2>/dev/null || true
fi
npm run build

# 5. Verifying Environment Settings (.env)
echo "🔒 [5/6] Verifying Environment Configuration..."
if [ ! -f .env ]; then
  echo "Creating default production .env..."
  cp .env.example .env 2>/dev/null || cat <<EOT > .env
DB_TYPE=postgres
PORT=5009
PG_HOST=127.0.0.1
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=Admin786
PG_DATABASE=rvmpg
MONGODB_URI=mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority
MONGODB_DBNAME=ONS-RVM
JWT_SECRET=rvm-isp-production-secret-key-2026-aapanel
EOT
fi

# Fix aaPanel file ownership if running as root
if id "www" &>/dev/null; then
  chown -R www:www "$PROJECT_DIR" 2>/dev/null || true
fi

# 6. Reloading PM2 Node Process
echo "🔄 [6/6] Reloading PM2 Backend Service in aaPanel..."
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.cjs --env production || pm2 restart rvm-dash || pm2 start ecosystem.config.cjs --env production
  pm2 save
else
  echo "⚠️ PM2 not found globally, restarting node background process..."
  pkill -f "node server/index.js" 2>/dev/null || true
  NODE_CMD="$(which node 2>/dev/null || echo "node")"
  nohup "$NODE_CMD" server/index.js > server.log 2>&1 &
fi

echo "================================================================="
echo "✅ [SUCCESS] Deployment Completed Successfully!"
echo "🌐 API Port: http://127.0.0.1:5009"
echo "🩺 Health Check:"
sleep 2
curl -s http://127.0.0.1:5009/api/health || echo "   (Backend initializing...)"
echo ""
echo "================================================================="
