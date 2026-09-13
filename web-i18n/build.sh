#!/usr/bin/env bash
# khoj Web UI 中文化构建脚本
# ------------------------------------------------------------------------
# 流程：官方镜像提取 built/ -> inject.py 注入 <script> 标签 -> 产 dist/
# 之后 compose 挂载 dist/ 覆盖容器内 /app/src/khoj/interface/built，
# 并把 khoj-i18n.js 挂到 static/ 下以 /static/khoj-i18n.js 伺服（CSP 同源放行）。
#
# 用法：
#   bash build.sh                 # 默认用 ghcr.io/khoj-ai/khoj:latest
#   KHOJ_IMAGE=ghcr.io/khoj-ai/khoj:0.9.0 bash build.sh
#
# 上游同步后：镜像更新 -> 重跑本脚本 -> docker compose up -d（见 README）
set -euo pipefail
# 注意：不要设 MSYS_NO_PATHCONV——docker cp 的宿主机路径需要 MSYS 转换；
# 容器路径 name:/app/... 不受转换影响；/static/... 传给 python 的转换由 inject.py 正则兑底

cd "$(dirname "$0")"

KHOJ_IMAGE="${KHOJ_IMAGE:-ghcr.io/khoj-ai/khoj:latest}"
CONTAINER_BUILT="/app/src/khoj/interface/built"
# Windows Git Bash 兼容：mktemp -d 建在 /tmp 会映射到盘符路径，docker cp 不认；
# 改建在当前目录下，结束即删
TMP_ROOT="$(pwd)/.extract-tmp"
TMP_BUILT="$TMP_ROOT/built"

echo "==> [1/4] 从镜像提取 built/（$KHOJ_IMAGE）"
rm -rf "$TMP_ROOT"
mkdir -p "$TMP_ROOT"
docker create --name khoj-i18n-extract "$KHOJ_IMAGE" >/dev/null
trap 'docker rm -f khoj-i18n-extract >/dev/null 2>&1 || true; rm -rf "$TMP_ROOT"' EXIT
docker cp khoj-i18n-extract:"$CONTAINER_BUILT" "$TMP_BUILT"

echo "==> [2/4] 注入 i18n 脚本引用（带内容 hash 缓存破坏）"
SCRIPT_HASH=$(md5sum khoj-i18n.js | cut -c1-8)
python inject.py "$TMP_BUILT" dist "/static/khoj-i18n.js?v=$SCRIPT_HASH"

echo "==> [3/4] 拷贝翻译引擎到 dist 供挂载"
cp khoj-i18n.js dist-khoj-i18n.js

echo "==> [4/4] 完成。compose 挂载（~/.khoj/docker-compose.yml server.volumes）："
cat <<'EOF'
      # Web UI 中文化（web-i18n/ 构建产物，见仓库 web-i18n/README.md）
      - D:/project_room/workspace2024/mytest/khoj/web-i18n/dist:/app/src/khoj/interface/built:ro
      - D:/project_room/workspace2024/mytest/khoj/web-i18n/dist-khoj-i18n.js:/app/src/khoj/static/khoj-i18n.js:ro
EOF
echo "然后：cd ~/.khoj && docker compose up -d server"
