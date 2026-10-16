# Static output contract tests

These tests lock the reviewed Astro static output and browser behavior.

## Build-once workflow

For a change spanning shared code, run the existing coverage through one runner:

```bash
npm run verify:change
npm run verify:change -- --browser=themes,providers,analytics
```

The selector follows affected behavior. Site-only changes use site checks; marketing
content uses marketing contracts. Provider-only and analytics-only changes use
three representative targets: marketing, standalone Dr. Dronavalli, and preview ALL.
Marketing form/endpoint changes use marketing contracts plus analytics assertions.
Routing/build/dependency changes and unknown website impact retain full contracts.
The runner uses changed and untracked files; `--staged` selects the Git index, and
`--dry-run` prints required checks. Places Worker checks remain unchanged.

Verification tooling selects syntax checks and workflow regressions without website
builds. Changed unit tests run directly; changed browser spec files run directly
against existing valid builds. Deleted test files run remaining tests of that type.
Contract-only baseline changes select their named targets; screenshot baselines
select visual comparisons. Unknown shared test helpers/fixtures retain full
contracts and theme/provider/analytics coverage.

Build artifacts are isolated at `.tmp/astro-dist/<target>-<site>/` (marketing stays
at `.tmp/astro-dist/marketing/`). Compatibility links at `practice/` and `preview/`
preserve existing file-based tests and review paths. The links select the last
requested practice or preview variant; use the isolated directories for stable
review URLs. Public directories and Astro caches are also isolated for managed
builds. Deployment commands still generate `dist/` as before.

Local records in `.tmp/verification-state/` fingerprint Git-visible source, assets,
tests, lockfiles, configuration, installed tool versions, selected environment
settings, local dotenv files, and artifact contents. Build fingerprints exclude
tests, baselines, known verification scripts, hooks, Playwright configuration, and
the installed Playwright version. These remain check inputs. Build scripts, HTML
validation, source, assets, configuration, and lockfiles still invalidate builds. Records include an integrity
checksum; missing/corrupt records or altered output are rejected. Research and
non-build Markdown are excluded; Markdown in source and publishable asset folders
remains an input. If another Markdown location becomes a build input, update
`relevantInput` before relying on reuse. Symlinks in Git-visible verification inputs are
rejected so changes outside the snapshot cannot be hidden.

The hook may reuse a successful result only when staged build/check inputs match
the working tree. Partial staging or untracked relevant inputs require staging the
intended versions or restoring the unstaged inputs; the hook does not add files.
Documentation-only commits continue to skip builds. Tests exercise these cases
with temporary Git repositories; run them directly with:

```bash
node --test tests/verification/verification-state.test.mjs
```

To bypass reuse while retaining all checks:

```bash
npm run verify:change -- --all --fresh
npm run test:output-contracts -- --fresh
npm run verify:site -- centexmh --fresh
```

Run independent verification/build commands sequentially. Existing tests that
mutate fixtures or build legacy paths remain serial; concurrent workflows are not
enabled by output isolation. `[timing]` messages report build stages, contract
comparison, regression tests, browser checks, and total verification duration.

## Contracts

`tests/verification/contracts/` contains semantic manifests for:

- FrontDoor Health marketing plus eligible previews.
- Every configured production-practice build.
- The first preview pilot, `northhillspsychiatry`.
- The all-previews build.

Refresh these files only after reviewing an intentional Astro output change:

```bash
npm run capture:output-contracts
```

Verify them without updating:

```bash
npm run test:output-contracts
```

## Browser checks

Run provider selection, directory/profile navigation, mobile identity, and scale checks:

```bash
npm run test:providers
```

This builds all preview practices and Dr. Dronavalli. It checks discovery without
JavaScript, approved biography coverage, and 25-card layouts across the three themes.
File-based review screenshots are saved in `.tmp/provider-experience/`.
Provider configuration, schema, and retirement checks run with the output-contract suite.

Run the three-theme finishing checks (including the reflective editorial variant):

```bash
npm run test:themes
```

Checks cover mobile/tablet/desktop home, provider, and legal pages, footer link
resolution and touch targets, keyboard FAQ operation, and horizontal overflow.
File-based screenshots are saved in `.tmp/theme-polish/`.

### Implementation and visual review

Complete implementation, then run the applicable verification. For visual changes:

```bash
npm run verify:change -- --screenshots
```

The runner retains normal change-based selection. Capture requires a selected
theme or provider suite; add `--browser=themes` or `--browser=providers` if the
change does not select one. Capture never adds unrelated suites or pixel
comparisons; request `--browser=visual` separately. Theme screenshot capture includes
marketing home, case study, secondary pages, and form error/loading states, plus representative practice and
preview home/provider/legal pages. Standard review widths are 390px and 1440px;
existing additional responsive checks and section captures remain.

Marketing review captures load built `file://` pages with the deterministic local
marketing stylesheet. External services remain mocked. Full-page captures clear
focus and return to the top after loading fonts/images; section captures retain the
specified section. This prevents earlier navigation assertions from moving sticky
headers into arbitrary screenshot positions.

Open `.tmp/visual-review/manifest.json` to find each capture's page URL, viewport,
optional section selector, suite, and file path. Captures from the same input
fingerprint accumulate; changed inputs start a new manifest. Missing screenshot
files prevent reuse of a screenshot-producing suite's passing receipt.

Open and visually inspect affected images. Check overflow/clipping, text wrapping,
spacing/alignment, image crops, sticky navigation/mobile actions, and changed form
states. Capture alone does not establish approval. Report checks, inspected images,
and unresolved issues separately.

Review current output and differences before `npm run test:visual:update`. Run
applicable verification after changing saved baselines; baseline changes invalidate
prior receipts. Keep the same browser/environment for repeatable pixel comparisons.

Focused treatment configuration and route checks (no build or browser required):

```bash
node --test tests/verification/treatments.test.mjs
```

Install the pinned Playwright browser after `npm ci`:

```bash
npx playwright install chromium
```

Run analytics and interaction contracts:

```bash
npm run test:analytics
```

Run the lazy Google Maps rating contract with a mocked endpoint:

```bash
npm run test:google-maps
```

Run visual comparisons:

```bash
npm run test:visual
```

Update screenshots only after visually reviewing the new Astro output:

```bash
npm run test:visual:update
```

Playwright serves the captured static output behind mocked production-like origins.
Analytics, Google Maps ratings, preview-request, Google Ads, Turnstile, and third-party script requests are
intercepted. The suite must not write to production D1, send preview-request emails,
record real Google Ads conversions, or make real Places API requests.

Marketing pages use a test-only stylesheet compiled from their Astro HTML so visual
checks do not depend on the Tailwind CDN. Practice pages use their normal compiled
stylesheet. Lucide and Turnstile receive deterministic local stubs.


### Behavior selection and reviewed baselines

`npm run verify:change -- --dry-run` prints automatic coverage. Shared CSS selects
marketing, standalone Dr. Dronavalli and preview ALL plus all theme representatives
(including reflective), with screenshot capture. Provider-only changes add provider and analytics assertions against representative
contracts. Analytics-only changes use representative contracts; marketing
form/endpoint-only changes use marketing contracts. Practice/marketing headers and footers, and the shared
home-section navigation registry, automatically add theme checks. Those checks
verify local header/footer destinations, focusability, responsive layout, and
marketing contact activation. Marketing-only navigation edits retain marketing
contracts; practice/mixed navigation edits retain full contracts. Routing/build/dependency changes select full contracts and
all three behavior suites. Unknown/mixed changes retain full contracts. Practice
checks include marketing for featured and preview-eligible practices, including
previous eligibility when a preview is removed. Deleted practices select the full
matrix. Production-library changes keep the full matrix and focused generator
regressions because that module also owns headers/robots/redirects.

Ordinary behavior checks skip screenshots. Request them explicitly:

```bash
npm run verify:change -- --browser=themes,providers --screenshots
npm run test:providers -- --screenshots
npm run test:themes -- --screenshots
```

The combined runner retains per-suite passing receipts after a failure; rerun the
same required command to check failures without repeating valid passed suites.
A valid screenshot-enabled suite also satisfies assertion-only hook checks.
Screenshot reuse additionally requires retained capture artifacts for themes/providers.

To review intentional contract changes without rebuilding twice:

```bash
npm run review:output-contracts -- --targets=practice-centexmh,marketing
# Compare .tmp/verification-contracts/review/<target>.json to the checked-in baseline.
npm run accept:output-contracts
npm run verify:change
```

Review reports every selected difference and never records a pass. Acceptance is
an explicit approval of the reviewed manifest and validates source, artifacts and
snapshot contents before writing any baseline. It does not build or record a pass;
final verification still runs. Check fingerprints include tests, tooling, and baselines; build
fingerprints exclude known verification-only inputs. Changed baseline content invalidates checks while
unchanged build artifacts are reusable. Legacy capture/update commands remain
explicit baseline writes. Workflows must still run sequentially.
