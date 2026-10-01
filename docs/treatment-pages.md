# Reusable treatment pages

## Plan and scope

1. Define optional `treatments` data and validate complete content plus unique,
   safe slugs. Keep clinic-specific copy in `practice.json`.
2. Render one shared page at `/treatment/<slug>/` across standalone, preview and
   marketing-preview builds. Link from homepage cards and the Treatments navigation
   item. Reuse the practice theme, contact information and indexing policy.
3. Apply the template to Centex's TMS and Spravato offerings using its retained
   sources and official treatment information. Document omitted details and
   follow-up questions internally.
4. At the end, review intentional output-contract changes, run the required
   repository checks, and inspect the homepage and treatment pages at mobile and
   desktop widths. Additional checks follow only if a failure or visual issue
   requires a correction.

The implementation supports evergreen treatment information. A condition-focused
page such as `sleep-apnea` can use the same structure when sources establish the
clinic's actual evaluation or treatment role. No per-practice renderer is needed.

## Configuration

`treatments` is optional and defaults to an empty list. Each entry requires:

| Field | Purpose |
| --- | --- |
| `slug` | Unique lowercase words/numbers separated by hyphens; becomes the route. |
| `name` | Short card, breadcrumb and related-page label. |
| `title` | Page H1. |
| `summary` | Concise introduction used on the homepage card and page hero. |
| `seo.title`, `seo.description` | Distinct metadata for the treatment page. |
| `sections` | At least one `{heading, paragraphs?, bullets?}` object containing text. |
| `cta.heading`, `cta.summary`, `cta.label` | Contact section copy and button label. The destination is the practice phone. |
| `resources` (optional) | Public `{title, url}` links; HTTPS or practice-relative assets. |

`treatmentSection: {heading, summary}` optionally customizes homepage section copy.
Without it, the generic section heading is used and no summary is invented.
Content is plain text, escaped by Astro; HTML is not accepted as rich content.

Use a sourced title and meaningful sections rather than generating a page for
every condition label. Do not infer service availability, clinician assignments,
protocols, pricing, coverage or outcomes from manufacturer materials.

## Build behavior

- Standalone routes: `/treatment/tms/` and `/treatment/spravato/` for Centex.
- Preview routes: `/previews/centexmh/treatment/tms/` and
  `/previews/centexmh/treatment/spravato/`.
- Clinics without entries receive no routes, cards or Treatments navigation.
- Treatment pages include WebPage and BreadcrumbList structured data, distinct
  metadata, and the normal phone CTA analytics. They do not claim article authorship
  or publication dates.
- The page uses no scheduling, patient-portal or waiting-room actions, so preview
  action restrictions remain intact. The phone CTA and public sources remain usable.
- Relative stylesheet, navigation and document links work under preview prefixes.
- Indexable standalone builds automatically include the generated routes in the
  sitemap and `llms.txt`; previews remain noindex and do not publish those files.
- Other practice content and themes remain governed by their own configuration.

## Centex content and migration

The source ledger links the supplied HTML and official clinical references.
Unknown treatment protocols and insurance details remain in the internal
fact-check checklist. No provider-specific TMS/Spravato claims are introduced.

When the clinic migrates to production, prepare redirects for `/tms/`,
`/tms/index.htm`, `/spravato/` and `/spravato/index.htm` to the matching new routes.
Do not publish root-relative legacy redirects in the shared preview deployment.
This implementation does not deploy a site or activate legacy redirects.

## Maintenance

For later copy-only changes, edit the practice entries and run
`npm run verify:site -- <slug>` once after the batch. Shared route, schema or
renderer changes require `npm run test:output-contracts` after implementation.
Review expected contract changes before updating baselines.
