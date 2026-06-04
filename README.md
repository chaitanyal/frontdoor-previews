# FrontDoor Health Previews

Static HTML marketing and practice sites for small medical practices, deployed as separate Cloudflare Pages projects.

```text
https://frontdoor.health
https://drdronavalli.com
https://frontdoor.health/previews/<practice-slug>/
```

Example:

```text
npm run build:preview:all
```

## Repository Structure

Practice source files live under `sites/`. The folder name is the `SITE_ID` used by explicit production and preview practice builds.

```text
frontdoor-previews/
  marketing/                 # frontdoor.health source pages
    index.html
    404.html
    about/
    case-studies/
    transformations/
    assets/
    marketing.json           # marketing configuration
  sites/
    template/                # starter structure for new practices
    drdronavalli/
      index.html             # shared render shell
      practice.json          # practice + provider content
      images/
      assets/fonts/
    northhillspsychiatry/
      index.html
      practice.json
      images/
      assets/fonts/
  shared/
    home-page.js
    styles/frontdoor.css
    fonts/
    logos/
  scripts/
  templates/
  dist/
```

New practices can be started with:

```bash
cp -R sites/template sites/newpractice
```

Then update `sites/newpractice/practice.json`, content, providers, and assets. No build script changes should be required.

## Stack

- Static HTML
- Tailwind CSS compiled at build time
- Minimal JavaScript
- Static assets only
- Hosted on Cloudflare Pages

There is no backend, database, framework build step, or authenticated application code in this repository.

## Content and Build Process

Practice-specific content lives in each `sites/<practice-slug>/practice.json`. Shared palette definitions live in `shared/themes.json`, and each practice selects one with its `theme` field. Shared homepage rendering lives in `shared/home-page.js`, practice homepage prerendering lives in `scripts/prerender_practice_pages.js`, provider profile rendering lives in `scripts/generate_provider_pages.py`, and shared Tailwind source styles live in `shared/styles/frontdoor.css`. The checked-in practice `index.html` files are generic local-preview shells; practice-specific metadata, palette variables, and page content are prerendered from `practice.json` during the build.

Build flow:

```text
sites/<practice>/practice.json + shared/themes.json + shared/home-page.js + shared/styles/frontdoor.css
  -> scripts/generate_provider_pages.py
  -> scripts/prerender_practice_pages.js
  -> scripts/validate_built_html.py
  -> rendered HTML/CSS in dist/
  -> Cloudflare Pages
```

Builds are intentionally target-specific. Shared preview deployments use `SITE_ID=ALL` to build configured noindex practice previews into `dist/previews/<practice-slug>/`.

Marketing build flow:

1. Compiles Tailwind CSS from `shared/styles/frontdoor.css`.
2. Cleans `dist/`.
3. Copies `marketing/` into `dist/`.
4. Renders the featured practice from `marketing/marketing.json` and `sites/<site-id>/practice.json`.
5. Copies the selected featured practice hero image into `dist/assets/featured-practice/`.
6. Generates `robots.txt` and `sitemap.xml` for `https://frontdoor.health`.
7. Validates built HTML for basic structure and local asset paths.

Practice build flow:

1. Requires `SITE_ID`.
2. Compiles Tailwind CSS from `shared/styles/frontdoor.css`.
3. Cleans `dist/`.
4. Validates `sites/<SITE_ID>/practice.json`.
5. Copies only `sites/<SITE_ID>/` into `dist/`.
6. Copies compiled CSS to `dist/assets/styles.css` and shared fonts to `dist/assets/fonts/`.
7. Generates static provider, privacy, and accessibility pages.
8. Prerenders the practice homepage from `practice.json`.
9. Generates deployment-specific `robots.txt`, `_headers` for noindex sites, and `sitemap.xml` for indexable production practice builds.
10. Removes source-only files such as `practice.json`, Markdown files, and build-only artifacts from `dist/`.
11. Validates built HTML for basic structure, SEO smoke checks, JSON-LD parsing, and local asset paths.

Resulting production practice output:

```text
dist/
  index.html
  providers/
  privacy/
  accessibility/
  assets/
  robots.txt
```

Resulting shared preview output:

```text
dist/
  previews/
    northhillspsychiatry/
      index.html
      providers/
      privacy/
      accessibility/
      assets/
  _headers
  robots.txt
```

## Cloudflare Pages Deployment

Use the build script so repository-only files such as `AGENTS.md`, `scripts/`, and `practice.json` are not published.

FrontDoor Health marketing site:

- Domain: `frontdoor.health`
- Build command: `npm run build:marketing`
- Build output directory: `dist`

Production practice deployments:

- Example domain: `drdronavalli.com`
- Build command: `SITE_ID=drdronavalli npm run build:practice`
- Build output directory: `dist`

Preview practice deployments:

- Shared preview URL: `https://frontdoor.health/previews/<practice-slug>/`
- Build command: `npm run build:preview:all`
- Equivalent explicit command: `FRONTDOOR_TARGET=preview SITE_ID=ALL ./scripts/build.sh`
- Build output directory: `dist`

Production practice deployments use `build:practice`; the shared preview Pages project uses `build:preview:all`; the marketing site uses `build:marketing`.

Cloudflare Pages deploys the generated `dist/` directory.

## Image Optimization

Generate WebP copies of raster images and update HTML references with:

```bash
python3 scripts/convert_images_to_webp.py --update-html
```

The script scans source `images/` folders, skips SVG/WebP files, and ignores generated folders like `dist/`.

## Development Notes

- Use relative asset paths so built sites work from their deployment root and nested pages.
- Keep previews mobile-first and accessible.
- Prefer optimized JPG/WebP images and SVG logos.
- Drive practice and provider-specific content from `practice.json`; avoid one-off HTML/CSS edits per practice or provider.
- Drive the marketing featured practice from `marketing/marketing.json`; changing `featuredPractice` should not require homepage HTML edits.
- Keep templates opinionated. Add new JSON knobs only when they are reusable across practices.
- Provider profile UI labels have defaults in `scripts/generate_provider_pages.py` and can be overridden with `providerProfileLabels` in `practice.json` when needed.
- Treat per-practice `assets/styles.css` as a build output, not source. Shared CSS source lives in `shared/styles/frontdoor.css`.
- Avoid production healthcare portal behavior or HIPAA-sensitive workflows in these previews.

See `AGENTS.md` for repository-specific implementation guidelines.
