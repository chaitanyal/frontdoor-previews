# Static output contract tests

These tests lock the reviewed Astro static output and browser behavior.

## Contracts

`tests/migration/contracts/` contains semantic manifests for:

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

Install the pinned Playwright browser after `npm ci`:

```bash
npx playwright install chromium
```

Run analytics and interaction contracts:

```bash
npm run test:analytics
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
Analytics, preview-request, Google Ads, Turnstile, and third-party script requests are
intercepted. The suite must not write to production D1, send preview-request emails,
or record real Google Ads conversions.

Marketing pages use a test-only stylesheet compiled from their Astro HTML so visual
checks do not depend on the Tailwind CDN. Practice pages use their normal compiled
stylesheet. Lucide and Turnstile receive deterministic local stubs.
