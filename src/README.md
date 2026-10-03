# Astro source guide

Start here to locate a change. Component-specific responsibilities and dependencies
are documented in each component's frontmatter; input declarations sit beside the
implementation.

## How rendering fits together

`scripts/build_astro.mjs` prepares assets and selects one of three route trees via
`astro.config.mjs`:

| Route tree | Published content |
| --- | --- |
| `entries/practice/pages/` | One practice at the domain root, selected by `SITE_ID`. |
| `entries/preview/pages/` | Selected practices beneath `/previews/<slug>/`. |
| `entries/marketing/pages/` | Marketing pages plus eligible practice previews. |

Practice route entries load data through `lib/practice-data.mjs` and delegate to
`pages/shared/PracticeHome.astro`, `ProviderPage.astro`, `TreatmentPage.astro`, or
`PracticeLegal.astro`.
Preview routes use `lib/preview-paths.mjs` to enumerate paths. Their shared page
implementations also serve standalone practice builds.

Shared pages compose `components/practice/` inside `layouts/PracticeLayout.astro`.
The layout owns the HTML document, metadata, theme setup, and shared runtime scripts;
the shared page owns page composition and page-specific behavior. Marketing routes
compose their own content using `components/marketing/` and `MarketingLayout.astro`.

## Where to make changes

| Change | Start here |
| --- | --- |
| Practice copy, provider facts, contact details, assets, or selected theme | `sites/<slug>/practice.json` and that practice's assets; follow root AGENTS.md evidence rules. |
| Prospect research, source screenshots, or original/unused images | `assessments/<slug>/assessment.md` and `assessments/<slug>/sources/`; keep the site's `source_extraction.md` linked to retained evidence. |
| Homepage section order or page-level interactions | `pages/shared/PracticeHome.astro`. |
| Homepage section navigation or visibility rules | `lib/home-sections.mjs`; keep section IDs and navigation consistent. |
| A section's markup or layout | Its file in `components/practice/`; read the frontmatter description and props. |
| Provider presentation and contact fallbacks | `components/practice/ProviderCard.astro`, `ProviderTeam.astro`, `ProviderDirectory.astro`, `ProviderProfile.astro`, and `lib/practice-view.mjs`. |
| Treatment cards, pages and routes | `components/practice/TreatmentCards.astro`, `pages/shared/TreatmentPage.astro`, and `lib/preview-paths.mjs`; see [treatment-page guidance](../docs/treatment-pages.md). |
| Metadata or structured data | `lib/seo.mjs`, `lib/practice-view.mjs`, and the shared page/layout passing the data. |
| Reusable theme appearance | `shared/styles/frontdoor.css`, `shared/themes.json`, and `lib/themes.mjs`. |
| Marketing featured practice and metrics | `marketing/marketing.json` and `lib/marketing-data.mjs`. |
| Marketing page content or a new case study | `entries/marketing/pages/`. |
| Output paths, copied assets, sitemap, or deployment validation | `scripts/build_astro.mjs`, `lib/assets.mjs`, `lib/sitemap.mjs`, and `lib/practice-production.mjs`. |

Paths in the table are relative to `src/` unless they start with `sites/`, `shared/`,
`marketing/`, `assessments/`, or `scripts/`, which are repository-root directories.

## Inputs and browser behavior

Practice components commonly receive a validated `config` from `practice.json`.
Teams of five or more generate a complete `/providers/` directory; smaller teams
can enable it with `providerDirectory: true`. Optional `home.featuredProviderSlugs`
selects homepage cards; `providerDirectory: false` explicitly disables the directory.
Selections preserve supplied order and require an enabled directory.
Omit that selection to show the entire team. Names and profile URLs still come from
the single `providers` roster. Compact cards use the existing specialty and credentials;
they do not infer provider locations or availability. Directory and profile routes
share native links and retain preview indexing/action restrictions. Retirement removes
the selected slug and retains an enabled directory; production redirects lead there.
Provider profiles show identity before portraits on mobile and render all supplied
biography paragraphs and nonempty education categories.
Optional `footer.frontdoorCredit: true` adds a linked “Website by frontdoor.health”
credit to practice home/treatment and legal footers, including preview builds.
It is omitted by default; provider pages retain their existing action-only footer.
The optional `privacyPolicy` object supplies a heading, summary, document resources
(`title`/`url`), and sections (`heading`/`paragraphs`) for patient-privacy content
on the privacy page. Shared website privacy disclosures remain separate.
Optional `appointmentSection.telehealth` supplies `heading`, `summary`, `label`
and an HTTPS `url` for scheduled-visit access in homepage/provider appointment
sections. It respects preview action disabling and uses existing-patient CTA tracking.
`lib/practice-view.mjs` derives display values; layouts receive the resolved theme.
Optional `treatments` entries generate `/treatment/<slug>/` in standalone builds
and `/previews/<practice>/treatment/<slug>/` in both preview targets. The optional
`treatmentSection` supplies homepage heading/summary. Non-empty lists enable
homepage cards and navigation; omitted/empty lists generate neither. Treatment
pages use the practice phone for contact and ordinary public-resource links;
they never render scheduling, portal, or telehealth destinations. Indexing follows
the practice configuration. Indexable builds discover these routes in the sitemap
and list them in `llms.txt`.
The production `llms.txt` guide summarizes enabled homepage sections, approved
payment and telehealth copy, and explicit practice-level availability. Factual
details precede page-link sections; larger rosters and treatments get separate
link groups. Indexable standalone pages link to the guide with a route-relative
`rel="describedby"` link. Preview and nonindexable builds publish neither the guide
nor its discovery link.
`build:practice` regenerates and validates the guide on every build; no manual
export or separate release step is needed. Validation checks that every guide
destination exists and every indexable page's discovery link resolves to the file.
Many components already declare a `Props` interface. Document unusual semantics
beside the relevant property rather than maintaining a second list of input types.

Astro renders these pages to static HTML. Explicit scripts provide interactions:
email-copy buttons depend on `CopyEmailScript`, Lucide placeholders need icon
initialization, and Google ratings and the preview-request form own browser handlers.
Keep those dependencies with the containing page when moving components.

Practice and preview routes share markup but differ in route depth, indexing, and
configured action availability. Preserve relative asset links and propagate
`isPreview` through homepage/provider composition. Shared CSS scopes appearance by
theme and design variant; prefer those rules over practice-specific overrides.

## Maintaining documentation and verifying changes

Keep frontmatter comments concise: purpose, meaningful inputs, and non-obvious
constraints. Update them when behavior changes. Avoid caller inventories or comments
that repeat markup. Frontmatter comments are source documentation, not public HTML.

Follow the root AGENTS.md verification routing. For shared Astro changes, run
`npm run test:output-contracts`; browser tests and baseline guidance live in
`tests/verification/README.md`. For visual changes, also inspect the built pages at
mobile and desktop sizes using the repository's documented `file://` workflow.
