#!/usr/bin/env bash
# 在服务器上更新代码并重启
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/custom-furniture-dispatch}"
cd "$APP_DIR"

echo "==> git pull..."
git pull --ff-only

echo "==> npm install & build..."
npm install
npm run build

echo "==> pm2 restart..."
pm2 restart dispatch

echo "==> 完成 $(date -Iseconds)"
