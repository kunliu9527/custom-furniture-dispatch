#!/usr/bin/env bash
# 在 ECS 上清理旧 zip 上传、重复目录、构建缓存等（不删订单数据）
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/custom-furniture-dispatch}"
DATA_DIR="${DATA_DIR:-/var/lib/custom-furniture-dispatch}"
APPLY=false

usage() {
  echo "用法: bash scripts/cleanup-server.sh [--apply]"
  echo "  默认仅预览将删除/清理的内容；加 --apply 才真正执行"
  echo "  不会删除: ${DATA_DIR}/snapshot.json、.env.local、pm2 进程"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=true; shift ;;
    -h | --help) usage; exit 0 ;;
    *) echo "未知参数: $1"; usage; exit 1 ;;
  esac
done

run_or_echo() {
  if $APPLY; then
    eval "$@"
  else
    echo "  [预览] $*"
  fi
}

section() {
  echo ""
  echo "========== $1 =========="
}

section "磁盘（清理前）"
df -h / /opt 2>/dev/null || df -h /

section "正式应用目录"
if [[ -d "$APP_DIR/.git" ]]; then
  echo "保留: $APP_DIR"
  git -C "$APP_DIR" log -1 --oneline 2>/dev/null || true
else
  echo "WARN: $APP_DIR 不是 git 仓库，请确认 APP_DIR"
fi

section "旧 zip / 临时脚本（/tmp、/root）"
while IFS= read -r -d '' f; do
  run_or_echo "rm -f $(printf '%q' "$f")"
done < <(
  find /tmp /root -maxdepth 1 -type f \( \
    -name 'deploy-update.sh' \
    -o -name 'install-server.sh' \
    -o -name '*custom-furniture*.zip' \
    -o -name '*dispatch*.zip' \
    -o -name 'custom-furniture-dispatch*.zip' \
  \) -print0 2>/dev/null
)

section "重复项目目录（/opt 下，保留 ${APP_DIR}）"
while IFS= read -r -d '' d; do
  [[ "$d" == "$APP_DIR" ]] && continue
  run_or_echo "rm -rf $(printf '%q' "$d")"
done < <(
  find /opt -maxdepth 1 -type d -name '*custom-furniture*' -print0 2>/dev/null
)

section "git stash（deploy 自动 stash）"
if [[ -d "$APP_DIR/.git" ]]; then
  STASH_COUNT=$(git -C "$APP_DIR" stash list 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$STASH_COUNT" -gt 0 ]]; then
    git -C "$APP_DIR" stash list 2>/dev/null || true
    if $APPLY; then
      git -C "$APP_DIR" stash clear
      echo "  已清空 git stash"
    else
      echo "  [预览] git -C \"$APP_DIR\" stash clear"
    fi
  else
    echo "  无 stash"
  fi
fi

section "构建缓存（${APP_DIR} 内 .next 等）"
if [[ -d "$APP_DIR" ]]; then
  if $APPLY; then
    (cd "$APP_DIR" && npm run clean 2>/dev/null) || run_or_echo "rm -rf \"$APP_DIR/.next\" \"$APP_DIR/out\""
  else
    for p in .next out build coverage; do
      [[ -e "$APP_DIR/$p" ]] && echo "  [预览] rm -rf \"$APP_DIR/$p\""
    done
  fi
fi

section "npm 缓存"
if $APPLY; then
  npm cache clean --force 2>/dev/null && echo "  npm cache 已清理" || echo "  npm cache 跳过"
else
  echo "  [预览] npm cache clean --force"
fi

section "数据目录旧备份（仅 .bak*，保留 snapshot.json）"
if [[ -d "$DATA_DIR" ]]; then
  BAK_COUNT=0
  while IFS= read -r -d '' f; do
    BAK_COUNT=$((BAK_COUNT + 1))
    run_or_echo "rm -f $(printf '%q' "$f")"
  done < <(find "$DATA_DIR" -maxdepth 1 -type f -name 'snapshot.json.bak*' -print0 2>/dev/null)
  [[ "$BAK_COUNT" -eq 0 ]] && echo "  无 snapshot.json.bak*"
  echo "  保留: ${DATA_DIR}/snapshot.json"
else
  echo "  数据目录不存在: $DATA_DIR"
fi

section "磁盘（清理后）"
if $APPLY; then
  df -h / /opt 2>/dev/null || df -h /
  echo ""
  echo "==> 清理完成。若刚删了 .next，请执行: cd $APP_DIR && npm run build && pm2 restart dispatch"
else
  echo ""
  echo "==> 以上为预览。确认无误后执行:"
  echo "    bash scripts/cleanup-server.sh --apply"
  echo "    或: APP_DIR=$APP_DIR bash /tmp/cleanup-server.sh --apply"
fi
