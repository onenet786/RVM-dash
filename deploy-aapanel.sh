#!/usr/bin/env bgsh
# =================================================================
# Automated Production Deployment Script for aaPanel / Ubuntu Server
# Project: RVM Master Developer Dashboard (ISP Environmental Solution)
# =================================================================

set -e

echo "🚀 [1/5] Starting Production Deployment for RVM Master Dashboard..."

# Navigate to project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "🔄 Pulling Latest Code Changes from Branch B2..."
if [ -d ".git" ]; then
  git clean -fd dist/ 2>/dev/null || rm -rf dist/
  git pull origin B2 || git pull origin main || git pull origin master || true
fi

echo "📦 [2/5] Installing Dependencies..."
npm install --production=false

echo "⚡ [3/5] Building Vite Production Frontend Assets..."
npm run build

echo "🔒 [4/5] Verifying Environment Settings..."
if [ ! -f .env ]; then
  echo "Creating default .env configuration..."
  cp .env.example .env || cat <<EOT > .env
MONGODB_URI=mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority
MONGODB_DBNAME=ONS-RVM
PORT=3131
JWT_SECRET=rvm-isp-production-secret-key-2026-aapanel
EOT
fi

echo "🔄 [5/5] Reloading PM2 Node Process in aaPanel..."
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
  pm2 save
else
  echo "⚠️ PM2 not found globally, restarting node background task..."
  nohup node server/index.js > server.log 2>&1 &
fi

echo "✅ [SUCCESS] Deployment Completed! Dashboard API is running on http://127.0.0.1:3131"
