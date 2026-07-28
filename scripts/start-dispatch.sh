#!/usr/bin/env bash
# 启动派单系统（standalone 发布包或源码目录均可）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js，请安装 20+：https://nodejs.org/"
  exit 1
fi

NODE_MAJOR="$(node -v | cut -d. -f1 | tr -d v)"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "需要 Node.js 20+，当前: $(node -v)"
  exit 1
fi

ENV_FILE="$ROOT/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$ROOT/deploy/env.local.example" ]]; then
    cp "$ROOT/deploy/env.local.example" "$ENV_FILE"
    echo "已生成 .env.local，请编辑 SYNC_API_KEY 后重新启动。"
  else
    echo "缺少 .env.local"
    exit 1
  fi
fi

set -a
# shellcheck disable=SC1090
source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' | sed 's/\r$//')
set +a

export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"
export SYNC_DATA_DIR="${SYNC_DATA_DIR:-$ROOT/data}"
mkdir -p "$SYNC_DATA_DIR"

URL="http://127.0.0.1:${PORT}"

if [[ -f "$ROOT/server.js" ]]; then
  echo "启动派单系统 (standalone) $URL"
  (sleep 2 && command -v xdg-open >/dev/null && xdg-open "$URL" || true) &
  exec node server.js
fi

if [[ ! -f "$ROOT/.next/BUILD_ID" ]]; then
  echo "源码模式：正在构建..."
  npm run build
fi

echo "启动 Next.js (源码模式) $URL"
(sleep 2 && command -v xdg-open >/dev/null && xdg-open "$URL" || true) &
exec npm run start
