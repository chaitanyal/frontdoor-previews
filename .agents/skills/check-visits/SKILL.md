---
name: check-visits
description: Check FrontDoor campaign visits to Dr. Dronavalli and preview sites since a specified date. Use for campaign traffic, page views, sessions, and city/state summaries from the existing Cloudflare analytics database.
---

# Check campaign visits

Resolve the requested start date in `America/Chicago`. The start is inclusive local
midnight. State the resolved date for relative requests such as “since Monday.”
If no date can be inferred, ask for it.

Run the bundled Python command. Resolve its path relative to this skill:

```sh
python3 scripts/check_visits.py 2026-10-05 --json
```

From the repository root, run:

```sh
python3 .agents/skills/check-visits/scripts/check_visits.py 2026-10-05
```

The script locates the repository from its own path.
Use `--repo <path>` to query another checkout. Python 3.9+ and the analytics-worker's installed
Wrangler are required. Use the existing Cloudflare login. If sandbox access fails,
retry with the required execution approval. If authentication still fails, report
the error; do not present an empty result as zero visits or expose credentials.

The command performs a read-only remote D1 query through Wrangler. It includes
`drdronavalli` and paths under `/previews/`. It counts page views from the start
through the query time. It excludes missing/blank campaigns and case-insensitive
exact `test` values. It includes `research` campaigns and does not exclude names
merely containing `test`. Do not change the filter silently when the user requests a different
scope; modify the command only if necessary and verify the new behavior.

The Python query also excludes this exact internal user agent before aggregation:

```text
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 FrontDoor-Internal
```

Other user agents, including missing/blank values, remain eligible.

Always format user-facing visit tables with exactly these columns in this order:

| Site | City | Tag | TimeStamp | Page Views |
|---|---|---|---|---:|

Include the exact campaign tag in every row. Display timestamps in
`America/Chicago`, including the date, time, and timezone. For aggregated rows,
show the first-to-last visit time range (a single timestamp when both match);
for event-level drilldowns, show each recorded timestamp and its page-view count.
Put state/province in the City cell when available. Report the overall date range
outside the table. Sessions, browser IDs, and missing-ID counts may be explained
outside the table when useful; do not add columns for them.

Distinguish zero matching rows from query
failure. Keep unknown locations unknown. Counts of sessions/browser IDs are distinct
within each row; do not sum them as globally distinct visitors. Report missing-ID
counts if they affect interpretation. Use `region` or `region_code` for state/province;
older rows with no state remain unknown. Retain country in structured results.
Locations are approximate and do not identify
recipients. Page views alone do not establish interest or human traffic.

The command does not count CTA clicks. Do not claim that clicks are zero from this
report. Read-only analytics requests do not authorize deployments, data deletion,
or contact with prospects.
