# Google Maps Rating Integration Plan

## Objective

Provide a current Google Maps rating in the shared practice-office component without
shipping a Google API key to the browser, republishing review text, storing Google
rating content, or coupling the feature to the analytics Worker.

The first location is Dr. Goutham Dronavalli’s Sugar Land listing:

```text
Practice slug: drdronavalli
Place ID: ChIJHVog23DAQIYRG8UCQY0AE5Q
Maps link: https://maps.app.goo.gl/52RpZsPXu8jd1cwK8
```

The integration is location-scoped, so the same contract works for a single
physician, a multi-physician practice, or a multi-location organization.

## Integration principles

1. Keep the existing analytics Worker and D1 database unchanged.
2. Keep the Google API key in the `frontdoor-places` Cloudflare Worker secret named
   `GOOGLE_MAPS_API_KEY`.
3. Request only `rating,attributions` from Place Details (New).
4. Do not request or display review count or review text.
5. Do not store or cache the rating. Every Worker response uses
   `Cache-Control: no-store`; no D1, KV, Cache API, or Cron binding is allowed.
6. Keep the Google Maps listing link as the no-JavaScript and API-failure fallback.
7. Fetch only when the office summary approaches the viewport.
8. Do not add review or aggregate-rating structured data.
9. Keep account ownership, billing, API restriction, and budget alerts under
   FrontDoor Health LLC.
10. Render the exact `Google Maps` text attribution at 12–16px, normal weight,
    permitted neutral color, without translation or wrapping.
11. Persist only sanitized Worker diagnostics in Cloudflare Workers Logs; never log
    API keys, Place IDs, request origins, client addresses, or Google response bodies.

Official implementation references:

- [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Google Maps Platform attribution and caching policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Maps user-generated content policy](https://support.google.com/contributionpolicy/answer/7422880)
- [Google Maps Platform Terms](https://cloud.google.com/maps-platform/terms)
- [Google Cloud budgets and alerts](https://cloud.google.com/billing/docs/how-to/budgets)
- [Cloudflare Workers Rate Limiting bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

## Current contract

Practice configuration stores durable identifiers and the user-facing destination,
not volatile Google content:

```json
{
  "googleReviewSummary": {
    "placeId": "ChIJHVog23DAQIYRG8UCQY0AE5Q",
    "url": "https://maps.app.goo.gl/52RpZsPXu8jd1cwK8"
  }
}
```

Default and failure UI:

```text
Google Maps reviews
```

Enhanced UI:

```text
★ Rated 4.8/5 on Google Maps
```

Assistive technology receives “Rated 4.8 out of 5 on Google Maps.” The Google Maps
text remains a link to the configured listing in both states.

## Target architecture

```text
Practice or preview page
        │
        │ IntersectionObserver (600px root margin)
        ▼
GET places.frontdoor.health/v1/ratings/<practice-slug>
        │
        │ allowed origin + per-client rate limit
        ▼
frontdoor-places Worker
        │
        │ X-Goog-FieldMask: rating,attributions
        ▼
Google Places API (New)
```

Public success response:

```json
{
  "ok": true,
  "practiceSlug": "drdronavalli",
  "rating": 4.8,
  "attributions": []
}
```

The endpoint returns 404 for an unknown route or slug, 403 for a forbidden or missing
origin, 429 for a rate-limited client, 405 for a disallowed method, and 502 for a
missing secret or Google failure. Upstream response bodies and credentials are never
returned.

## Automated verification standard

- Worker tests must mock Google Place Details and cover all response branches.
- Browser tests must mock `places.frontdoor.health`; repository tests never spend
  Google API quota.
- Browser tests must prove zero rating requests before intersection and exactly one
  after the office section intersects.
- Failure tests must leave the link-only fallback usable.
- Output contracts must prove no review count or hardcoded rating is emitted.
- Existing analytics tests must continue to pass without changes to `worker/` or D1.

## Milestone 0: Lock the Phase 1 contract

**Status:** Complete

### Work

- Place the summary below the location/practice name in the Visit the Office card.
- Lock the preferred success copy, Maps destination, accessible “out of 5” wording,
  and responsive placement.
- Preserve the observed 4.8/17 screenshot as evidence only.

### Exit criteria

- The location placement works for both single- and multi-physician practices.
- The review count is excluded from the approved UI.

## Milestone 1: Provision Google and Cloudflare infrastructure

**Status:** Runtime infrastructure complete; billing-alert verification remains manual

### Work

- Create or select a FrontDoor Health LLC Google Cloud project and billing account.
- Enable Places API (New), create an API-restricted server key, and add a $100 monthly
  budget with actual-spend alerts at 50%, 90%, and 100%.
- Store the key with `wrangler secret put GOOGLE_MAPS_API_KEY`.
- Deploy the isolated `frontdoor-places` Worker and attach
  `places.frontdoor.health`.

### Verification

The secret, deployed Worker, custom domain, Places API request, and live rating have
been verified. Follow [`cloudflare/manual-setup.md`](cloudflare/manual-setup.md) to
verify the billing-alert recipients; that Google account control cannot be completed
from source control.

### Exit criteria

- The secret exists only in Cloudflare.
- The custom domain serves the Worker.
- Billing and quota notifications reach a monitored FrontDoor address.

## Milestone 2: Build the rating endpoint

**Status:** Implemented, tested, and deployed

### Work

- Maintain the slug-to-Place-ID and origin allowlists in
  `places-worker/wrangler.toml`.
- Validate rating and optional HTTPS attributions.
- Add CORS, five-second upstream timeout, no-store responses, and generic errors.
- Limit each allowed origin/client combination to 60 requests per minute using a
  non-reversible client hash.
- Enable Cloudflare Workers Logs so upstream status categories are available for
  production troubleshooting without exposing them in the public API.

### Verification

```bash
npm run typecheck:places-worker
npm run test:places-worker
npm run test:google-maps-config
```

### Exit criteria

- Success, malformed/missing ratings, upstream errors, missing secret, unknown slug,
  forbidden origin, preflight, and rate-limit branches pass.
- No Worker binding can persist Google rating data.

## Milestone 3: Add progressive enhancement to the shared site

**Status:** Implemented in source

### Work

- Validate `placeId` and HTTPS Maps URL in `practice.json`.
- Render `Google Maps reviews` before JavaScript or when the API is unavailable.
- Use `IntersectionObserver` with a 600px root margin.
- Replace the fallback with the exact success presentation only after validating the
  response slug and rating.
- Render safe HTTPS third-party attributions when supplied.

### Verification

```bash
npm run verify:site -- drdronavalli
npm run test:google-maps
```

### Exit criteria

- Production and preview outputs use the same component.
- Mobile and desktop layouts have no horizontal overflow.
- No hardcoded rating or review count remains in practice configuration or HTML.

## Milestone 4: Complete contracts and compliance

**Status:** Implemented in source

### Work

- Add mocked Playwright coverage for lazy success and failure fallback.
- Add a public Terms of Use route to practice and preview outputs.
- Document Google Maps processing in privacy content and link Google’s Maps terms and
  privacy policy.
- Add a repository drift check between configured Place IDs and the Worker allowlist.

### Verification

```bash
npm run test:output-contracts
npm run test:analytics
npm run test:visual
```

### Exit criteria

- Static, browser, accessibility, and analytics contracts pass.
- Practice sitemaps include Terms; no preview route is indexable.

## Milestone 5: Stage and launch Dr. Dronavalli

**Status:** Live Worker verified; frontend release pending

### Work

1. Deploy the Worker to its development URL.
2. Make one controlled request with `Origin: https://drdronavalli.com`.
3. Attach and verify `places.frontdoor.health`.
4. Deploy the frontend pilot.
5. Verify the live rating, link, fallback, CORS, accessibility, Worker error rate,
   Places request count, and billing alerts.

### Live pilot status — August 23, 2026

- Deployed Worker version: `80f7e4d6-ade0-44b7-9c5f-4d4d411c7d01`.
- Both the `workers.dev` URL and `places.frontdoor.health` reach the isolated Worker.
- The allowed production origin receives the expected CORS headers and
  `Cache-Control: no-store`.
- The first request returned upstream HTTP `403`; after the Google configuration
  propagated, the same custom-domain request returned the live `4.8` rating.
- The public response contains no review count, review text, key, or upstream detail.
- The frontend implementation is verified locally and awaits its normal Git-based
  Cloudflare Pages release.

### Exit criteria

- The production office section and any configured noindex preview show a current
  live rating when Google is available and retain the Maps link when it is not.
- The analytics Worker, CTA tracking, and D1 events remain unchanged.

## Milestone 6: Scale to another clinic

**Status:** Ready after pilot

### Onboarding workflow

1. Choose the correct Google Maps location entity, not an individual physician
   listing unless that is the intended practice entity.
2. Verify the listing name, address, Maps link, and Place ID manually.
3. Add `placeId` and `url` under `location.googleReviewSummary`.
4. Add the exact slug/Place-ID pair and production origin to
   `places-worker/wrangler.toml`.
5. Update `source_extraction.md` with the source and observation date.
6. Run schema, drift, Worker, output-contract, and mocked browser checks.
7. Deploy the Worker mapping before the site that consumes it.

Review Place IDs annually and whenever Google returns `NOT_FOUND`. A location change
requires reconfirming the entity rather than assuming the old Place ID still applies.

## Rollback

- Roll back or disable the frontend enhancement; the Google Maps link remains.
- Roll back or detach `frontdoor-places` independently of analytics and D1.
- Never replace an API outage with a stale numeric rating.
- Preserve test artifacts and Worker logs needed to diagnose the failure.

## Final definition of done

- Dr. Dronavalli’s production page and any configured noindex preview lazy-load a
  current Google Maps rating from the protected Worker.
- Account secrets, API restrictions, budget alerts, and the custom domain are verified.
- No Google rating data is cached, persisted, or added to JSON-LD.
- Worker, schema, output, browser, visual, HTML, and analytics tests pass.
- A second clinic can onboard without practice-specific frontend code.
