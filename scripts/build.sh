#!/usr/bin/env bash
set -euo pipefail

rm -rf dist .tmp/frontdoor-build
mkdir -p dist
npm run build:css

# Root preview landing page and shared assets.
for item in index.html robots.txt shared; do
  if [[ -e "$item" ]]; then
    cp -R "$item" dist/
  fi
done

# Practice preview sites build from sites/* but keep root-level preview URLs.
for site_dir in sites/*/; do
  site_name="$(basename "$site_dir")"
  if [[ "$site_name" == "template" ]]; then
    continue
  fi

  if [[ -f "${site_dir}index.html" ]]; then
    if [[ ! -f "${site_dir}practice.json" ]]; then
      echo "Missing ${site_dir}practice.json" >&2
      exit 1
    fi
    python3 scripts/validate_practice_json.py "${site_dir}practice.json" >/dev/null
  fi

  cp -R "$site_dir" "dist/${site_name}"
done

# Marketing stories build under /stories/ for preview.
if [[ -d stories ]]; then
  mkdir -p dist/stories
  for story_dir in stories/*/; do
    story_name="$(basename "$story_dir")"
    cp -R "$story_dir" "dist/stories/${story_name}"
  done
fi

for practice_dir in dist/*/; do
  if [[ -f "${practice_dir}index.html" && -f "${practice_dir}practice.json" ]]; then
    mkdir -p "${practice_dir}assets/fonts"
    cp ./.tmp/frontdoor-build/styles.css "${practice_dir}assets/styles.css"
    cp ./shared/fonts/* "${practice_dir}assets/fonts/"
  fi
done

python3 scripts/generate_provider_pages.py
node scripts/prerender_practice_pages.js dist

rm -rf dist/shared/styles .tmp/frontdoor-build
find dist -name '*.md' -type f -delete
find dist -name 'practice.json' -type f -delete
find dist -name '.DS_Store' -type f -delete
python3 scripts/validate_built_html.py dist
