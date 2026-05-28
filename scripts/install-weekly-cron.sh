#!/usr/bin/env bash
# 在 Linux 服务器上安装「每周一 09:00」周报 cron。
# 用法：sudo bash scripts/install-weekly-cron.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
CRON_SCRIPT="$APP_DIR/scripts/weekly-digest-cron.sh"
CRON_LINE="0 9 * * 1 cd $APP_DIR && /bin/bash $CRON_SCRIPT >> /var/log/custom-furniture-dispatch/cron.log 2>&1"

if [[ ! -x "$CRON_SCRIPT" ]]; then
  chmod +x "$CRON_SCRIPT"
fi

mkdir -p /var/log/custom-furniture-dispatch

echo "将安装以下 cron（root 用户）："
echo "  $CRON_LINE"
echo ""

EXISTING=$(crontab -l 2>/dev/null || true)
if echo "$EXISTING" | grep -Fq "weekly-digest-cron.sh"; then
  echo "已存在 weekly-digest 条目，跳过重复安装。"
  echo "$EXISTING" | grep "weekly-digest-cron"
  exit 0
fi

(crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -
echo "==> cron 已安装。当前 crontab："
crontab -l | grep -F "weekly-digest" || true

echo ""
echo "请确认服务器 $APP_DIR/.env.local 已配置："
echo "  WECOM_WEBHOOK_URL=..."
echo "  DIGEST_PUSH_KEY=...   （建议生产环境设置）"
echo ""
echo "手动测试："
echo "  bash $CRON_SCRIPT"
echo "  或：npm run digest:cron"
