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

chmod +x scripts/weekly-digest-cron.sh scripts/install-weekly-cron.sh 2>/dev/null || true

echo "==> health check (local)..."
sleep 2
if curl -sf -o /dev/null "http://127.0.0.1:3000/api/sync"; then
  echo "    /api/sync OK"
else
  echo "    WARN: /api/sync not reachable on :3000"
fi

echo "==> 完成 $(date -Iseconds)"
echo "    访问: 域名请用 https://你的域名 ；仅 IP 时用 http://公网IP（勿在 https 页请求 http API）"
