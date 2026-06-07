#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
cd "$APP_DIR"
export DISPATCH_APP_URL="${DISPATCH_APP_URL:-http://127.0.0.1:3000}"
node "$SCRIPT_DIR/daily-todos-cron.mjs" "$@"
