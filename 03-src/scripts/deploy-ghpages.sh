#!/usr/bin/env bash
# 构建并发布到 GitHub Pages 的 gh-pages 分支
# 用法（在 03-src 目录）：npm run deploy
set -e

REPO="https://github.com/Jane5256/philosophy-timeline.git"
HERE="$(cd "$(dirname "$0")/.." && pwd)" # 03-src

cd "$HERE"
npm run build

cd dist
touch .nojekyll            # 禁用 Jekyll，原样发布静态文件
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.email=julin5256@gmail.com -c user.name=janeli commit -q -m "deploy $(date -u +%FT%TZ)"
git push -f "$REPO" gh-pages
rm -rf .git
echo "✅ 已发布到 gh-pages → https://jane5256.github.io/philosophy-timeline/"
