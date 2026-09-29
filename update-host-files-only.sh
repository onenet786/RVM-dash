#!/usr/bin/env bash
# Update tracked host files and rebuild the frontend without touching PostgreSQL.
#
# Usage:
#   bash update-host-files-only.sh
#   bash update-host-files-only.sh main
#
# This script intentionally DOES NOT:
#   - run server/migrate.js
#   - run any npm lifecycle scripts
#   - reset/clean unrelated host files
# Backend reload is protected with SKIP_STARTUP_DB_INIT=true.

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Discover aaPanel's PM2/Node installation when it is not in the login PATH.
if ! command -v pm2 >/dev/null 2>&1 && [ -d /www/server/nodejs ]; then
  AAPANEL_PM2="$(find /www/server/nodejs -name pm2 -type f 2>/dev/null | head -n 1 || true)"
  if [ -n "$AAPANEL_PM2" ]; then
    export PATH="$(dirname "$AAPANEL_PM2"):$PATH"
  fi
fi

if ! command -v node >/dev/null 2>&1 && [ -d /www/server/nodejs ]; then
  AAPANEL_NODE="$(find /www/server/nodejs -name node -type f 2>/dev/null | head -n 1 || true)"
  if [ -n "$AAPANEL_NODE" ]; then
    export PATH="$(dirname "$AAPANEL_NODE"):$PATH"
  fi
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
TARGET_BRANCH="${1:-$CURRENT_BRANCH}"

if [ "$CURRENT_BRANCH" = "HEAD" ]; then
  echo "ERROR: Detached HEAD. Pass a branch name or check out a branch first."
  exit 1
fi

echo "Code-only host update"
echo "Project: $PROJECT_DIR"
echo "Branch:  $CURRENT_BRANCH -> $TARGET_BRANCH"

# Protect server-managed files. Generated dist changes are allowed because the
# production build replaces them; every other local edit must be handled first.
DIRTY_FILES="$(git status --porcelain -- . ':(exclude)dist' ':(exclude)uploads' ':(exclude)server/uploads' ':(exclude)backups' ':(exclude).env')"
if [ -n "$DIRTY_FILES" ]; then
  echo "ERROR: Local host changes detected outside protected/generated paths:"
  echo "$DIRTY_FILES"
  echo "Commit or stash these changes before updating. Nothing was changed."
  exit 1
fi

git fetch origin --prune

if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
  git switch "$TARGET_BRANCH" 2>/dev/null || git switch --track "origin/$TARGET_BRANCH"
fi

# Fast-forward only: never merge, overwrite, reset, or silently discard files.
git pull --ff-only origin "$TARGET_BRANCH"

# Install exactly the lockfile dependencies without postinstall/preinstall hooks.
npm ci --ignore-scripts --no-audit --no-fund

# Frontend compilation only; no database command is called.
npm run build

if id www >/dev/null 2>&1; then
  chown -R www:www "$PROJECT_DIR/dist" 2>/dev/null || true
fi

# Reload the API with startup schema/seeding explicitly disabled. If PM2 is not
# available, leave the existing backend untouched rather than using an unsafe
# fallback restart.
if command -v pm2 >/dev/null 2>&1; then
  export SKIP_STARTUP_DB_INIT=true
  pm2 reload rvm-dash --update-env 2>/dev/null \
    || pm2 reload ecosystem.config.cjs --env production --update-env
  pm2 save >/dev/null 2>&1 || true
  BACKEND_RESULT="Reloaded safely with database initialization disabled."
else
  BACKEND_RESULT="Not restarted because PM2 was not found."
fi

echo ""
echo "SUCCESS: Host source files and frontend bundle were updated."
echo "DATABASE: Untouched. server/migrate.js was not executed."
echo "BACKEND:  $BACKEND_RESULT"
