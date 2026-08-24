# Analytics Worker

Worker:
frontdoor-analytics

Custom Domain:
analytics.frontdoor.health

D1 Database:
frontdoor_analytics

Database ID:
ffcf1889-843c-4ffd-ad9f-4d6392a8c6d2

---

# Google Maps Rating Integration

The repository contains the `frontdoor-places` Worker, but the following account
controls must be completed by an authorized FrontDoor Health administrator. Do not
put the Google API key in Git, `practice.json`, Cloudflare variables, Pages settings,
or browser code.

## Google Cloud

1. Create or select a Google Cloud project owned by FrontDoor Health LLC.
2. Attach the FrontDoor Health billing account.
3. Enable **Places API (New)**.
4. Create a dedicated server-side API key.
5. Restrict the key to **Places API (New)**. Do not configure a website-referrer
   restriction; the key is used by a server-side Cloudflare Worker. Apply a supported
   application restriction only if FrontDoor has stable, verified Worker egress.
6. Create a monthly billing budget of **$100** with actual-spend alerts at:

   - 50% ($50)
   - 90% ($90)
   - 100% ($100)

   A Google Cloud budget sends alerts but does not automatically stop API usage.
7. Route billing and quota notifications to an actively monitored FrontDoor Health
   address.

## Cloudflare

From `places-worker/`, authenticate to the FrontDoor Cloudflare account and store the
key as a Worker secret:

```bash
npx wrangler secret put GOOGLE_MAPS_API_KEY
```

Then:

1. Run `npm run typecheck` and `npm test`.
2. Run `npx wrangler deploy` and test the generated `workers.dev` URL with an allowed
   `Origin` header.
3. In Workers & Pages → `frontdoor-places` → Domains & Routes, attach:

   ```text
   places.frontdoor.health
   ```

4. Confirm that `GET /v1/ratings/drdronavalli` returns `Cache-Control: no-store`,
   the requesting allowed origin, and no API key or upstream error details.
5. Confirm an unknown slug returns 404 and a forbidden origin returns 403.
6. In Workers & Pages → `frontdoor-places` → Observability, confirm Workers Logs are
   enabled. The source configuration samples this low-volume pilot at 100% and logs
   only a practice slug, failure category, and upstream HTTP status for errors.

## Google `403` troubleshooting

The August 23, 2026 pilot request reached Google but received HTTP `403`. In the
Google Cloud project that owns the secret key, verify all of the following:

1. **Places API (New)** is enabled in the same project as the API key.
2. The project has an active billing account attached.
3. The key's **Application restrictions** setting is **None**. A website-referrer
   restriction does not work for this server-side Worker, and Cloudflare does not
   provide a stable default egress IP for an IP restriction.
4. The key's **API restrictions** setting is **Restrict key**, with only
   **Places API (New)** selected.
5. The key stored in `GOOGLE_MAPS_API_KEY` is the key whose restrictions were just
   reviewed; create a new secret version if there is any doubt.
6. Quota is available and the billing project has no suspension or service-use
   restriction.

After saving Google changes, allow a few minutes for propagation and repeat the
single pilot smoke test below. Do not paste the key or Google's full error response
into an issue, chat, or source file.

## Pilot smoke test

Make only one controlled live request before the frontend pilot:

```bash
curl -i \
  -H 'Origin: https://drdronavalli.com' \
  https://places.frontdoor.health/v1/ratings/drdronavalli
```

Expected rating source:

```text
Practice slug: drdronavalli
Google Place ID: ChIJHVog23DAQIYRG8UCQY0AE5Q
```

After launch, monitor Worker errors, request volume, latency, Google Places quota,
and billing alerts. The analytics Worker and D1 database are independent and should
not change during this rollout.
