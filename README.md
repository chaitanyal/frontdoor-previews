# FrontDoor Health Previews

Static HTML preview sites for small medical practices, deployed under:

```text
https://preview.frontdoor.health/<practice-slug>
```

Example:

```text
https://preview.frontdoor.health/northhillspsychiatry
```

## Repository Structure

Practice preview source files live under `sites/`. The folder name becomes the deployed preview URL slug, but the build still outputs each practice at the root of `dist/` to preserve existing URLs.

```text
frontdoor-previews/
  index.html                 # FrontDoor preview landing page
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
  stories/                   # FrontDoor marketing/case-study content
    drdronavalli/
      index.html
      images/assets
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

`npm run build` runs `scripts/build.sh`, which:

1. Compiles Tailwind CSS from `shared/styles/frontdoor.css`.
2. Copies the root preview landing page and shared assets into `dist/`.
3. Verifies each practice in `sites/` with an `index.html` has a valid `practice.json` and known `theme` from `shared/themes.json`.
4. Copies each practice from `sites/<practice-slug>/` to `dist/<practice-slug>/`, preserving preview URLs.
5. Copies stories from `stories/<story-slug>/` to `dist/stories/<story-slug>/`.
6. Creates each practice `assets/` directory in `dist/`, copies compiled CSS to `assets/styles.css`, and copies shared fonts to `assets/fonts/`.
7. Generates static provider profile pages under `dist/<practice-slug>/providers/<provider-slug>/` from provider data in `practice.json`.
8. Prerenders each practice homepage into static HTML with metadata and page content from `practice.json`.
9. Removes source-only files such as `practice.json`, Markdown files, and build-only artifacts from `dist/`.
10. Validates built HTML for basic structure, SEO smoke checks, JSON-LD parsing, and local asset paths.

Resulting preview output:

```text
dist/
  drdronavalli/
  northhillspsychiatry/
  stories/
    drdronavalli/
```

## Cloudflare Pages Deployment

Use the build script so repository-only files such as `AGENTS.md`, `scripts/`, and `practice.json` are not published.

- Build command: `./scripts/build.sh`
- Build output directory: `dist`

Cloudflare Pages deploys the generated `dist/` directory.

## Image Optimization

Generate WebP copies of raster images and update HTML references with:

```bash
python3 scripts/convert_images_to_webp.py --update-html
```

The script scans source `images/` folders, skips SVG/WebP files, and ignores generated folders like `dist/`.

## Development Notes

- Use relative asset paths, because previews are served from subpaths.
- Keep previews mobile-first and accessible.
- Prefer optimized JPG/WebP images and SVG logos.
- Drive practice and provider-specific content from `practice.json`; avoid one-off HTML/CSS edits per practice or provider.
- Keep templates opinionated. Add new JSON knobs only when they are reusable across practices.
- Provider profile UI labels have defaults in `scripts/generate_provider_pages.py` and can be overridden with `providerProfileLabels` in `practice.json` when needed.
- Treat per-practice `assets/styles.css` as a build output, not source. Shared CSS source lives in `shared/styles/frontdoor.css`.
- Avoid production healthcare portal behavior or HIPAA-sensitive workflows in these previews.

See `AGENTS.md` for repository-specific implementation guidelines.
