export interface Env {
  GOOGLE_MAPS_API_KEY?: string;
  ALLOWED_ORIGINS?: string;
  PRACTICE_PLACE_IDS?: string;
  RATE_LIMITER: RateLimit;
}

export type RatingHandler = {
  fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response>;
};

type GoogleAttribution = {
  provider?: unknown;
  providerUri?: unknown;
};

type GooglePlaceResponse = {
  rating?: unknown;
  attributions?: unknown;
};

type PlaceFetchResult =
  | { place: GooglePlaceResponse; error: null; upstreamStatus: null }
  | {
      place: null;
      error: 'invalid-response' | 'network' | 'timeout' | 'upstream';
      upstreamStatus: number | null;
    };

type ErrorReporter = (
  message: string,
  context: Record<string, number | string | null>,
) => void;

const PLACE_DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places/';
const REQUEST_TIMEOUT_MS = 5_000;
const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://frontdoor.health',
  'https://www.frontdoor.health',
  'https://drdronavalli.com',
  'https://www.drdronavalli.com',
]);
const DEFAULT_PRACTICE_PLACE_IDS = new Map([
  ['drdronavalli', 'ChIJHVog23DAQIYRG8UCQY0AE5Q'],
]);

function configuredOrigins(value: string | undefined): Set<string> {
  if (!value) return DEFAULT_ALLOWED_ORIGINS;
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length ? new Set(origins) : DEFAULT_ALLOWED_ORIGINS;
}

function configuredPlaces(value: string | undefined): Map<string, string> {
  if (!value) return DEFAULT_PRACTICE_PLACE_IDS;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return new Map();
    }

    const entries = Object.entries(parsed).filter(
      ([slug, placeId]) =>
        /^[a-z0-9-]+$/.test(slug) &&
        typeof placeId === 'string' &&
        /^[A-Za-z0-9_-]+$/.test(placeId),
    ) as Array<[string, string]>;
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  return configuredOrigins(env.ALLOWED_ORIGINS).has(origin) ? origin : null;
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
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
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

async function clientRateLimitKey(request: Request, origin: string): Promise<string> {
  const clientAddress = request.headers.get('CF-Connecting-IP') || 'unknown';
  const input = new TextEncoder().encode(`${origin}|${clientAddress}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  const clientHash = Array.from(new Uint8Array(digest).slice(0, 12))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `${origin}|${clientHash}`;
}

function safeAttributions(value: unknown): Array<{ provider: string; providerUri: string }> {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item: GoogleAttribution) => {
    if (!item || typeof item !== 'object') return [];
    const provider =
      typeof item.provider === 'string' ? item.provider.trim().slice(0, 120) : '';
    const providerUri =
      typeof item.providerUri === 'string' ? item.providerUri.trim() : '';
    if (!provider || !providerUri.startsWith('https://')) return [];
    return [{ provider, providerUri }];
  });
}

async function fetchPlace(
  placeId: string,
  apiKey: string,
  fetchImpl: typeof fetch,
  requestTimeoutMs: number,
): Promise<PlaceFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetchImpl(
      `${PLACE_DETAILS_BASE_URL}${encodeURIComponent(placeId)}`,
      {
        cache: 'no-store',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'rating,attributions',
        },
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      return {
        place: null,
        error: 'upstream',
        upstreamStatus: response.status,
      };
    }

    try {
      return {
        place: (await response.json()) as GooglePlaceResponse,
        error: null,
        upstreamStatus: null,
      };
    } catch {
      return {
        place: null,
        error: 'invalid-response',
        upstreamStatus: response.status,
      };
    }
  } catch {
    return {
      place: null,
      error: controller.signal.aborted ? 'timeout' : 'network',
      upstreamStatus: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function createHandler(
  fetchImpl: typeof fetch = fetch,
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
  reportError: ErrorReporter = console.error,
): RatingHandler {
  return {
    async fetch(request, env, _context): Promise<Response> {
      const url = new URL(request.url);
      const route = url.pathname.match(/^\/v1\/ratings\/([a-z0-9-]+)$/);
      if (!route) return jsonResponse({ error: 'Not found' }, 404);

      const practiceSlug = route[1];
      const placeId = configuredPlaces(env.PRACTICE_PLACE_IDS).get(practiceSlug);
      if (!placeId) return jsonResponse({ error: 'Not found' }, 404);

      const origin = allowedOrigin(request, env);
      if (!origin) return jsonResponse({ error: 'Forbidden origin' }, 403);

      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Cache-Control': 'no-store',
            ...corsHeaders(origin),
          },
        });
      }

      if (request.method !== 'GET') {
        return jsonResponse({ error: 'Method not allowed' }, 405, origin);
      }

      const rateLimitKey = await clientRateLimitKey(request, origin);
      const { success } = await env.RATE_LIMITER.limit({ key: rateLimitKey });
      if (!success) {
        return jsonResponse({ error: 'Rate limit exceeded' }, 429, origin);
      }

      const apiKey = env.GOOGLE_MAPS_API_KEY?.trim();
      if (!apiKey) {
        reportError('Google Places rating unavailable', {
          practiceSlug,
          reason: 'missing-secret',
          upstreamStatus: null,
        });
        return jsonResponse({ error: 'Rating unavailable' }, 502, origin);
      }

      const placeResult = await fetchPlace(
        placeId,
        apiKey,
        fetchImpl,
        requestTimeoutMs,
      );
      if (placeResult.error) {
        reportError('Google Places rating unavailable', {
          practiceSlug,
          reason: placeResult.error,
          upstreamStatus: placeResult.upstreamStatus,
        });
        return jsonResponse({ error: 'Rating unavailable' }, 502, origin);
      }

      const place = placeResult.place;
      const rating = place?.rating;
      if (
        typeof rating !== 'number' ||
        !Number.isFinite(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        reportError('Google Places rating unavailable', {
          practiceSlug,
          reason: 'invalid-rating',
          upstreamStatus: 200,
        });
        return jsonResponse({ error: 'Rating unavailable' }, 502, origin);
      }

      return jsonResponse(
        {
          ok: true,
          practiceSlug,
          rating,
          attributions: safeAttributions(place?.attributions),
        },
        200,
        origin,
      );
    },
  };
}

const handler = createHandler();

export default {
  fetch(request, env, context) {
    return handler.fetch(request, env, context);
  },
} satisfies ExportedHandler<Env>;
