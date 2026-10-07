import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.ts";

async function record({ origin = "https://drdronavalli.com", ...payload } = {}) {
  const writes = [];
  const response = await worker.fetch(new Request("https://analytics.frontdoor.health/event", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ practice_slug: "drdronavalli", event: "page_view", path: "/", ...payload }),
  }), {
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
