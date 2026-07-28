#!/usr/bin/env bash
# 在本机安装派单系统（macOS / Linux）
# 用法：bash scripts/install-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="${TARGET_DIR:-$HOME/.local/share/custom-furniture-dispatch}"
GIT_REPO="${GIT_REPO:-https://github.com/kunliu9527/custom-furniture-dispatch.git}"

if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js 20+：https://nodejs.org/"
  exit 1
fi

NODE_MAJOR="$(node -v | cut -d. -f1 | tr -d v)"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "需要 Node.js 20+，当前: $(node -v)"
  exit 1
fi

if [[ -f "$ROOT/server.js" ]]; then
  APP_DIR="$ROOT"
elif [[ -f "$ROOT/package.json" ]] && [[ "$ROOT" == "$(pwd)" ]]; then
  echo "==> 安装到 $TARGET_DIR"
  mkdir -p "$(dirname "$TARGET_DIR")"
  rsync -a --delete \
    --exclude node_modules --exclude .next --exclude release --exclude .git \
    "$ROOT/" "$TARGET_DIR/"
  APP_DIR="$TARGET_DIR"
else
  echo "==> 克隆到 $TARGET_DIR"
  rm -rf "$TARGET_DIR"
  git clone "$GIT_REPO" "$TARGET_DIR"
  APP_DIR="$TARGET_DIR"
fi

cd "$APP_DIR"
chmod +x scripts/start-dispatch.sh 2>/dev/null || true

ENV_FILE="$APP_DIR/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  KEY="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
  cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_REMOTE_SYNC=true
SYNC_API_KEY=${KEY}
NEXT_PUBLIC_SYNC_API_KEY=${KEY}
SYNC_STORAGE=file
SYNC_DATA_DIR=${APP_DIR}/data
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=production
EOF
  echo "已生成 .env.local（同步密钥已随机生成）"
fi

mkdir -p "$APP_DIR/data"

if [[ -f "$APP_DIR/server.js" ]]; then
  echo "standalone 发布包，跳过构建"
else
  npm install
  npm run build
fi

DESKTOP="$HOME/Desktop"
LINK="$DESKTOP/派单系统.command"
cat > "$LINK" <<EOF
#!/bin/bash
cd "$APP_DIR"
bash scripts/start-dispatch.sh
EOF
chmod +x "$LINK"
echo "已创建桌面启动脚本: $LINK"

echo ""
echo "============================================"
echo "  安装完成"
echo "  目录: $APP_DIR"
echo "  启动: bash scripts/start-dispatch.sh"
echo "  访问: http://localhost:3000"
echo "============================================"
