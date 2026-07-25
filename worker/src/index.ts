export interface Env {
  DB: D1Database;
  RATE_LIMITER: RateLimit;
  ALLOWED_ORIGINS?: string;
  ALLOWED_PRACTICE_SLUGS?: string;
}

const MAX_BODY_BYTES = 8_192;
const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://frontdoor.health",
  "https://www.frontdoor.health",
  "https://drdronavalli.com",
  "https://www.drdronavalli.com",
]);
const DEFAULT_ALLOWED_PRACTICE_SLUGS = new Set([
  "frontdoor-health",
  "drdronavalli",
  "mariposa",
  "northhillspsychiatry",
]);
const allowedEventTypes = new Set([
  "page_view",
  "new_patient_click",
  "phone_click",
  "directions_click",
  "existing_patient_click",
  "email_click",
  "resource_download",
  "preview_requested",
]);

type EventPayload = {
  event?: unknown;
  practice_slug?: unknown;
  event_type?: unknown;
  path?: unknown;
  page_path?: unknown;
  destination_url?: unknown;
  referrer?: unknown;
  title?: unknown;
  session_id?: unknown;
  visitor_id?: unknown;
  timestamp?: unknown;
  utm_campaign?: unknown;
  practice_name?: unknown;
  specialty?: unknown;
  has_website?: unknown;
};

type PayloadResult =
  | { payload: EventPayload; error: null }
  | { payload: null; error: "invalid" | "too_large" };

function configuredSet(value: string | undefined, fallback: Set<string>): Set<string> {
  if (!value) return fallback;
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length ? new Set(items) : fallback;
}

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const origins = configuredSet(env.ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS);
  return origins.has(origin) ? origin : null;
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
  origin: string | null = null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

function optionalString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function deriveSessionSource(referrer: string): string {
  if (!referrer) {
    return "direct";
  }

  const lower = referrer.toLowerCase();

  if (lower.includes("maps.google")) {
    return "google_maps";
  }

  if (lower.includes("google.")) {
    return "google";
  }

  if (lower.includes("bing.")) {
    return "bing";
  }

  return "referral";
}

async function readPayload(request: Request): Promise<PayloadResult> {
  const contentLengthHeader = request.headers.get("Content-Length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return { payload: null, error: "invalid" };
    }
    if (contentLength > MAX_BODY_BYTES) {
      return { payload: null, error: "too_large" };
    }
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return { payload: null, error: "too_large" };
  }

  try {
    const payload = JSON.parse(text);
    return payload && typeof payload === "object"
      ? { payload: payload as EventPayload, error: null }
      : { payload: null, error: "invalid" };
  } catch {
    return { payload: null, error: "invalid" };
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/event") {
      return jsonResponse({ error: "Not found" }, 404);
    }

    const origin = allowedOrigin(request, env);
    if (!origin) {
      return jsonResponse({ error: "Forbidden origin" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, origin);
    }

    const contentType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
    if (contentType !== "application/json") {
      return jsonResponse({ error: "Content-Type must be application/json" }, 415, origin);
    }

    const { success } = await env.RATE_LIMITER.limit({ key: origin });
    if (!success) {
      return jsonResponse({ error: "Rate limit exceeded" }, 429, origin);
    }

    const payloadResult = await readPayload(request);
    if (payloadResult.error === "too_large") {
      return jsonResponse({ error: "Request too large" }, 413, origin);
    }
    if (payloadResult.error === "invalid") {
      return jsonResponse({ error: "Invalid event" }, 400, origin);
    }

    const payload = payloadResult.payload;
    if (!payload) {
      return jsonResponse({ error: "Invalid event" }, 400, origin);
    }
    const eventType =
      optionalString(payload.event_type, 64) ?? optionalString(payload.event, 64);
    const practiceSlug =
      optionalString(payload.practice_slug, 64) ??
      (eventType === "preview_requested" ? "frontdoor-health" : null);
    const practiceSlugs = configuredSet(
      env.ALLOWED_PRACTICE_SLUGS,
      DEFAULT_ALLOWED_PRACTICE_SLUGS,
    );

    if (
      !practiceSlug ||
      !/^[a-z0-9-]+$/.test(practiceSlug) ||
      !practiceSlugs.has(practiceSlug) ||
      !eventType ||
      !allowedEventTypes.has(eventType)
    ) {
      return jsonResponse({ error: "Invalid event" }, 400, origin);
    }

    const pagePath =
      optionalString(payload.page_path, 500) ?? optionalString(payload.path, 500);
    const destinationUrl = optionalString(payload.destination_url, 1_000);
    const referrer = optionalString(payload.referrer, 1_000);
    const title = optionalString(payload.title, 300);
    const sessionId = optionalString(payload.session_id, 100);
    const visitorId = optionalString(payload.visitor_id, 100);
    const eventTimestamp = optionalString(payload.timestamp, 64);
    const utmCampaign = optionalString(payload.utm_campaign, 500);
    const practiceName = optionalString(payload.practice_name, 150);
    const specialty = optionalString(payload.specialty, 100);
    const hasWebsite =
      typeof payload.has_website === "boolean"
        ? Number(payload.has_website)
        : null;
    const userAgent = optionalString(request.headers.get("User-Agent"), 500);
    const country = optionalString(request.cf?.country, 2);
    const city = optionalString(request.cf?.city, 100);

    try {
      await env.DB.prepare(`
INSERT INTO events (
  practice_slug,
  event_type,
  page_path,
  destination_url,
  referrer,
  session_source,
  title,
  session_id,
  visitor_id,
  event_timestamp,
  utm_campaign,
  practice_name,
  specialty,
  has_website,
  user_agent,
  country,
  city
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
      .bind(
        practiceSlug,
        eventType,
        pagePath,
        destinationUrl,
        referrer,
        deriveSessionSource(referrer ?? ""),
        title,
        sessionId,
        visitorId,
        eventTimestamp,
        utmCampaign,
        practiceName,
        specialty,
        hasWebsite,
        userAgent,
        country,
        city,
      )
      .run();
    } catch (error) {
      console.error("Unable to record analytics event", error);
      return jsonResponse({ error: "Unable to record event" }, 500, origin);
    }

    return jsonResponse({ ok: true }, 200, origin);
  },
} satisfies ExportedHandler<Env>;
