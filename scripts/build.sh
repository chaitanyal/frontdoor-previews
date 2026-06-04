#!/usr/bin/env bash
set -euo pipefail

FRONTDOOR_TARGET="${FRONTDOOR_TARGET:-}"
SITE_ID="${SITE_ID:-}"
MARKETING_SITE_URL="https://frontdoor.health"

if [[ -z "$FRONTDOOR_TARGET" ]]; then
  cat >&2 <<'EOF'
ERROR: FRONTDOOR_TARGET is required.

Valid targets:
- marketing
- practice
- preview

For the shared preview Pages project, use:
FRONTDOOR_TARGET=preview SITE_ID=ALL ./scripts/build.sh
EOF
  exit 1
fi

if [[ "$FRONTDOOR_TARGET" != "marketing" && "$FRONTDOOR_TARGET" != "practice" && "$FRONTDOOR_TARGET" != "preview" ]]; then
  echo "ERROR: Unknown deployment target: ${FRONTDOOR_TARGET}" >&2
  echo "Valid targets: marketing, practice, preview" >&2
  exit 1
fi

if [[ "$FRONTDOOR_TARGET" == "practice" ]]; then
  if [[ -z "$SITE_ID" ]]; then
    echo "ERROR: SITE_ID is required for practice builds." >&2
    exit 1
  fi
  if [[ "$SITE_ID" == "ALL" ]]; then
    echo "ERROR: SITE_ID=ALL is only valid for preview builds." >&2
    exit 1
  fi
  if [[ ! -d "sites/${SITE_ID}" ]]; then
    echo "ERROR: Unknown SITE_ID: ${SITE_ID}" >&2
    exit 1
  fi
elif [[ "$FRONTDOOR_TARGET" == "preview" ]]; then
  if [[ -z "$SITE_ID" ]]; then
    echo "ERROR: SITE_ID is required for preview builds. Use SITE_ID=ALL for the shared preview Pages project." >&2
    exit 1
  fi
  if [[ "$SITE_ID" != "ALL" && ! -d "sites/${SITE_ID}" ]]; then
    echo "ERROR: Unknown SITE_ID: ${SITE_ID}" >&2
    exit 1
  fi
elif [[ -n "$SITE_ID" ]]; then
  echo "ERROR: SITE_ID is not used for marketing builds." >&2
  exit 1
fi

rm -rf dist .tmp/frontdoor-build
mkdir -p dist
npm run build:css

generate_sitemap() {
  local site_url="$1"
  {
    printf '<?xml version="1.0" encoding="UTF-8"?>\n'
    printf '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    while IFS= read -r page; do
      page_path="${page#dist/}"
      page_path="${page_path%index.html}"
      if [[ "$page_path" == "./" ]]; then
        page_path=""
      fi
      if [[ "$page_path" == previews/* ]]; then
        continue
      fi
      printf '  <url><loc>%s/%s</loc></url>\n' "$site_url" "$page_path"
    done < <(find dist -name index.html -type f | sort)
    printf '</urlset>\n'
  } > dist/sitemap.xml
}

practice_allows_indexing() {
  python3 -c 'import json, sys; config = json.load(open(sys.argv[1], encoding="utf-8")); print("true" if (config.get("seo") or {}).get("allowIndexing") is True else "false")' "$1"
}

practice_site_url() {
  python3 -c 'import json, sys; config = json.load(open(sys.argv[1], encoding="utf-8")); print((config.get("seo") or {}).get("siteUrl", "").rstrip("/"))' "$1"
}

write_public_robots() {
  local sitemap_url="$1"
  {
    printf 'User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' "$sitemap_url"
  } > dist/robots.txt
}

generate_noindex_headers() {
  local headers_file="dist/_headers"
  local wrote_headers="false"
  : > "$headers_file"

  while IFS= read -r config_path; do
    if [[ "$(practice_allows_indexing "$config_path")" == "true" ]]; then
      continue
    fi

    site_root="${config_path%/practice.json}"
    route_path="${site_root#dist}"
    if [[ -z "$route_path" ]]; then
      route="/*"
    else
      route="/${route_path#/}/*"
    fi

    printf '%s\n  X-Robots-Tag: noindex, nofollow\n' "$route" >> "$headers_file"
    wrote_headers="true"
  done < <(find dist -name practice.json -type f | sort)

  if [[ "$wrote_headers" != "true" ]]; then
    rm -f "$headers_file"
  fi
}

copy_noindex_preview_sites() {
  local preview_count=0

  for site_dir in sites/*/; do
    site_id="$(basename "$site_dir")"
    if [[ "$site_id" == "template" ]]; then
      continue
    fi
    if [[ ! -f "${site_dir}/practice.json" ]]; then
      echo "ERROR: Missing ${site_dir}/practice.json" >&2
      exit 1
    fi
    python3 scripts/validate_practice_json.py "${site_dir}/practice.json" >/dev/null
    if [[ "$(practice_allows_indexing "${site_dir}/practice.json")" == "true" ]]; then
      continue
    fi
    mkdir -p "dist/previews/${site_id}"
    cp -R "${site_dir}/." "dist/previews/${site_id}/"
    mkdir -p "dist/previews/${site_id}/assets/fonts"
    cp ./.tmp/frontdoor-build/styles.css "dist/previews/${site_id}/assets/styles.css"
    cp ./shared/fonts/* "dist/previews/${site_id}/assets/fonts/"
    preview_count=$((preview_count + 1))
  done

  if [[ "$preview_count" -eq 0 ]]; then
    echo "ERROR: Preview build found no sites with seo.allowIndexing=false." >&2
    exit 1
  fi
}

if [[ "$FRONTDOOR_TARGET" == "marketing" ]]; then
  export FRONTDOOR_BUILD_ENV="marketing"
  cp -R marketing/. dist/
  python3 scripts/render_marketing.py dist
  copy_noindex_preview_sites
  python3 scripts/generate_provider_pages.py
  node scripts/prerender_practice_pages.js dist
  python3 scripts/generate_legal_pages.py dist
  generate_noindex_headers

  write_public_robots "$MARKETING_SITE_URL"
  generate_sitemap "$MARKETING_SITE_URL"

  if [[ ! -f dist/404.html ]]; then
    echo "ERROR: Marketing build must include 404.html." >&2
    exit 1
  fi
  for practice_dir in sites/*/; do
    practice_route="$(basename "$practice_dir")"
    if [[ "$practice_route" != "template" && -e "dist/${practice_route}" ]]; then
      echo "ERROR: Marketing build must not include practice route: /${practice_route}/" >&2
      exit 1
    fi
  done
  if find dist -name '*.html' ! -path 'dist/previews/*' ! -name '404.html' -print0 | xargs -0 grep -F "noindex" >/dev/null 2>&1; then
    echo "ERROR: Marketing pages must be indexable and must not contain noindex." >&2
    exit 1
  fi
else
  if [[ "$FRONTDOOR_TARGET" == "practice" ]]; then
    export FRONTDOOR_BUILD_ENV="production"
  else
    export FRONTDOOR_BUILD_ENV="preview"
  fi

  if [[ "$FRONTDOOR_TARGET" == "preview" && "$SITE_ID" == "ALL" ]]; then
    copy_noindex_preview_sites
    write_public_robots "$MARKETING_SITE_URL"
  else
    site_dir="sites/${SITE_ID}"
    if [[ ! -f "${site_dir}/practice.json" ]]; then
      echo "ERROR: Missing ${site_dir}/practice.json" >&2
      exit 1
    fi
    python3 scripts/validate_practice_json.py "${site_dir}/practice.json" >/dev/null
    if [[ "$FRONTDOOR_TARGET" == "preview" ]]; then
      if [[ "$(practice_allows_indexing "${site_dir}/practice.json")" == "true" ]]; then
        echo "ERROR: Preview builds require seo.allowIndexing=false in ${site_dir}/practice.json." >&2
        exit 1
      fi
      mkdir -p "dist/previews/${SITE_ID}"
      cp -R "${site_dir}/." "dist/previews/${SITE_ID}/"
      mkdir -p "dist/previews/${SITE_ID}/assets/fonts"
      cp ./.tmp/frontdoor-build/styles.css "dist/previews/${SITE_ID}/assets/styles.css"
      cp ./shared/fonts/* "dist/previews/${SITE_ID}/assets/fonts/"
    else
      cp -R "${site_dir}/." dist/
      mkdir -p dist/assets/fonts
      cp ./.tmp/frontdoor-build/styles.css dist/assets/styles.css
      cp ./shared/fonts/* dist/assets/fonts/
    fi
  fi

  python3 scripts/generate_provider_pages.py
  node scripts/prerender_practice_pages.js dist
  python3 scripts/generate_legal_pages.py dist
  generate_noindex_headers

  if [[ "$FRONTDOOR_TARGET" == "preview" ]]; then
    write_public_robots "$MARKETING_SITE_URL"
  else
    site_url="$(practice_site_url "dist/practice.json")"
    allow_indexing="$(practice_allows_indexing "dist/practice.json")"
    if [[ -z "$site_url" ]]; then
      echo "ERROR: Missing required field: seo.siteUrl" >&2
      exit 1
    fi
    if [[ "$site_url" != https://* ]]; then
      echo "ERROR: seo.siteUrl must be an HTTPS URL starting with https://" >&2
      exit 1
    fi
    if [[ "$allow_indexing" == "true" ]]; then
      write_public_robots "$site_url"
      generate_sitemap "$site_url"
    else
      write_public_robots "$MARKETING_SITE_URL"
      rm -f dist/sitemap.xml
    fi

    while IFS= read -r page; do
      if ! grep -Fq "<link rel=\"canonical\" href=\"${site_url}/" "$page"; then
        echo "ERROR: Missing canonical URL using seo.siteUrl in ${page}" >&2
        exit 1
      fi
    done < <(find dist -name index.html -type f | sort)
    if grep -RF "pages.dev" dist >/dev/null; then
      echo "ERROR: Production output must not reference pages.dev; use seo.siteUrl for production URLs." >&2
      exit 1
    fi
    if grep -RF "frontdoor-previews" dist >/dev/null; then
      echo "ERROR: Production output must not reference frontdoor-previews; use seo.siteUrl for production URLs." >&2
      exit 1
    fi
    if [[ "$allow_indexing" == "true" ]] && grep -RF "noindex" dist >/dev/null 2>&1; then
      echo "ERROR: Production build contains noindex despite seo.allowIndexing=true." >&2
      exit 1
    fi
  fi
fi

rm -rf dist/shared/styles .tmp/frontdoor-build
find dist -name '*.md' -type f -delete
find dist -name 'practice.json' -type f -delete
find dist -name 'marketing.json' -type f -delete
find dist -name '.DS_Store' -type f -delete
python3 scripts/validate_built_html.py dist
