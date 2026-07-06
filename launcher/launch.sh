#!/bin/zsh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMMAND_SCRIPT="${PROJECT_DIR}/启动数智经营.command"
APP_URL="http://127.0.0.1:4314/"

if [ ! -f "$COMMAND_SCRIPT" ]; then
  osascript -e 'display alert "数智经营启动失败" message "未找到启动脚本：启动数智经营.command"' >/dev/null
  exit 1
fi

if curl --silent --fail --max-time 2 "$APP_URL" >/dev/null 2>&1; then
  open "$APP_URL"
  exit 0
fi

open -a Terminal "$COMMAND_SCRIPT"
