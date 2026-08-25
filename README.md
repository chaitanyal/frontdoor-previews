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
  marketing/                 # frontdoor.health data and static assets
    assets/
    case-studies/
    marketing.json           # marketing configuration
  sites/
    template/                # starter structure for new practices
    drdronavalli/
      practice.json          # practice + provider content
      images/
      assets/fonts/
    northhillspsychiatry/
      practice.json
      images/
      assets/fonts/
  src/
    components/              # reusable Astro components
    entries/                 # target-specific Astro routes
    layouts/
    lib/
    pages/shared/            # shared practice page implementations
  shared/
    styles/frontdoor.css
    themes.json
    fonts/
    logos/
    analytics.js              # browser CTA tracking
  scripts/
  templates/
  worker/                     # Cloudflare Worker + D1 analytics service
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

The preview and marketing sites do not include authenticated application code or production healthcare portal behavior. CTA analytics are handled separately by the Cloudflare Worker in `worker/`, which records non-PHI event metadata in D1.

## Content and Build Process

Practice-specific content lives in each `sites/<practice-slug>/practice.json`. Shared palette definitions live in `shared/themes.json`, and each practice selects one with its `theme` field. Astro renders the homepage, provider pages, privacy page, and accessibility page at build time from reusable components under `src/`. Shared Tailwind source styles live in `shared/styles/frontdoor.css`.

Practice homepages keep services, financial or insurance information, patient resources, location details, and FAQs on one page. `src/lib/home-sections.mjs` defines the canonical section IDs and supplies both the header and footer navigation, while provider and legal pages remain separate routes. The practice Playwright suite verifies that every generated section link resolves, each enabled section has one heading and summary, and the links work from the keyboard.

Build flow:

```text
sites/<practice>/practice.json + shared/themes.json + shared/styles/frontdoor.css
  -> reusable Astro components under src/
  -> scripts/build_astro.mjs
  -> scripts/validate_built_html.py
  -> rendered HTML/CSS in dist/
  -> Cloudflare Pages
```

### Practice and provider search images

`seo.ogImage` and `seo.ogImageAlt` describe the practice homepage. When
`seo.ogImage` is omitted, a single-provider practice uses that provider's image;
a multi-provider practice uses `hero.image`. An explicit homepage image always
wins. `seo.defaultOgImage` is not supported.

Every provider requires `image` and `imageAlt`. Provider pages use
`provider.seo.ogImage` when configured and otherwise use `provider.image`.
Provider-specific `seo.title` is required when `seo.allowIndexing` is true.
This keeps a multi-provider practice image on the homepage while giving each
indexable `/providers/<slug>/` page its physician portrait and metadata.

Browser analytics are copied from `shared/analytics.js` into `dist/shared/analytics.js` during builds. Rendered homepage and provider pages set `window.FRONTDOOR_PRACTICE_SLUG` and include the shared analytics script so CTA clicks marked with `data-frontdoor-cta` can be sent to `https://analytics.frontdoor.health/event`. The same client sends `page_view` events only when the browser path starts with `/previews/`. Local `file://`, `localhost`, and loopback previews do not send analytics events.

Builds are intentionally target-specific. Shared preview deployments use `SITE_ID=ALL` to build configured noindex practice previews into `dist/previews/<practice-slug>/`.

Marketing build flow:

1. Compiles Tailwind CSS from `shared/styles/frontdoor.css`.
2. Cleans `dist/`.
3. Stages marketing assets and case-study media for Astro.
4. Renders marketing routes and the featured practice from `marketing/marketing.json` and `sites/<site-id>/practice.json` with Astro.
5. Copies the selected featured practice hero image into `dist/assets/featured-practice/`.
6. Copies noindex preview sites into `dist/previews/<practice-slug>/`.
7. Generates preview provider, privacy, and accessibility pages with the shared Astro practice components.
8. Generates `_headers`, `robots.txt`, and `sitemap.xml` for `https://frontdoor.health`.
9. Validates built HTML for basic structure and local asset paths.

Practice build flow:

1. Requires `SITE_ID`.
2. Compiles Tailwind CSS from `shared/styles/frontdoor.css`.
3. Cleans `dist/`.
4. Validates `sites/<SITE_ID>/practice.json`.
5. Copies only `sites/<SITE_ID>/` into `dist/`.
6. Copies compiled CSS to `dist/assets/styles.css` and shared fonts to `dist/assets/fonts/`.
7. Generates the static homepage, provider, privacy, and accessibility pages with Astro.
8. Preserves the existing relative route and asset contract.
9. Generates deployment-specific `robots.txt`, `_headers` for noindex sites, and `sitemap.xml` plus `llms.txt` for indexable production practice builds.
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
  sitemap.xml              # indexable builds only
  llms.txt                 # indexable builds only
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
- Also serves noindex preview URLs under `https://frontdoor.health/previews/<practice-slug>/`

Production practice deployments:

- Example domain: `drdronavalli.com`
- Build command: `SITE_ID=drdronavalli npm run build:practice`
- Build output directory: `dist`

Preview practice deployments:

- Shared preview URL: `https://frontdoor.health/previews/<practice-slug>/`
- Build command: `npm run build:preview:all`
- Equivalent explicit command: `FRONTDOOR_TARGET=preview SITE_ID=ALL FRONTDOOR_ASTRO_DEPLOY=1 node scripts/build_astro.mjs`
- Build output directory: `dist`

Production practice deployments use `build:practice`; the shared preview Pages project uses `build:preview:all`; the marketing site uses `build:marketing`.

Cloudflare Pages deploys the generated `dist/` directory.

## Astro Builder and Verification

The public build commands above use Astro and write deployable output to `dist/`.
These verification commands run the same Astro builder in isolation and write only
to `.tmp/astro-dist/<target>/`:

```bash
npm run build:astro:marketing
SITE_ID=drdronavalli npm run build:astro:practice
SITE_ID=northhillspsychiatry npm run build:astro:preview
npm run build:astro:preview:all
```

Run the repeatable configuration and direct-file verification with:

```bash
npm run test:astro:foundation
```

The shared Astro layouts, practice-data loader, SEO/theme/asset helpers, and
analytics fixtures are verified with:

```bash
npm run test:analytics
```

This command builds isolated Astro marketing, `drdronavalli`, and
`northhillspsychiatry` fixtures, then runs exact-payload Playwright analytics
checks. Tests intercept analytics, email, Turnstile, and Google Ads requests.

Semantic output contracts cover marketing, every configured practice, the North
Hills pilot preview, and the all-preview build:

```bash
npm run test:output-contracts
```

Refresh the checked-in contracts only after reviewing an intentional output change
with `npm run capture:output-contracts`.

Cloudflare Pages branch deployments can be checked with `npm run test:staging`.
Set `FRONTDOOR_STAGING_MARKETING_URL`, `FRONTDOOR_STAGING_PREVIEW_URL`, and
`FRONTDOOR_STAGING_PRACTICE_URL` when testing a new branch. The suite verifies real
HTTP routes, response-header indexing protection, sitemaps, robots files, nested
assets, analytics payloads, and the preview-request Function's non-email OPTIONS
path.

Each build stages copied, unhashed public files under
`.tmp/astro-public/<target>/`. Astro copies those files unchanged into the selected
`dist/` or verification output. Pages reference them with route-relative URLs: root pages use `./assets/...`,
while the nested preview route uses `../../assets/...`. This preserves direct
`file://` inspection and the existing URL strategy. Astro-managed or hashed image
imports are intentionally deferred until separately approved.

The Astro wrapper also copies `shared/analytics.js`, `shared/attribution.js`, and
`shared/google-ads.js` byte-for-byte into each target. Practice home and provider
pages load attribution before practice analytics; privacy pages load attribution
only. Marketing pages load the existing Google Ads integration
without adding practice analytics.

## Common Workflows

Install the repository's staged-file checks once per clone:

```bash
npm run hooks:install
```

The hook skips builds for Markdown-only commits, verifies only affected practices
for practice-local commits, checks marketing-only commits against the marketing
contract, and reserves the full output-contract suite for shared or mixed changes.

### Change one practice

Edit `sites/<practice-slug>/practice.json` or its local assets, then run:

```bash
npm run verify:site -- <practice-slug>
```

This validates the configuration, builds that practice in isolation, validates its
HTML and assets, and compares only its semantic output contract. If the practice is
featured on the marketing site, it also verifies that dependent marketing target.

Switch an existing theme without editing JSON manually:

```bash
npm run theme:set -- <practice-slug> calm-healthcare
npm run verify:site -- <practice-slug>
```

Adding a new theme to `shared/themes.json` is a shared-platform change and requires
`npm run test:output-contracts`.

### Add or retire a provider

To add a provider, first place the portrait under the practice directory and create
a JSON file containing one complete provider object. The command validates the
object and its portrait before changing `practice.json`:

```bash
npm run provider:add -- <practice-slug> <provider-json>
npm run verify:site -- <practice-slug> --update-contract
```

Review the intentional provider-route change in the contract diff before committing.

To retire a provider:

```bash
npm run provider:retire -- <practice-slug> <provider-slug>
npm run verify:site -- <practice-slug> --update-contract
```

For an indexable production site, the command adds permanent redirects from both
forms of the retired provider route to `/#providers`. Override the destination with
`--redirect=/another-route`. The portrait is deliberately retained; remove it only
after confirming it has no remaining references.

Add `--dry-run` to any provider or theme command to validate and preview the action
without changing practice files.

### Add a practice or preview

1. Copy `sites/template/` to `sites/<practice-slug>/`.
2. Set `practice.slug` to the folder name and configure `practice.json`.
3. Add provider, hero, office, and resource assets using relative paths.
4. Keep preview configuration at `seo.allowIndexing: false` with
   `seo.siteUrl: https://frontdoor.health/previews/<practice-slug>`.
5. Validate and build the preview:

```bash
python3 scripts/validate_practice_json.py sites/<practice-slug>/practice.json
SITE_ID=<practice-slug> npm run build:preview
```

Use `npm run build:preview:all` to build every eligible preview. To launch a
standalone production practice, set its HTTPS production `seo.siteUrl`, set
`seo.allowIndexing` to `true`, complete the analytics allowlist work below, and run:

```bash
SITE_ID=<practice-slug> npm run build:practice
```

### Add a marketing case study

Add the route at
`src/entries/marketing/pages/case-studies/<slug>/index.astro`, place its static
assets under `marketing/case-studies/<slug>/`, and add its link to the case-study
index. If it becomes the featured practice, update `marketing/marketing.json`.
`npm run build:marketing` discovers the resulting index route for `sitemap.xml`.

### Add or change a tracked CTA

Use an existing `data-frontdoor-cta` value: `email`, `phone`, `newPatient`,
`existingPatient`, `directions`, or `resource`. Preserve the destination URL and
practice slug supplied by the shared Astro components. Do not invent a new event
type without separately updating and testing both `shared/analytics.js` and the
Worker allowlist in `worker/src/index.ts`.

Before deploying a new production practice domain, add both HTTPS origins and the
practice slug to `ALLOWED_ORIGINS` and `ALLOWED_PRACTICE_SLUGS` in
`worker/wrangler.toml`, keep the fallback sets in `worker/src/index.ts` synchronized,
deploy the Worker, and run the practice build. The production build fails when the
Wrangler allowlists are missing the configured practice.

### Verify SEO and preview indexing protection

After a marketing or production-practice build, inspect `dist/sitemap.xml`,
`dist/robots.txt`, and generated canonical metadata. Preview builds must have no
preview sitemap, every preview page must include `noindex, nofollow`, and `_headers`
must apply `X-Robots-Tag: noindex, nofollow` to every `/previews/<slug>/*` route.
Indexable standalone practice builds also generate a concise `dist/llms.txt` from
verified `practice.json` content. Preview and non-indexable practice builds must not
publish `llms.txt`.
`npm run test:astro:preview` automates these checks. After deployment, verify a
preview homepage and nested provider route with `curl -I` and Google Search Console's
live URL inspection; do not request indexing.

### Inspect local output

Build the desired target, then open its generated HTML directly or use Playwright:

```text
file:///Users/chaitanya/Projects/frontdoor-previews/dist/index.html
file:///Users/chaitanya/Projects/frontdoor-previews/dist/previews/<practice-slug>/index.html
```

Run `npm run test:visual` for the checked-in desktop and iPhone regression suite.
Only run `npm run test:visual:update` after manually reviewing intentional visual
changes.

## Analytics

CTA click tracking uses:

- `shared/analytics.js` for browser-side event capture
- `worker/` for the Cloudflare Worker endpoint
- Cloudflare D1 database `frontdoor_analytics`

Tracked events include practice slug, CTA event type, page path, destination URL, referrer, source attribution, user agent, country, and timestamp. The analytics service is intentionally limited and does not store cookies, user IDs, IP addresses, names, email addresses, form contents, or PHI.

See `worker/README.md` for Worker deployment, migration, and query commands.

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
- Provider profile UI labels have defaults in `src/lib/practice-view.mjs` and can be overridden with `providerProfileLabels` in `practice.json` when needed.
- Practice rendering uses shared Astro components and target-specific routes under `src/`.
- Treat per-practice `assets/styles.css` as a build output, not source. Shared CSS source lives in `shared/styles/frontdoor.css`.
- Avoid production healthcare portal behavior or HIPAA-sensitive workflows in these previews.

See `AGENTS.md` for repository-specific implementation guidelines.
