# Static output contract tests

These tests lock the reviewed Astro static output and browser behavior.

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
