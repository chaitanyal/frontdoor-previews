# CARMAhealth design-audit evidence

Live inspection and comparison captures: October 2, 2026.

## Retained public HTML

| File | Source |
| --- | --- |
| `providers.html` | https://carmahealth.com/providers |
| `sally-reese.html` | https://carmahealth.com/providers/sally-reese |
| `new-patients.html` | https://carmahealth.com/new-patients |
| `tms-therapy.html` | https://carmahealth.com/services/tms-therapy |
| `insurance.html` | https://carmahealth.com/insurance |

Previously supplied homepage HTML is retained at `../carma_health_homepage.html`. Previously supplied screenshots remain in `../main_page/`, `../provider_directory/`, `../services/`, and `../new_patient_appointment_scheduling/`; they were reviewed without moving or changing the files. The supplied machine-readable map remains in `../llm_txt/`.

## Comparison captures

`*-mobile.png` uses 390 × 844; `*-desktop.png` uses 1440 × 1000. Chromium used reduced-motion preference. Viewport screenshots preserve the visible cookie notice on Carma; no consent choice was made. Screenshots focus on the relevant section or first screen, not the complete page.

- `carma-home-team-*`: https://carmahealth.com/, scrolled to the homepage care-team section.
- `carma-directory-*`: https://carmahealth.com/providers, scrolled to Texas Practitioners.
- `carma-profile-*`: https://carmahealth.com/providers/sally-reese, first screen.
- `frontdoor-team-*`: local `.tmp/astro-dist/marketing/previews/centexmh/index.html`, scrolled to the providers section. Browser scroll alignment can place the section's middle in the mobile viewport.
- `frontdoor-profile-*`: local `.tmp/astro-dist/marketing/previews/centexmh/providers/michael-musgrove/index.html`, first screen.
- `visual-observations.json`: URLs, viewport sizes, FrontDoor provider-card count, and horizontal-overflow observations. The `.home-provider-card` selector is specific to FrontDoor; zero values on Carma pages do not indicate missing providers.

No form submission, booking, portal authentication, performance benchmark, formal accessibility audit, or clinical fact validation was performed. Source code for FrontDoor was inspected directly; Carma findings come from public HTML, rendered pages, and supplied screenshots.

## Additional SEO and machine-readable evidence

Fetched/inspected October 2, 2026:

- `homepage.html`: fresh https://carmahealth.com/ HTML for metadata/schema/link checks.
- `carma-robots.txt`, `carma-sitemap-index.xml`, `carma-sitemap-0.xml`, `carma-llms.txt`: corresponding files on https://carmahealth.com/.
- `mirror-llms.txt`: https://mr.carmahealth.com/llms.txt.
- `mirror-sally-reese.md`, `mirror-provider-headers.txt`: body and response headers from https://mr.carmahealth.com/providers/sally-reese.
- `carma-http-redirect.txt`, `carma-www-redirect.txt`, `carma-trailing-slash.txt`: redirect/header chains for HTTP homepage, HTTPS www homepage, and https://carmahealth.com/services/tms-therapy/.
- `carma-schema-image-headers.txt`: headers for https://carmahealth.com/images/team/carma-sally-reese.jpg, declared in provider schema.
- `seo-observations.json`: metadata, parsed JSON-LD, internal links, URL-set comparison, representative local production pages, and Centex preview pages. JSON parsing does not establish schema validity.
- `frontdoor-preview-seo.json`: metadata/canonical/noindex checks for all 31 pages in the existing local marketing preview output.
- `frontdoor-drdronavalli-llms.txt`, `frontdoor-drdronavalli-sitemap.xml`, `frontdoor-drdronavalli-robots.txt`: snapshots copied from the existing local `dist/` build; no live production fetch.
- `frontdoor-config-llms.json`: candidate summaries generated with the existing `practiceLlms()` function for all five configured practices. Only Dr. Dronavalli is configured as indexable; these candidate summaries do not imply preview files are published.

The 105-URL Carma sitemap/map comparison checks listed URL sets, not HTTP status for every destination. Redirect and schema-image checks are a small explicit sample. No Search Console, ranking, backlink, schema-validator, or performance data was collected. Official Google documentation and the llms.txt proposal are linked beside the relevant recommendations in the report.
