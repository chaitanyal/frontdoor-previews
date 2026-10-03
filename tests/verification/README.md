# Static output contract tests

These tests lock the reviewed Astro static output and browser behavior.

## Build-once workflow

For a change spanning shared code, run the existing coverage through one runner:

```bash
npm run verify:change
npm run verify:change -- --browser=themes,providers,analytics
```

The default selector preserves staged-file routing: site-only changes use site
checks, marketing-only changes use marketing contracts, and shared/mixed changes
use the full eight-target matrix (expands with the practice roster). Browser suites
are explicit in this phase; further behavioral selection is deferred. The runner
uses changed and untracked files; `--staged` selects the Git index, and `--dry-run`
prints the required checks. Worker changes retain their existing checks.

Build artifacts are isolated at `.tmp/astro-dist/<target>-<site>/` (marketing stays
at `.tmp/astro-dist/marketing/`). Compatibility links at `practice/` and `preview/`
preserve existing file-based tests and review paths. The links select the last
requested practice or preview variant; use the isolated directories for stable
review URLs. Public directories and Astro caches are also isolated for managed
builds. Deployment commands still generate `dist/` as before.

Local records in `.tmp/verification-state/` fingerprint Git-visible source, assets,
tests, lockfiles, configuration, installed tool versions, selected environment
settings, local dotenv files, and artifact contents. Records include an integrity
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
