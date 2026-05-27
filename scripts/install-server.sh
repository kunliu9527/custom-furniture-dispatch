#!/usr/bin/env bash
# 国内云 Ubuntu 首次安装 — 在服务器上以 root 或 sudo 运行
set -euo pipefail

GIT_REPO="${GIT_REPO:-https://github.com/kunliu9527/custom-furniture-dispatch.git}"
APP_DIR="${APP_DIR:-/opt/custom-furniture-dispatch}"
DATA_DIR="${DATA_DIR:-/var/lib/custom-furniture-dispatch}"
SYNC_API_KEY="${SYNC_API_KEY:-}"

if [[ -z "$SYNC_API_KEY" ]]; then
  echo "请先设置 SYNC_API_KEY 环境变量，例如："
  echo "  export SYNC_API_KEY='你的复杂密码'"
  exit 1
fi

echo "==> 安装系统依赖..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl nginx

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  echo "==> 安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> 安装 PM2..."
  npm install -g pm2
fi

echo "==> 拉取代码..."
mkdir -p "$(dirname "$APP_DIR")"
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git pull --ff-only
else
  git clone "$GIT_REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> 写入 .env.local..."
cat > .env.local <<EOF
NEXT_PUBLIC_REMOTE_SYNC=true
SYNC_API_KEY=${SYNC_API_KEY}
NEXT_PUBLIC_SYNC_API_KEY=${SYNC_API_KEY}
SYNC_STORAGE=file
SYNC_DATA_DIR=${DATA_DIR}
PORT=3000
NODE_ENV=production
EOF

mkdir -p "$DATA_DIR"

echo "==> 安装依赖并构建..."
npm install
npm run build

echo "==> 配置 Nginx..."
SERVER_NAME="${SERVER_NAME:-_}"
sed "s/你的公网IP或域名/${SERVER_NAME}/" deploy/nginx.conf.example > /etc/nginx/sites-available/dispatch
ln -sf /etc/nginx/sites-available/dispatch /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "==> 启动应用..."
pm2 delete dispatch 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -hp "$(whoami)" --service-name dispatch-pm2 || true

echo ""
echo "============================================"
echo "  安装完成"
echo "  浏览器访问: http://$(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo '你的公网IP')"
echo "  数据目录: ${DATA_DIR}"
echo "  管理命令: pm2 status / pm2 logs dispatch"
echo "============================================"
