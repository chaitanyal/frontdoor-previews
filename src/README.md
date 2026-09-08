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
`pages/shared/PracticeHome.astro`, `ProviderPage.astro`, or `PracticeLegal.astro`.
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
| Homepage section order or page-level interactions | `pages/shared/PracticeHome.astro`. |
| Homepage section navigation or visibility rules | `lib/home-sections.mjs`; keep section IDs and navigation consistent. |
| A section's markup or layout | Its file in `components/practice/`; read the frontmatter description and props. |
| Provider presentation and contact fallbacks | `components/practice/ProviderProfile.astro` and `lib/practice-view.mjs`. |
| Metadata or structured data | `lib/seo.mjs`, `lib/practice-view.mjs`, and the shared page/layout passing the data. |
| Reusable theme appearance | `shared/styles/frontdoor.css`, `shared/themes.json`, and `lib/themes.mjs`. |
| Marketing featured practice and metrics | `marketing/marketing.json` and `lib/marketing-data.mjs`. |
| Marketing page content or a new case study | `entries/marketing/pages/`. |
| Output paths, copied assets, sitemap, or deployment validation | `scripts/build_astro.mjs`, `lib/assets.mjs`, `lib/sitemap.mjs`, and `lib/practice-production.mjs`. |

Paths in the table are relative to `src/` unless they start with `sites/`, `shared/`,
`marketing/`, or `scripts/`, which are repository-root directories.

## Inputs and browser behavior

Practice components commonly receive a validated `config` from `practice.json`.
`lib/practice-view.mjs` derives display values; layouts receive the resolved theme.
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
