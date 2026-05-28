#!/usr/bin/env bash
# 每周管理简报：调用本机 Next 服务生成并推送企微群。
# 用法：bash scripts/weekly-digest-cron.sh
# 环境变量（建议在项目根 .env.local 或 /etc/dispatch-digest.env）：
#   DISPATCH_APP_URL   默认 http://127.0.0.1:3000
#   DIGEST_PUSH_KEY    与服务器 .env 中一致（若配置了鉴权）
#   DIGEST_LOG_DIR     默认 /var/log/custom-furniture-dispatch

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
cd "$APP_DIR"

load_env_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$f"
    set +a
  fi
}

load_env_file "$APP_DIR/.env.local"
load_env_file "$APP_DIR/.env"
load_env_file "/etc/dispatch-digest.env"

APP_URL="${DISPATCH_APP_URL:-http://127.0.0.1:3000}"
LOG_DIR="${DIGEST_LOG_DIR:-/var/log/custom-furniture-dispatch}"
LOG_FILE="$LOG_DIR/weekly-digest.log"
KEY="${DIGEST_PUSH_KEY:-${SYNC_API_KEY:-}}"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

CURL_HEADERS=(-H "Content-Type: application/json")
if [[ -n "$KEY" ]]; then
  CURL_HEADERS+=(-H "x-digest-key: $KEY")
fi

log "==> weekly digest cron start (url=$APP_URL)"

HTTP_CODE=$(curl -sS -o /tmp/weekly-digest-response.json -w "%{http_code}" \
  -X POST "${APP_URL}/api/weekly-digest/cron" \
  "${CURL_HEADERS[@]}" \
  -d "{}" \
  --connect-timeout 15 \
  --max-time 120) || {
  log "ERROR: curl failed"
  exit 1
}

RESPONSE="$(cat /tmp/weekly-digest-response.json)"
log "HTTP $HTTP_CODE $RESPONSE"

if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
  log "==> weekly digest cron OK"
  exit 0
fi

log "==> weekly digest cron FAILED"
exit 1
