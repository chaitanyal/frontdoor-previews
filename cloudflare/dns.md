# DNS Configuration

This document records the DNS and hostname architecture for FrontDoor Health.

The goal is to provide a single source of truth for all externally visible hostnames and their backing Cloudflare resources.

If the Cloudflare account needed to be recreated from scratch, this document should contain enough information to rebuild the DNS architecture.

---

# DNS Provider

| Property | Value |
|----------|-------|
| Provider | Cloudflare |
| Account | Personal Cloudflare Account |
| Environment | Production |

---

# Marketing Website

## frontdoor.health

| Hostname | Service | Purpose |
|-----------|----------|----------|
| frontdoor.health | Cloudflare Pages | Marketing website |

### Cloudflare Resource

```text
Pages Project:
frontdoor-health
```

### Production URL

```text
https://frontdoor.health
```

### Google Search Console

Property:

```text
frontdoor.health
```

Indexed pages currently include:

- /
- /case-studies/drdronavalli/

---

# Analytics API

## analytics.frontdoor.health

| Hostname | Service | Purpose |
|-----------|----------|----------|
| analytics.frontdoor.health | Cloudflare Worker | CTA analytics ingestion API |

### Cloudflare Resource

```text
Worker:
frontdoor-analytics
```

### Public Endpoint

```text
POST https://analytics.frontdoor.health/event
```

### Dashboard Configuration

Workers & Pages

→ frontdoor-analytics

→ Domains & Routes

→ Custom Domain

```text
analytics.frontdoor.health
```

### Notes

- This endpoint receives analytics events from all practice websites.
- Protected by Cloudflare Rate Limiting.
- Stores data in Cloudflare D1.

---

# Practice Websites

## drdronavalli.com

| Hostname | Service | Purpose |
|-----------|----------|----------|
| drdronavalli.com | Cloudflare Pages | Production practice website |
| www.drdronavalli.com | Redirect | Canonical redirect to apex domain |

### Cloudflare Resource

```text
Pages Project:
drdronavalli
```

### Production URL

```text
https://drdronavalli.com
```

### Google Search Console

Property:

```text
drdronavalli.com
```

### Google Business Profile

Website:

```text
https://drdronavalli.com
```

### Sitemap

```text
https://drdronavalli.com/sitemap.xml
```

### Robots

```text
https://drdronavalli.com/robots.txt
```

---

# Preview Infrastructure

## frontdoor-previews.pages.dev

| Hostname | Service | Purpose |
|-----------|----------|----------|
| frontdoor-previews.pages.dev | Cloudflare Pages | Preview environment |

### Cloudflare Resource

```text
Pages Project:
frontdoor-previews
```

### Example URLs

```text
https://frontdoor-previews.pages.dev/drdronavalli/

https://frontdoor-previews.pages.dev/northhillspsychiatry/
```

These preview URLs should never be indexed by search engines.

---

# Analytics Event Flow

```text
Practice Website
        │
        │ POST /event
        ▼
analytics.frontdoor.health
        │
        ▼
Cloudflare Rate Limiting
        │
        ▼
Cloudflare Worker
(frontdoor-analytics)
        │
        ▼
Cloudflare D1
(frontdoor_analytics)
```

---

# Current Hostname Inventory

| Hostname | Backing Resource |
|------------|----------------|
| frontdoor.health | Cloudflare Pages |
| analytics.frontdoor.health | Cloudflare Worker |
| drdronavalli.com | Cloudflare Pages |
| www.drdronavalli.com | Redirect to drdronavalli.com |
| frontdoor-previews.pages.dev | Cloudflare Pages |

---

# DNS Design Principles

- Use apex domains for production practice websites.
- Redirect `www` to the apex domain.
- Keep analytics centralized under:

```text
https://analytics.frontdoor.health
```

- Preview environments should remain under `.pages.dev`.
- New production practice domains should be documented here when launched.

---

# Disaster Recovery Checklist

If rebuilding Cloudflare from scratch:

## Marketing

- Create Pages project:
  - frontdoor-health

- Attach custom domain:
  - frontdoor.health

---

## Analytics

- Deploy Worker:
  - frontdoor-analytics

- Create D1 database:
  - frontdoor_analytics

- Attach custom domain:
  - analytics.frontdoor.health

- Recreate Rate Limiting rule.

---

## Practice Sites

- Create Pages project:
  - drdronavalli

- Attach custom domain:
  - drdronavalli.com

- Configure:
  - www.drdronavalli.com → drdronavalli.com redirect

- Verify:
  - sitemap.xml
  - robots.txt

---

# Last Updated

2026-06-06