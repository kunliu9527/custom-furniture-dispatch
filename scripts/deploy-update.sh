#!/usr/bin/env bash
# 在服务器上更新代码并重启
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/custom-furniture-dispatch}"
TARGET_BRANCH="${TARGET_BRANCH:-main}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}"

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: 应用目录不存在: $APP_DIR"
  echo "  首次安装见 docs/ALIYUN-DEPLOY.md"
  exit 1
fi

cd "$APP_DIR"

if [[ ! -d .git ]]; then
  echo "ERROR: $APP_DIR 不是 git 仓库"
  exit 1
fi

echo "==> 当前版本"
git log -1 --oneline

echo "==> git fetch origin ${TARGET_BRANCH}..."
git fetch origin "$TARGET_BRANCH"

echo "==> git pull (ff-only)..."
if ! git pull --ff-only origin "$TARGET_BRANCH"; then
  echo "WARN: 无法 fast-forward，尝试 stash 本地改动后重试..."
  git stash push -m "deploy-auto-stash $(date -Iseconds 2>/dev/null || date)" 2>/dev/null || true
  git pull --ff-only origin "$TARGET_BRANCH"
fi

echo "==> 更新后版本"
git log -1 --oneline

echo "==> npm install & build..."
npm install
npm run build

echo "==> pm2 restart..."
if pm2 describe dispatch >/dev/null 2>&1; then
  pm2 restart dispatch
else
  echo "WARN: 未找到 dispatch 进程，尝试 pm2 start..."
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
fi

chmod +x scripts/weekly-digest-cron.sh scripts/install-weekly-cron.sh 2>/dev/null || true
chmod +x scripts/diagnose-deploy.sh 2>/dev/null || true

echo "==> health check (local)..."
sleep 2
if curl -sf -o /dev/null "http://127.0.0.1:3000/api/sync"; then
  echo "    /api/sync OK"
else
  echo "    ERROR: /api/sync 无响应。执行: pm2 logs dispatch --lines 50"
  exit 1
fi

echo "==> 完成 $(date -Iseconds 2>/dev/null || date)"
echo "    浏览器访问后请 Ctrl+F5 强制刷新"
echo "    诊断命令: bash scripts/diagnose-deploy.sh"
