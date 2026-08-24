# FrontDoor Places Worker

This Cloudflare Worker exposes an allowlisted, read-only rating endpoint for
configured practice locations. It keeps the Google Maps Platform key server-side and
does not store or cache ratings, review counts, review text, or client IP addresses.

## Interface

```text
GET https://places.frontdoor.health/v1/ratings/<practice-slug>
```

The browser must send an allowed `Origin`. Successful responses contain the current
numeric rating and any required third-party attributions returned by Google. Every
response uses `Cache-Control: no-store`.

## Local verification

```bash
npm install
npm run typecheck
npm test
```

## Deployment

1. Complete the Google Cloud and Cloudflare controls in
   [`../cloudflare/manual-setup.md`](../cloudflare/manual-setup.md).
2. Set the secret interactively; never commit it:

   ```bash
   npx wrangler secret put GOOGLE_MAPS_API_KEY
   ```

3. Deploy to the development Worker URL, smoke-test with an allowed `Origin`, and
   then attach `places.frontdoor.health`.

Add a clinic by updating both `sites/<slug>/practice.json` and
`PRACTICE_PLACE_IDS` in `wrangler.toml`. The repository drift check must pass before
deployment.
