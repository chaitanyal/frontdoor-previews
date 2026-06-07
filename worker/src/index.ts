export interface Env {
  DB: D1Database;
}

const allowedEventTypes = new Set([
  "appointment_click",
  "new_patient_click",
  "phone_click",
  "directions_click",
  "existing_patient_click",
  "patient_portal_click",
  "email_click",
  "resource_download",
]);

type EventPayload = {
  practice_slug?: unknown;
  event_type?: unknown;
  page_path?: unknown;
  destination_url?: unknown;
  referrer?: unknown;
};

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
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

async function readPayload(request: Request): Promise<EventPayload | null> {
  try {
    const payload = await request.json();
    return payload && typeof payload === "object"
      ? (payload as EventPayload)
      : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/event") {
      return jsonResponse({ error: "Not found" }, 404);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const payload = await readPayload(request);
    const practiceSlug = optionalString(payload?.practice_slug);
    const eventType = optionalString(payload?.event_type);

    if (
      !payload ||
      !practiceSlug ||
      !eventType ||
      !allowedEventTypes.has(eventType)
    ) {
      return jsonResponse({ error: "Invalid event" }, 400);
    }

    const pagePath = optionalString(payload.page_path);
    const destinationUrl = optionalString(payload.destination_url);
    const referrer = optionalString(payload.referrer);
    const userAgent = request.headers.get("User-Agent");
    const country = request.cf?.country ?? null;

    try {
      await env.DB.prepare(`
INSERT INTO events (
  practice_slug,
  event_type,
  page_path,
  destination_url,
  referrer,
  session_source,
  user_agent,
  country
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)
      .bind(
        practiceSlug,
        eventType,
        pagePath,
        destinationUrl,
        referrer,
        deriveSessionSource(referrer ?? ""),
        userAgent,
        country,
      )
      .run();
    } catch {
      return jsonResponse({ error: "Unable to record event" }, 500);
    }

    return jsonResponse({ ok: true });
  },
} satisfies ExportedHandler<Env>;
