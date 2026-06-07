#!/usr/bin/env bash
# 安装「工作日 09:00」每日待办企微推送 cron。
# 用法：sudo bash scripts/install-daily-cron.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
CRON_SCRIPT="$APP_DIR/scripts/daily-todos-cron.sh"
CRON_LINE="0 9 * * 1-5 cd $APP_DIR && /bin/bash $CRON_SCRIPT >> /var/log/custom-furniture-dispatch/cron.log 2>&1"

if [[ ! -x "$CRON_SCRIPT" ]]; then
  chmod +x "$CRON_SCRIPT"
fi

mkdir -p /var/log/custom-furniture-dispatch

echo "将安装以下 cron（root 用户）："
echo "  $CRON_LINE"
echo ""

EXISTING=$(crontab -l 2>/dev/null || true)
if echo "$EXISTING" | grep -Fq "daily-todos-cron.sh"; then
  echo "已存在 daily-todos 条目，跳过重复安装。"
  echo "$EXISTING" | grep "daily-todos-cron"
  exit 0
fi

(crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -
echo "==> cron 已安装。当前 crontab："
crontab -l | grep -F "daily-todos" || true

echo ""
echo "手动测试："
echo "  bash $CRON_SCRIPT --preview"
echo "  bash $CRON_SCRIPT"
