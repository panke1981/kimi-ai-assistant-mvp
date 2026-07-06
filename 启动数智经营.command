#!/bin/zsh
set -e

PROJECT_DIR="/Users/air/Documents/数智经营"
APP_PORT="4314"
APP_URL="http://127.0.0.1:${APP_PORT}/"

cd "$PROJECT_DIR"

echo "数智经营指挥中心"
echo "项目目录：$PROJECT_DIR"
echo

if ! command -v npm >/dev/null 2>&1; then
  echo "未找到 npm。请先安装 Node.js。"
  read "?按回车关闭窗口..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "首次启动：正在安装依赖..."
  npm install
fi

if curl --silent --fail --max-time 2 "$APP_URL" >/dev/null 2>&1; then
  echo "检测到项目已在运行，正在打开浏览器..."
  open "$APP_URL"
  echo
  echo "如果需要停止已有服务，请关闭之前启动它的终端窗口。"
  read "?按回车关闭窗口..."
  exit 0
fi

echo "正在启动本地开发服务..."
echo "浏览器会自动打开：$APP_URL"
echo "关闭此窗口会停止项目服务。"
echo

(sleep 3 && open "$APP_URL") &
npm run dev -- --host 127.0.0.1 --port "$APP_PORT" --strictPort
