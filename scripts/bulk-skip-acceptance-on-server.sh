#!/usr/bin/env bash
# 在阿里云 ECS 上执行：预制单「已安装」→「已验收（无电子）」
# 用法：cd /opt/custom-furniture-dispatch && bash scripts/bulk-skip-acceptance-on-server.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/custom-furniture-dispatch}"
DATA_DIR="${SYNC_DATA_DIR:-$APP_DIR/data}"
SNAP="$DATA_DIR/snapshot.json"

cd "$APP_DIR"

if [[ ! -f "$SNAP" ]]; then
  echo "找不到 snapshot: $SNAP"
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
