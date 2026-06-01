#!/usr/bin/env bash
# 在 ECS 上诊断部署状态（只读，不修改）
set -u

APP_DIR="${APP_DIR:-/opt/custom-furniture-dispatch}"

section() {
  echo ""
  echo "========== $1 =========="
}

section "环境"
echo "用户: $(whoami)"
echo "时间: $(date -Iseconds 2>/dev/null || date)"
command -v node >/dev/null && echo "Node: $(node -v)" || echo "Node: 未安装"
command -v npm >/dev/null && echo "npm: $(npm -v)" || echo "npm: 未安装"
command -v pm2 >/dev/null && pm2 -v || echo "pm2: 未安装"

section "应用目录 ${APP_DIR}"
if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: 目录不存在。请确认 APP_DIR 或先 clone 到 /opt/custom-furniture-dispatch"
  exit 1
fi
cd "$APP_DIR"
pwd
[[ -d .git ]] && echo "git: OK" || echo "ERROR: 不是 git 仓库"

section "当前代码版本"
git remote -v 2>/dev/null | head -2 || true
git branch -vv 2>/dev/null || true
git log -1 --oneline 2>/dev/null || true
git status -sb 2>/dev/null || true

section "远程最新 (GitHub main)"
git fetch origin main 2>&1 || echo "WARN: git fetch 失败（网络或权限）"
git log -1 --oneline origin/main 2>/dev/null || echo "无法读取 origin/main"

section "PM2"
if command -v pm2 >/dev/null; then
  pm2 status || true
  pm2 describe dispatch 2>/dev/null | head -20 || echo "进程 dispatch 不存在"
else
  echo "pm2 未安装"
fi

section "本地 HTTP"
curl -sf -o /dev/null -w "GET /api/sync => HTTP %{http_code}\n" "http://127.0.0.1:3000/api/sync" 2>/dev/null \
  || echo "127.0.0.1:3000 无响应"

section "数据目录"
DATA_DIR="${SYNC_DATA_DIR:-/var/lib/custom-furniture-dispatch}"
echo "SYNC_DATA_DIR: ${DATA_DIR}"
[[ -f "${DATA_DIR}/snapshot.json" ]] && echo "snapshot.json: 存在" || echo "snapshot.json: 不存在（或路径不同）"
[[ -f .env.local ]] && grep -E '^SYNC_DATA_DIR|^NEXT_PUBLIC_REMOTE' .env.local 2>/dev/null || echo ".env.local 未找到关键项"

section "建议"
LOCAL=$(git rev-parse --short HEAD 2>/dev/null || echo "?")
REMOTE=$(git rev-parse --short origin/main 2>/dev/null || echo "?")
if [[ "$LOCAL" != "$REMOTE" && "$REMOTE" != "?" ]]; then
  echo "本地 $LOCAL 落后于远程 $REMOTE → 在 ${APP_DIR} 执行: bash scripts/deploy-update.sh"
elif [[ "$LOCAL" == "4161b0b" || "$LOCAL" == "$REMOTE" ]]; then
  echo "代码版本已与 GitHub 一致。若页面仍旧，尝试: pm2 restart dispatch && 浏览器强制刷新 Ctrl+F5"
else
  echo "若 git pull / build 报错，把完整终端输出复制给维护人员"
fi
