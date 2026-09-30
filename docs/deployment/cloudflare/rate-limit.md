# Analytics API Rate Limit

Rule Name:
Analytics API

Expression:

(http.host eq "analytics.frontdoor.health")
and
(http.request.uri.path eq "/event")
and
(http.request.method eq "POST")

Count by:
IP

Threshold:
30 requests

Period:
10 seconds

Action:
Block

Duration:
10 seconds

---

# Places Rating API Rate Limit

The `frontdoor-places` Worker uses a dedicated Cloudflare Workers Rate Limiting
binding defined in `places-worker/wrangler.toml`.

Binding:
`RATE_LIMITER`

Threshold:
60 requests

Period:
60 seconds

Count by:
A SHA-256-derived key from the allowed origin and current client address. The Worker
does not log or store the raw client address.

Action:
Return HTTP 429 with a generic JSON error and `Cache-Control: no-store` before any
Google request is made.

This binding is separate from the analytics WAF and Worker limits. Changing it must
not modify the analytics Worker or D1 configuration.
