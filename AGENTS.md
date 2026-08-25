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
  worker/
   
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
  multiple subsystems: run `npm run test:output-contracts`.

For factual healthcare-practice changes, update the affected evidence in
`source_extraction.md` when one exists. Exact user-authored wording, layout, and
theme-selection changes do not require repeating full source extraction.

The pre-commit hook applies the same staged-file routing. Install it once per clone
with `npm run hooks:install`. Do not bypass it with `--no-verify`. The hook is a
safety net; run the relevant command yourself before reporting completion.

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
- Cloudflare Worker in `worker/`
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
