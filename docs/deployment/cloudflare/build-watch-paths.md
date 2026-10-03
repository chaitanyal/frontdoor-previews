# Conservative Pages build triggers

Applied October 3, 2026. Priority: avoid missed builds; accept unnecessary builds.

## Live settings

| Project | Build command | Includes | Excludes | Build cache |
| --- | --- | --- | --- | --- |
| drdronavalli | `SITE_ID=drdronavalli npm run build:practice` | `*` | `docs/*`, `assessments/*` | Enabled |
| frontdoor-health | `npm run build:marketing` | `*` | `docs/*`, `assessments/*` | Enabled |
| frontdoor-previews | `npm run build:preview:all` | `*` | `docs/*`, `assessments/*` | Enabled |

Before this change, all three had includes `*`, no exclusions, and no explicit
`build_caching` value in the API response. Both environments use build image 3.
Git source configuration, branch deployment controls, build commands/output roots,
and deployment environments were preserved. Settings were read back after saving;
no test push, deployment, or post-deployment website check was performed.

The checked-in [policy](build-watch-policy.json) records the intended settings.
Cloudflare settings live outside Git: editing this JSON does not apply them.

## Directory boundary

- `assessments/`: research, reports, retained screenshots, unused originals.
- `docs/`: operational guidance and historical plans.
- `sites/`: publishable practice configuration, images, assets, redirects.
- `marketing/`, `shared/`, `src/`: published content, shared dependencies, rendering.

Builds include **every path except the two audited documentation/evidence trees**.
New directories and unrecognized paths therefore trigger every project. Other
practice edits, tests, Workers, root Markdown, lockfiles, scripts, Functions, and
configuration still trigger all three projects. Do not translate the narrower
local verification selector into Pages watch rules: Tailwind scans practice HTML
across sites, marketing publishes eligible previews and the featured practice,
and production builds validate Worker configurations.

Do not exclude `*.md`: Markdown under source or published assets can be build input.
Files under `sites/<clinic>/images` and `assets` are copied in full. Move approved
publishable evidence into those folders; do not render directly from assessments.

The current builder, its validators, Astro sources/configuration, Tailwind content
paths, and configured practice asset references were reviewed. They do not consume
the excluded trees. Source ledgers/evidence references alone are not published
build inputs. If future code starts consuming anything under `docs/` or
`assessments/`, **remove that directory's exclusion on all dependent projects
before that code is released**. Prefer keeping publishable material under watched
source/assets. No finite path test can guarantee arbitrary future dependencies.

## Repeatable setup and validation

For each future Pages project using this repository:

1. Inspect its build command, root, source repository, and all build inputs.
2. Keep includes `*`. Use these two exclusions only while the directory boundary
   holds; otherwise leave excludes empty. Preserve automatic Git deployments.
3. Enable build caching on supported build systems. This does not skip the build
   command; it caches package/framework resources. Do not configure Pages to reuse
   local verification receipts or skip production rendering.
4. Run `node scripts/validate_cloudflare_watch_paths.mjs`. Register a new project
   and its audited build command in the policy. This is a local maintenance check,
   not an imported production build dependency.
5. Save through Settings → Build → Build watch paths / Build cache (or the Pages
   project API). Read back the source/build configuration and compare unrelated
   settings. Record the project/settings/date here.

The validator checks three projects with 18 trigger cases each, all tracked paths
in source/build/publishing/check directories, configured asset references, and the
last 80 commits using deletions and both rename sides. It validates our model of
Cloudflare's documented matching rules, not a live Git webhook. Only one of the
last 80 commits was entirely excluded in the October 3 audit; savings are modest
by design. A mixed push still builds when any changed file is outside exclusions.
Cloudflare also bypasses matching for empty pushes and large pushes (3,000+ changed
files or 20+ commits), retaining conservative builds.

Final repository checks passed all eight output contract targets, configuration
regressions, and 23 browser assertions across all three themes and reflective.
No output baselines or production website content were changed.

## Rollback / uncertainty

Set includes to `*` and excludes to an empty list on every affected project.
Automatic Git deployment stays enabled. Uncertain dependencies should build.
If cache behavior is suspect, disable/clear the build cache; trigger policy and
cache policy are independent. During this rollout, the local pre-change settings
and rollback fields were saved under `.tmp/cloudflare-pages-settings-before.json`
and `.tmp/cloudflare-watch-rollback.json`; these contain no OAuth/environment
secrets and are not checked in.

References: [Cloudflare build-watch paths](https://developers.cloudflare.com/pages/configuration/build-watch-paths/),
[build caching](https://developers.cloudflare.com/pages/configuration/build-caching/),
[project update API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/edit/).
