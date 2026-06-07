# Cloudflare Infrastructure

This directory documents the Cloudflare configuration that supports FrontDoor Health.

Where possible, infrastructure is stored as code (Worker source, D1 migrations, wrangler.toml).

Some Cloudflare resources still require manual configuration through the Cloudflare dashboard. Those settings are documented here so the environment can be recreated if necessary.

## Directory Contents

### dns.md

Documents all externally visible hostnames and the Cloudflare resources backing them.

Examples:

- frontdoor.health
- analytics.frontdoor.health
- drdronavalli.com
- frontdoor-previews.pages.dev

---

### rate-limit.md

Documents the Cloudflare WAF Rate Limiting rules.

Currently includes:

- Analytics API protection
- Matching expression
- Thresholds
- Actions

---

### manual-setup.md

Documents Cloudflare resources that currently require manual setup.

Examples:

- D1 database information
- Worker custom domains
- Cloudflare dashboard configuration
- Google Search Console mappings
- Google Business Profile mappings

---

## Infrastructure Philosophy

- Prefer Infrastructure as Code when practical.
- Store Worker source and D1 migrations in Git.
- Document manual Cloudflare configuration until it can be automated.
- New production deployments should require minimal manual changes.

## Related Directories

- `worker/` — Cloudflare Worker source code and D1 migrations.
- `sites/` — Static practice websites.
- `shared/` — Shared frontend components and utilities.