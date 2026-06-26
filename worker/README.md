# FrontDoor Analytics Worker

Minimal Cloudflare Worker for recording preview page views and CTA click events in the existing `frontdoor_analytics` D1 database.

This Worker only stores:

- `practice_slug`
- `event_type`
- `page_path`
- `destination_url`
- `referrer`
- `session_source`
- `title`
- `session_id`
- `visitor_id`
- `event_timestamp`
- `user_agent`
- `country`
- `city`
- timestamp

It does not store IP addresses, cookies, names, email addresses, form contents, or PHI. Page-view events may include pseudonymous browser-generated `visitor_id` and `session_id` values.

## Install Dependencies

```bash
npm install
```

## Authenticate Wrangler

```bash
npx wrangler login
```

## Apply D1 Migration

```bash
npx wrangler d1 migrations apply frontdoor_analytics --remote
```

## Deploy Worker

```bash
npx wrangler deploy
```

Deployment will create the Worker automatically and return a URL similar to:

```text
https://frontdoor-analytics.<account>.workers.dev
```

## CURL Test

```bash
curl -X POST \
  https://frontdoor-analytics.<account>.workers.dev/event \
  -H "Content-Type: application/json" \
  -d '{
    "practice_slug":"drdronavalli",
    "event_type":"appointment_click",
    "page_path":"/",
    "destination_url":"https://healow.com/",
    "referrer":"https://www.google.com/"
  }'
```

Expected response:

```json
{
  "ok": true
}
```

## Verify Database Insert

```bash
npx wrangler d1 execute frontdoor_analytics \
  --remote \
  --command "
SELECT *
FROM events
ORDER BY created_at DESC
LIMIT 5;
"
```

A successful CURL test should produce one row.

## Page View CURL Test

```bash
curl -X POST \
  https://frontdoor-analytics.<account>.workers.dev/event \
  -H "Content-Type: application/json" \
  -d '{
    "event":"page_view",
    "path":"/previews/northhillspsychiatry/",
    "practice_slug":"northhillspsychiatry",
    "referrer":"https://www.google.com/",
    "title":"North Hills Psychiatry",
    "session_id":"example-session-id",
    "visitor_id":"example-visitor-id",
    "timestamp":"2026-06-26T21:00:00.000Z"
  }'
```

Expected response:

```json
{
  "ok": true
}
```

To confirm source attribution:

```bash
npx wrangler d1 execute frontdoor_analytics \
  --remote \
  --command "
SELECT
  practice_slug,
  event_type,
  referrer,
  session_source
FROM events
ORDER BY id DESC
LIMIT 5;
"
```
