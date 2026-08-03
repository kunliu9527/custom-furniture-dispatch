#!/usr/bin/env bash
# 在服务器内存紧张时：本机先 npm run build，再上传 .next 并重启（避免 ECS 上 build OOM）
# 用法（本机 PowerShell）见下方注释。
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/custom-furniture-dispatch}"
cd "$APP_DIR"

# kill hung builds
pkill -f 'next build' 2>/dev/null || true
pkill -f 'tsc' 2>/dev/null || true

if [[ -f /tmp/next-standalone.tgz ]]; then
  echo "==> extract uploaded .next"
  rm -rf .next
  tar -xzf /tmp/next-standalone.tgz
fi

# ensure LLM env placeholders
touch .env.local
grep -q '^ASSISTANT_LLM_API_KEY=' .env.local || echo 'ASSISTANT_LLM_API_KEY=' >> .env.local
grep -q '^ASSISTANT_LLM_BASE_URL=' .env.local || echo 'ASSISTANT_LLM_BASE_URL=https://api.deepseek.com/v1' >> .env.local
grep -q '^ASSISTANT_LLM_MODEL=' .env.local || echo 'ASSISTANT_LLM_MODEL=deepseek-chat' >> .env.local

pm2 restart dispatch --update-env || pm2 start deploy/ecosystem.config.cjs
sleep 2
curl -sf http://127.0.0.1:3000/api/assistant/token && echo || echo "token endpoint failed"
curl -sf -o /dev/null http://127.0.0.1:3000/api/sync && echo "sync OK"
echo "若 llmConfigured=false，请在 .env.local 填入 ASSISTANT_LLM_API_KEY 后: pm2 restart dispatch --update-env"
