#!/usr/bin/env bash
set -euo pipefail

npm run build:css

for practice_dir in ./*/; do
  case "${practice_dir}" in
    "./dist/"|"./node_modules/"|"./templates/"|"./scripts/"|"./shared/")
      continue
      ;;
  esac

  if [[ -f "${practice_dir}index.html" ]]; then
    if [[ ! -f "${practice_dir}practice.json" ]]; then
      echo "Missing ${practice_dir}practice.json" >&2
      exit 1
    fi
    python3 -m json.tool "${practice_dir}practice.json" >/dev/null
  fi
done

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
    AGENTS.md|README.md|wrangler.toml|githooks|scripts|templates|dist|node_modules|package.json|package-lock.json|tailwind.config.js)
      continue
      ;;
  esac

  cp -R "$item" dist/
done

python3 scripts/generate_provider_pages.py
python3 scripts/embed_practice_json.py

rm -rf dist/shared/styles
find dist -name '*.md' -type f -delete
find dist -name 'practice.json' -type f -delete
find dist -name '.DS_Store' -type f -delete
