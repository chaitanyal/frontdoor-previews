# AGENTS.md

# Frontdoor Health Previews Repository

This repository hosts static HTML preview and production websites for small medical practices,
plus a small analytics Worker for CTA click tracking.

These previews are deployed to:

https://frontdoor.health/previews/<practice-slug>/

Example:

https://frontdoor.health/previews/northhillspsychiatry/

The preview sites are intentionally simple:
- static HTML output
- static assets
- Astro static builds
- reusable Astro components driven by `practice.json`
- minimal browser JavaScript for interactions and analytics

The goal is:
- fast preview generation
- lightweight deployments
- SEO-friendly static hosting
- low operational complexity

---

# Repository Structure

Each practice source lives in its own folder under `sites/`. Shared preview
deployments are built into `dist/previews/<practice-slug>/`.

Example:

```text
frontdoor-previews/
  assessments/               # reports and retained source evidence by practice
  docs/                      # integration, deployment, and historical guidance
  sites/
    northhillspsychiatry/
      practice.json
      images/
        providers/
        hero/
  src/
    components/
    entries/
    layouts/
    lib/
    pages/shared/
  shared/
    styles/frontdoor.css
    themes.json
  analytics-worker/
  places-worker/
   
```

The `sites/<practice-slug>` folder name becomes the preview URL slug.

Example:

```text
sites/northhillspsychiatry/
```

maps to:

```text
https://frontdoor.health/previews/northhillspsychiatry/
```

---

# Codex Maintenance Routing

For Astro architecture and edit locations, read [src/README.md](src/README.md).
Component frontmatter comments describe responsibilities and non-obvious behavior;
keep affected comments current when changing that behavior.

Codex reads this file automatically. For small changes, use the narrowest workflow
that proves the requested result:

- Practice copy, links, hours, credentials, assets, or an existing theme selection:
  edit only `sites/<practice-slug>/` and run
  `npm run verify:site -- <practice-slug>`.
- Add a provider: place the portrait in the practice folder, prepare one provider
  JSON object, run `npm run provider:add -- <practice-slug> <provider-json>`, then
  run the printed contract-update command and review the generated route change.
- Retire a provider: run
  `npm run provider:retire -- <practice-slug> <provider-slug>`. Production sites
  receive redirects for the retired provider route; portraits are retained.
- Switch to an existing palette: run
  `npm run theme:set -- <practice-slug> <theme-name>` and then verify that site.
- Shared components, schemas, scripts, a new theme definition, or changes spanning
  multiple subsystems: run `npm run verify:change` (retains the full output-contract
  matrix for shared changes). For visual/provider/action changes, add the relevant
  browser suites in the same run, for example
  `npm run verify:change -- --browser=themes,providers,analytics`.

For factual healthcare-practice changes, update the affected evidence in
`source_extraction.md` when one exists. Exact user-authored wording, layout, and
theme-selection changes do not require repeating full source extraction.

## File Placement

- Prospect reports: `assessments/<practice-slug>/assessment.md`.
- Retained source screenshots, public-page evidence, original/unused images, and
  historical practice notes: `assessments/<practice-slug>/sources/`. See
  [assessments/README.md](assessments/README.md).
- Published practice content and verified fact ledger: `sites/<practice-slug>/practice.json`
  and `source_extraction.md`. Link the ledger to retained evidence.
- Put only publishable files in practice `images/` and `assets/`; the builder copies
  these folders in full. Retain retired provider portraits as described above.
- Use `sites/template/` as the sole starter. Do not generate sites from archived
  JSON templates in `docs/archive/`.
- Shared fonts and FrontDoor brand files belong in `shared/fonts/` and
  `shared/branding/`; the builder preserves their public URLs.
- Integration/deployment guidance and historical plans belong under `docs/`;
  [docs/README.md](docs/README.md) is the index.
- Analytics backend source lives in `analytics-worker/`; the deployed Worker name
  remains `frontdoor-analytics`. Google Places backend source is in `places-worker/`.


The pre-commit hook applies the same staged-file routing. Install it once per clone
with `npm run hooks:install`. Do not bypass it with `--no-verify`. Run the relevant
verification once after implementation; a valid result for unchanged inputs may
be reused by later commands and the hook. Changed source, assets, tests, tools,
configuration, environment, or output invalidates reuse. Rerun checks affected by
subsequent changes; do not repeat passed checks solely because a commit follows.
The hook refuses staged build/check inputs that differ from the working tree,
including unstaged additions or deletions. Stage the intended versions or restore
the unstaged inputs before committing; it never silently stages files.
Use `npm run verify:change -- --all --fresh` for an explicit clean verification.
Run build/verification workflows sequentially: compatibility links and Astro's
generated state still make concurrent independent workflows unsupported.

## Website Release Workflow

When a website release is authorized, use **commit → push → automatic Cloudflare
deployment**, provided Git integration and automatic deployments are enabled for
the target Pages project's production branch.

- Run the applicable pre-release checks and commit only the requested changes.
  Keep unrelated assessments and local configuration out of the release commit.
- Push the commit to the configured production branch. A local commit alone does
  not update GitHub or trigger Cloudflare's Git integration.
- Use known project settings or deployment documentation to establish whether
  automatic deployment is enabled; do not assume every Pages project uses it.
- Do not also deploy through Wrangler when the push triggers automatic deployment.
  Use direct CLI deployment only when explicitly requested or when automatic
  deployment is known to be unavailable for the target project.
- Report local commit, GitHub push, and deployment status separately. A successful
  push is not proof that Cloudflare's build or deployment succeeded. Respect a
  request to skip post-deployment checks and state when deployment was not checked.

## Theme Maintenance

The supported base themes are `calm-healthcare`, `editorial-healthcare`, and
`structured-clinical`. `reflective` is an optional `designVariant` of
`editorial-healthcare`, not a fourth theme. The current assignments and visual
characteristics are documented in README.md under **Theme System**.

Keep the theme catalog intentionally small. Reuse the existing Inter and
Newsreader font families and prefer an existing theme or variant before adding
another one. Theme work must be implemented through shared components and
theme-scoped rules, including provider and financial pages; do not create
practice-only CSS overrides when the behavior belongs to a reusable theme.

When adding, removing, or renaming a theme or variant, update README.md and this
section in the same change, then run `npm run test:output-contracts`.

---

# Technology Stack

Hosting:
- Cloudflare Pages

DNS:
- Cloudflare DNS

Frontend:
- Static HTML
- Tailwind CSS compiled at build time
- Minimal JavaScript
- Astro components rendered at build time

Assets:
- SVG logos preferred
- Optimized JPG/WebP imagery
- Mobile-first responsive layouts

Analytics:
- Browser CTA and preview page-view tracking in `shared/analytics.js`
- Cloudflare Worker in `analytics-worker/`
- Cloudflare D1 database for non-PHI event records
- No cookies, user IDs, IP addresses, form contents, names, emails, or PHI
- Use `fetch()` with `Content-Type: application/json` for analytics POSTs. Do not use
  `navigator.sendBeacon()` with an `application/json` Blob; it previously caused
  browser CORS failures against the analytics Worker.

---

# Purpose of These Previews

These previews are generated to:
- modernize outdated medical practice websites
- demonstrate UX improvements
- demonstrate mobile responsiveness
- demonstrate SEO-friendly architecture
- generate sales leads
- support proposal conversations

These are NOT intended to be:
- production healthcare portals
- authenticated applications
- HIPAA systems
- scheduling systems

Production integrations may later connect to:
- IntakeQ
- Jane
- scheduling providers
- eligibility verification systems
- patient intake workflows

---

# Design Goals

The template should feel:
- modern
- calm
- trustworthy
- premium
- mobile-first
- healthcare appropriate

Avoid:
- generic wellness clichés
- over-designed animations
- excessive gradients
- visually noisy layouts
- template-heavy appearance

Target perception:
- premium small healthcare practice
- operationally credible
- emotionally trustworthy

---

# SEO Goals

The HTML structure should support:
- semantic headings
- metadata
- structured data
- local SEO
- provider discoverability
- fast page loads
- Core Web Vitals optimization

Current builds include sitemap generation, JSON-LD in the document head, FAQ schema,
and provider pages. Indexable standalone practice builds also generate a concise
`llms.txt` from verified `practice.json` content; previews do not publish it.
Blog/article infrastructure may be added separately when required.

---

# Asset Guidelines

## Images

Use:
- authentic provider photography
- calming regional imagery
- warm natural lighting
- healthcare-appropriate visuals

Avoid:
- cheesy stock photos
- obvious AI-generated faces
- hospital clichés
- overly corporate imagery

## Insurance Logos

Preferred format:
- SVG

Use:
- grayscale or muted logos
- consistent sizing
- centered alignment

Avoid:
- noisy multicolor branding
- inconsistent heights
- rasterized screenshots

---

# HTML Guidelines

## Paths

Always use relative asset paths.

GOOD:

```html
<img src="./images/hero/hero.jpg">
```

BAD:

```html
<img src="/images/hero/hero.jpg">
```

Reason:
- previews are hosted under subpaths
- not at domain root

## Local Preview Verification

This repo is static HTML. For local visual verification, load preview pages directly from the filesystem with `file://` URLs.

Use Playwright screenshots against `file://` URLs for local visual verification.

Prefer:
- `file:///Users/chaitanya/Projects/frontdoor-previews/dist/previews/<site>/index.html` for built preview output
- `file:///Users/chaitanya/Projects/frontdoor-previews/dist/index.html` for a built standalone practice or marketing site

Do not start a local HTTP server unless a specific task requires HTTP behavior.

---

# Accessibility

Templates should follow WCAG 2.1 AA-informed practices where practical.

Key requirements:
- semantic HTML
- alt text
- keyboard accessible interactions
- visible focus states
- sufficient color contrast

---

# Mobile-First Requirement

All layouts must:
- render cleanly on mobile first
- avoid horizontal scrolling
- maintain readable typography
- maintain touch-friendly spacing

Primary target device:
- iPhone-sized viewport

---

# Operational Philosophy

This repository is intended to support:
- reusable healthcare website infrastructure
- productized previews
- scalable generation workflows

NOT:
- fully custom one-off web design projects

Changes should prioritize:
- reusability
- consistency
- maintainability
- scalability

over:
- custom artistic experimentation

---

# Future Direction

Long-term workflow:

Practice URL
    ↓
Content extraction
    ↓
Structured config generation
    ↓
Template rendering
    ↓
Static preview deployment
    ↓
Customer review
    ↓
Production deployment

The long-term goal is:
- healthcare practice modernization infrastructure
- not a generic web design agency.


## Verification selection and baseline review

`verify:change` now selects required browser suites by affected behavior. Shared
CSS checks representative theme targets (all three themes and reflective) and
captures screenshots; provider changes add provider/analytics assertions;
routing/build/dependency changes retain full contracts and all three behavior
suites. Unknown/mixed changes retain full contracts. Practice verification also
checks dependent marketing output for preview-eligible practices and the featured
practice. The hook uses the same selection and reuses individual passing suites.

For intentional contract changes, run `npm run review:output-contracts` (optionally
`-- --targets=<comma-separated-target-names>`), review the saved differences, then
explicitly run `npm run accept:output-contracts` and required verification. Review
and acceptance reuse validated artifacts; acceptance does not count as passing
verification. Do not automatically accept unexpected differences. Ordinary browser
assertions omit extensive screenshots; use `--screenshots` for visual review.
