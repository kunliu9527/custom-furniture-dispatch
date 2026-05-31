#!/usr/bin/env bash
# 在阿里云 ECS 上执行：预制单「已安装」→「已验收（无电子）」
# 用法：cd /opt/custom-furniture-dispatch && bash scripts/bulk-skip-acceptance-on-server.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/custom-furniture-dispatch}"
cd "$APP_DIR"

# 生产环境数据目录在 .env.local 的 SYNC_DATA_DIR，不是项目内 data/
if [[ -f .env.local ]]; then
  env_line="$(grep -E '^SYNC_DATA_DIR=' .env.local | tail -1 || true)"
  if [[ -n "$env_line" ]]; then
    val="${env_line#SYNC_DATA_DIR=}"
    val="${val%\"}"
    val="${val#\"}"
    export SYNC_DATA_DIR="$val"
  fi
fi

DATA_DIR="${SYNC_DATA_DIR:-$APP_DIR/data}"
SNAP="$DATA_DIR/snapshot.json"

echo "数据目录 SYNC_DATA_DIR=$DATA_DIR"
echo "snapshot 路径: $SNAP"

if [[ ! -f "$SNAP" ]]; then
  echo "找不到 snapshot: $SNAP"
  echo "提示：阿里云 ECS 默认在 /var/lib/custom-furniture-dispatch/snapshot.json"
  echo "      不要用项目内 data/snapshot.json（那是 dev/备份用，线上不读）"
  exit 1
fi

echo "==> 备份 snapshot"
cp "$SNAP" "${SNAP}.bak-$(date +%Y%m%d-%H%M%S)"

echo "==> dry-run"
npm run bulk:skip-seed-accept -- --file "$SNAP" --dry-run

echo ""
read -r -p "确认执行正式更新？(y/N) " ans
if [[ "${ans:-}" != "y" && "${ans:-}" != "Y" ]]; then
  echo "已取消"
  exit 0
fi

echo "==> apply"
npm run bulk:skip-seed-accept -- --file "$SNAP" --apply

echo "==> pm2 restart"
pm2 restart dispatch

echo "==> 完成 $(date -Iseconds)"
echo "各门店浏览器刷新或等待云端同步即可。"
