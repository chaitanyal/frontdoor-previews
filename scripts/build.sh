#!/usr/bin/env bash
set -euo pipefail

rm -rf dist .tmp/frontdoor-build
mkdir -p dist
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
    python3 scripts/validate_practice_json.py "${practice_dir}practice.json" >/dev/null
  fi
done

for item in ./*; do
  name="$(basename "$item")"
  case "$name" in
    AGENTS.md|README.md|wrangler.toml|githooks|scripts|templates|dist|node_modules|package.json|package-lock.json|tailwind.config.js|.tmp)
      continue
      ;;
  esac

  cp -R "$item" dist/
done

for practice_dir in dist/*/; do
  if [[ -f "${practice_dir}index.html" ]]; then
    mkdir -p "${practice_dir}assets/fonts"
    cp ./.tmp/frontdoor-build/styles.css "${practice_dir}assets/styles.css"
    cp ./shared/fonts/* "${practice_dir}assets/fonts/"
  fi
done

python3 scripts/generate_provider_pages.py
python3 scripts/embed_practice_json.py

rm -rf dist/shared/styles .tmp/frontdoor-build
find dist -name '*.md' -type f -delete
find dist -name 'practice.json' -type f -delete
find dist -name '.DS_Store' -type f -delete
