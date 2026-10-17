import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../src/index.ts";

async function record({ origin = "https://drdronavalli.com", cf, allowedPracticeSlugs, ...payload } = {}) {
  const writes = [];
  const request = new Request("https://analytics.frontdoor.health/event", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ practice_slug: "drdronavalli", event: "page_view", path: "/", ...payload }),
  });
  if (cf) Object.defineProperty(request, "cf", { value: cf });
  const response = await worker.fetch(request, {
    ALLOWED_PRACTICE_SLUGS: allowedPracticeSlugs,
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    DB: {
      prepare: () => ({
        bind: (...values) => ({ run: async () => { writes.push(values); } }),
      }),
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  return { body: await response.json(), writes };
}

test("production page views without usable campaigns never write to D1", async () => {
  for (const origin of ["https://drdronavalli.com", "https://www.drdronavalli.com"]) {
    for (const utm_campaign of [undefined, null, "", " \t\n", 123, {}]) {
      for (const eventFields of [{ event: "page_view" }, { event: undefined, event_type: "page_view" }]) {
        const { body, writes } = await record({ origin, utm_campaign, ...eventFields });
        assert.deepEqual(body, { ok: true, skipped: true });
        assert.equal(writes.length, 0);
      }
    }
  }
});

test("oversized streams stop at the byte limit without a database write", async () => {
  let chunksRead = 0;
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      if (chunksRead === 16) return controller.close();
      chunksRead++;
      controller.enqueue(new TextEncoder().encode("é".repeat(1_024)));
    },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const request = new Request("https://analytics.frontdoor.health/event", {
    method: "POST", duplex: "half", body,
    headers: { Origin: "https://frontdoor.health", "Content-Type": "application/json" },
  });
  assert.equal(request.headers.get("Content-Length"), null);
  const response = await worker.fetch(request, {
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    DB: { prepare: () => assert.fail("Oversized requests must not write to D1") },
  });
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "Request too large" });
  assert.equal(cancelled, true);
  assert.equal(chunksRead, 5);
});

test("every published preview can record visits with both configured and fallback allowlists", async () => {
  const wrangler = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");
  const configured = wrangler.match(/^ALLOWED_PRACTICE_SLUGS = "([^"]+)"/m)?.[1];
  assert.ok(configured);
  const sites = new URL("../../sites/", import.meta.url);
  for (const entry of readdirSync(sites, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "template") continue;
    const config = JSON.parse(readFileSync(new URL(`${entry.name}/practice.json`, sites), "utf8"));
    if (config.seo?.allowIndexing !== false) continue;
    for (const allowedPracticeSlugs of [undefined, configured]) {
      const { writes } = await record({
        origin: "https://frontdoor.health", allowedPracticeSlugs,
        practice_slug: entry.name, path: `/previews/${entry.name}/`,
      });
      assert.equal(writes.length, 1);
    }
  }
});

test("production page views with campaigns are recorded", async () => {
  for (const origin of ["https://drdronavalli.com", "https://www.drdronavalli.com"]) {
    const { body, writes } = await record({ origin, utm_campaign: " Doctor-Email " });
    assert.deepEqual(body, { ok: true });
    assert.equal(writes.length, 1);
    assert.equal(writes[0][10], "Doctor-Email");
  }
});

test("campaign requirement covers every production practice and page", async () => {
  for (const practice_slug of ["drdronavalli", "northwestpsychiatry", "centexmh", "frontdoor-health"]) {
    for (const page_path of ["/", "/privacy/", "/providers/doctor/", null]) {
      const payload = { origin: "https://frontdoor.health", practice_slug, path: undefined, page_path };
      const skipped = await record(payload);
      assert.deepEqual(skipped.body, { ok: true, skipped: true });
      assert.equal(skipped.writes.length, 0);
      const recorded = await record({ ...payload, utm_campaign: "email" });
      assert.equal(recorded.writes.length, 1);
    }
  }
});

test("preview views and production CTA clicks still work without campaigns", async () => {
  for (const practice_slug of ["drdronavalli", "northwestpsychiatry", "centexmh"]) {
    const { writes } = await record({
      origin: "https://frontdoor.health", practice_slug, path: `/previews/${practice_slug}/`,
    });
    assert.equal(writes.length, 1);
  }
  const { writes } = await record({ event_type: "phone_click" });
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1], "phone_click");
});


test("state metadata comes from Cloudflare, with nulls when unavailable", async () => {
  const located = await record({ utm_campaign: "research", region: "Spoofed", region_code: "XX",
    cf: { country: "US", city: "Austin", region: "Texas", regionCode: "TX" } });
  assert.deepEqual(located.writes[0].slice(15), ["US", "Austin", "Texas", "TX"]);
  const unknown = await record({ utm_campaign: "research", region: "Spoofed" });
  assert.deepEqual(unknown.writes[0].slice(15), [null, null, null, null]);
});
