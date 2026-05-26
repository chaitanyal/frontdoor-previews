#!/usr/bin/env bash
set -euo pipefail

npm run build:css

for practice_dir in ./*/; do
  if [[ -f "${practice_dir}index.html" && -d "${practice_dir}assets" && "${practice_dir}" != "./northhillspsychiatry/" ]]; then
    cp ./northhillspsychiatry/assets/styles.css "${practice_dir}assets/styles.css"
  fi
done

rm -rf dist
mkdir -p dist

for item in ./*; do
  name="$(basename "$item")"
  case "$name" in
    AGENTS.md|README.md|wrangler.toml|scripts|templates|dist|node_modules|package.json|package-lock.json|tailwind.config.js)
      continue
      ;;
  esac

  cp -R "$item" dist/
done

rm -rf dist/shared/styles
find dist -name '*.md' -type f -delete
find dist -name '.DS_Store' -type f -delete
