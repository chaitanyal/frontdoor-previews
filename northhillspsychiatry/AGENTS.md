# AGENTS.md

# GraceMed Previews Repository

This repository hosts static HTML preview websites for small medical practices.

These previews are deployed to:

https://preview.gracemed.us/<practice-slug>

Example:

https://preview.gracemed.us/northhillspsychiatry

This repository is intentionally simple:
- static HTML
- static assets
- no backend
- no database
- no framework build system

The goal is:
- fast preview generation
- lightweight deployments
- SEO-friendly static hosting
- low operational complexity

---

# Repository Structure

Each practice preview lives in its own folder.

Example:

```text
gracemed-previews/
  logos/
  northhillspsychiatry/
    index.html
    images/
      providers/
      hero/
   
```

The folder name becomes the URL slug.

Example:

```text
northhillspsychiatry/
```

maps to:

```text
https://preview.gracemed.us/northhillspsychiatry
```

---

# Technology Stack

Hosting:
- Cloudflare Pages

DNS:
- Cloudflare DNS

Frontend:
- Static HTML
- Tailwind CSS (CDN)
- Minimal JavaScript

Assets:
- SVG logos preferred
- Optimized JPG/WebP imagery
- Mobile-first responsive layouts

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

Future enhancements may include:
- sitemap generation
- JSON-LD schema
- FAQ schema
- provider pages
- blog/article infrastructure

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