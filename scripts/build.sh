#!/usr/bin/env bash
set -euo pipefail

SITE="${SITE:-}"
FRONTDOOR_TARGET="${FRONTDOOR_TARGET:-preview}"
MARKETING_SITE_URL="https://frontdoor.health"

if [[ -n "$SITE" ]]; then
  FRONTDOOR_TARGET="practice"
fi

if [[ "$FRONTDOOR_TARGET" != "preview" && "$FRONTDOOR_TARGET" != "marketing" && "$FRONTDOOR_TARGET" != "practice" ]]; then
  echo "Unknown FRONTDOOR_TARGET: ${FRONTDOOR_TARGET}" >&2
  exit 1
fi

if [[ -n "$SITE" && ! -d "sites/${SITE}" ]]; then
  echo "Unknown site: ${SITE}" >&2
  exit 1
fi

rm -rf dist .tmp/frontdoor-build
mkdir -p dist
npm run build:css

if [[ "$FRONTDOOR_TARGET" == "marketing" ]]; then
  export FRONTDOOR_BUILD_ENV="marketing"
  for item in index.html robots.txt shared; do
    if [[ -e "$item" ]]; then
      cp -R "$item" dist/
    fi
  done
  python3 - <<'PY'
from pathlib import Path
page = Path('dist/index.html')
if page.exists():
    html = page.read_text(encoding='utf-8')
    html = html.replace('  <meta name="robots" content="noindex,nofollow" />\n', '')
    page.write_text(html, encoding='utf-8')
PY

  cat > dist/404.html <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Not Found | FrontDoor Health</title>
  <meta name="description" content="The requested FrontDoor Health page could not be found." />
  <meta name="robots" content="noindex,nofollow" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-warm-50 font-sans text-slate-950 antialiased">
  <main class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-16 text-center">
    <p class="text-sm font-semibold uppercase tracking-wide text-sage-700">404</p>
    <h1 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Page not found</h1>
    <p class="mt-5 text-lg leading-8 text-slate-600">This page is not part of the FrontDoor Health marketing site.</p>
    <a class="mx-auto mt-8 inline-flex rounded-2xl bg-brand-700 px-6 py-3.5 text-base font-semibold text-white" href="./">Return home</a>
  </main>
</body>
</html>
HTML

  if [[ -d stories ]]; then
    mkdir -p dist/case-studies
    cat > dist/case-studies/index.html <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Case Studies | FrontDoor Health</title>
  <meta name="description" content="Practice website transformation case studies from FrontDoor Health." />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-warm-50 font-sans text-slate-950 antialiased">
  <main class="mx-auto max-w-4xl px-5 py-16">
    <p class="text-sm font-semibold uppercase tracking-wide text-sage-700">Case Studies</p>
    <h1 class="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Practice transformations</h1>
    <p class="mt-5 text-lg leading-8 text-slate-600">Examples of how FrontDoor Health helps independent practices modernize their online presence.</p>
    <a class="mt-8 inline-flex rounded-2xl bg-brand-700 px-6 py-3.5 text-base font-semibold text-white" href="./drdronavalli/">Hillcroft Pulmonary transformation</a>
  </main>
</body>
</html>
HTML
    for story_dir in stories/*/; do
      story_name="$(basename "$story_dir")"
      cp -R "$story_dir" "dist/case-studies/${story_name}"
    done
  fi
elif [[ "$FRONTDOOR_TARGET" == "preview" ]]; then
  export FRONTDOOR_BUILD_ENV="preview"
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
  export FRONTDOOR_BUILD_ENV="production"
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

if [[ "$FRONTDOOR_TARGET" == "preview" ]]; then
  printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
elif [[ "$FRONTDOOR_TARGET" == "marketing" ]]; then
  {
    printf 'User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' "$MARKETING_SITE_URL"
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
      printf '  <url><loc>%s/%s</loc></url>\n' "$MARKETING_SITE_URL" "$page_path"
    done < <(find dist -name index.html -type f | sort)
    printf '</urlset>\n'
  } > dist/sitemap.xml

  if [[ ! -f dist/404.html ]]; then
    echo "Marketing build must include 404.html so unknown routes do not fall back to index.html" >&2
    exit 1
  fi
  for preview_route in drdronavalli northhillspsychiatry cibola; do
    if [[ -e "dist/${preview_route}" ]]; then
      echo "Marketing build must not include preview route: /${preview_route}/" >&2
      exit 1
    fi
  done
  if find dist -name '*.html' ! -name '404.html' -print0 | xargs -0 grep -F "noindex,nofollow" >/dev/null 2>&1; then
    echo "Marketing pages must be indexable and must not contain noindex,nofollow" >&2
    exit 1
  fi
else
  site_url="$(python3 - <<'PY'
import json
from pathlib import Path
config = json.loads(Path('dist/practice.json').read_text(encoding='utf-8'))
print((config.get('seo') or {}).get('siteUrl', '').rstrip('/'))
PY
)"
  allow_indexing="$(python3 - <<'PY'
import json
from pathlib import Path
config = json.loads(Path('dist/practice.json').read_text(encoding='utf-8'))
print('true' if (config.get('seo') or {}).get('allowIndexing') is True else 'false')
PY
)"
  if [[ -z "$site_url" ]]; then
    echo "Missing required field: seo.siteUrl" >&2
    exit 1
  fi
  if [[ "$site_url" != https://* ]]; then
    echo "seo.siteUrl must be an HTTPS URL starting with https://" >&2
    exit 1
  fi
  {
    printf 'User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' "$site_url"
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

  while IFS= read -r page; do
    if ! grep -Fq "<link rel=\"canonical\" href=\"${site_url}/" "$page"; then
      echo "Missing canonical URL using seo.siteUrl in ${page}" >&2
      exit 1
    fi
  done < <(find dist -name index.html -type f | sort)
  if grep -RF "pages.dev" dist >/dev/null; then
    echo "Production output must not reference pages.dev; use seo.siteUrl for production URLs" >&2
    exit 1
  fi
  if grep -RF "frontdoor-previews" dist >/dev/null; then
    echo "Production output must not reference frontdoor-previews; use seo.siteUrl for production URLs" >&2
    exit 1
  fi
  if [[ "$allow_indexing" == "true" ]] && grep -RF "noindex,nofollow" dist >/dev/null 2>&1; then
    echo "Production build contains noindex,nofollow despite seo.allowIndexing=true" >&2
    exit 1
  fi
fi

rm -rf dist/shared/styles .tmp/frontdoor-build
find dist -name '*.md' -type f -delete
find dist -name 'practice.json' -type f -delete
find dist -name '.DS_Store' -type f -delete
python3 scripts/validate_built_html.py dist
