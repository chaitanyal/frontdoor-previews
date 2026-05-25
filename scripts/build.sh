#!/usr/bin/env bash
set -euo pipefail

npm run build:css

rm -rf dist
mkdir -p dist

for item in ./*; do
  name="$(basename "$item")"
  case "$name" in
    AGENTS.md|README.md|wrangler.toml|scripts|dist|node_modules|package.json|package-lock.json|tailwind.config.js)
      continue
      ;;
  esac

  cp -R "$item" dist/
done

rm -rf dist/shared/styles
find dist -name '.DS_Store' -type f -delete
