#!/usr/bin/env bash
set -euo pipefail

SITE="${SITE:-}"

if [[ -n "$SITE" && ! -d "sites/${SITE}" ]]; then
  echo "Unknown site: ${SITE}" >&2
  exit 1
fi

rm -rf dist .tmp/frontdoor-build
mkdir -p dist
npm run build:css

if [[ -z "$SITE" ]]; then
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
else
  site_dir="sites/${SITE}"
  if [[ ! -f "${site_dir}/practice.json" ]]; then
    echo "Missing ${site_dir}/practice.json" >&2
    exit 1
  fi
  python3 scripts/validate_practice_json.py "${site_dir}/practice.json" >/dev/null
  cp -R "${site_dir}/." dist/
  if [[ -e robots.txt ]]; then
    cp robots.txt dist/
  fi
  mkdir -p dist/assets/fonts
  cp ./.tmp/frontdoor-build/styles.css dist/assets/styles.css
  cp ./shared/fonts/* dist/assets/fonts/
fi

python3 scripts/generate_provider_pages.py
node scripts/prerender_practice_pages.js dist
python3 scripts/generate_legal_pages.py dist

if [[ -n "$SITE" ]]; then
  site_url="https://${SITE}.pages.dev"
  {
    printf 'User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n' "$site_url"
  } > dist/robots.txt
  {
    printf '<?xml version="1.0" encoding="UTF-8"?>\n'
    printf '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    while IFS= read -r page; do
      page_path="${page#dist/}"
      page_path="${page_path%index.html}"
      if [[ "$page_path" == "./" ]]; then
        page_path=""
      fi
      printf '  <url><loc>%s/%s</loc></url>\n' "$site_url" "$page_path"
    done < <(find dist -name index.html -type f | sort)
    printf '</urlset>\n'
  } > dist/sitemap.xml
fi

rm -rf dist/shared/styles .tmp/frontdoor-build
find dist -name '*.md' -type f -delete
find dist -name 'practice.json' -type f -delete
find dist -name '.DS_Store' -type f -delete
python3 scripts/validate_built_html.py dist
