import assert from 'node:assert/strict';
import test from 'node:test';
import { createHandler, type Env } from '../src/index.js';

const origin = 'https://drdronavalli.com';
const mapping = JSON.stringify({
  drdronavalli: 'ChIJHVog23DAQIYRG8UCQY0AE5Q',
});
const silentReporter = () => {};

function testHandler(fetchImpl: typeof fetch = fetch, requestTimeoutMs = 5_000) {
  return createHandler(fetchImpl, requestTimeoutMs, silentReporter);
}

function rateLimiter(success = true): RateLimit {
  return {
    async limit() {
      return { success };
    },
  } as RateLimit;
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    GOOGLE_MAPS_API_KEY: 'test-secret-key',
    ALLOWED_ORIGINS: origin,
    PRACTICE_PLACE_IDS: mapping,
    RATE_LIMITER: rateLimiter(),
    ...overrides,
  };
}

function request(path = '/v1/ratings/drdronavalli', options: RequestInit = {}) {
  return new Request(`https://places.frontdoor.health${path}`, {
    headers: { Origin: origin, ...options.headers },
    ...options,
  });
}

test('returns a validated rating with no-store and CORS headers', async () => {
  let googleUrl = '';
  let googleFieldMask = '';
  let googleApiKey = '';
  const handler = testHandler(async (input, init) => {
    const googleRequest = new Request(input, init);
    googleUrl = googleRequest.url;
    googleFieldMask = googleRequest.headers.get('X-Goog-FieldMask') || '';
    googleApiKey = googleRequest.headers.get('X-Goog-Api-Key') || '';
    return Response.json({
      rating: 4.8,
      attributions: [
        { provider: 'Example provider', providerUri: 'https://example.com/source' },
        { provider: 'Unsafe provider', providerUri: 'http://example.com/source' },
      ],
    });
  });

  const response = await handler.fetch(request(), env(), {} as ExecutionContext);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.deepEqual(await response.json(), {
    ok: true,
    practiceSlug: 'drdronavalli',
    rating: 4.8,
    attributions: [
      { provider: 'Example provider', providerUri: 'https://example.com/source' },
    ],
  });
  assert.equal(
    googleUrl,
    'https://places.googleapis.com/v1/places/ChIJHVog23DAQIYRG8UCQY0AE5Q',
  );
  assert.equal(googleFieldMask, 'rating,attributions');
  assert.equal(googleApiKey, 'test-secret-key');
});

test('returns 404 for unknown routes and practice slugs', async () => {
  const handler = testHandler();
  assert.equal(
    (await handler.fetch(request('/health'), env(), {} as ExecutionContext)).status,
    404,
  );
  assert.equal(
    (
      await handler.fetch(
        request('/v1/ratings/unknown-practice'),
        env(),
        {} as ExecutionContext,
      )
    ).status,
    404,
  );
});

test('rejects missing and forbidden origins', async () => {
  const handler = testHandler();
  const missingOrigin = new Request(
    'https://places.frontdoor.health/v1/ratings/drdronavalli',
  );
  assert.equal(
    (await handler.fetch(missingOrigin, env(), {} as ExecutionContext)).status,
    403,
  );
  assert.equal(
    (
      await handler.fetch(
        request(undefined, { headers: { Origin: 'https://attacker.example' } }),
        env(),
        {} as ExecutionContext,
      )
    ).status,
    403,
  );
});

test('answers preflight without calling Google', async () => {
  let googleCalls = 0;
  const handler = testHandler(async () => {
    googleCalls += 1;
    return Response.json({ rating: 4.8 });
  });
  const response = await handler.fetch(
    request(undefined, { method: 'OPTIONS' }),
    env(),
    {} as ExecutionContext,
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(googleCalls, 0);
});

test('returns 405 before calling Google for disallowed methods', async () => {
  let googleCalls = 0;
  const handler = testHandler(async () => {
    googleCalls += 1;
    return Response.json({ rating: 4.8 });
  });
  const response = await handler.fetch(
    request(undefined, { method: 'POST' }),
    env(),
    {} as ExecutionContext,
  );
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(googleCalls, 0);
});

test('returns 429 before calling Google when the rate limit is exceeded', async () => {
  let googleCalls = 0;
  const handler = testHandler(async () => {
    googleCalls += 1;
    return Response.json({ rating: 4.8 });
  });
  const response = await handler.fetch(
    request(),
    env({ RATE_LIMITER: rateLimiter(false) }),
    {} as ExecutionContext,
  );
  assert.equal(response.status, 429);
  assert.equal(googleCalls, 0);
});

for (const [name, googleResponse] of [
  ['missing rating', {}],
  ['malformed rating', { rating: '4.8' }],
  ['out-of-range rating', { rating: 6 }],
] as const) {
  test(`returns a generic 502 for ${name}`, async () => {
    const handler = testHandler(async () => Response.json(googleResponse));
    const response = await handler.fetch(request(), env(), {} as ExecutionContext);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'Rating unavailable' });
  });
}

test('returns a generic 502 for Google failures and does not disclose the key', async () => {
  const reports: Array<Record<string, number | string | null>> = [];
  const handler = createHandler(
    async () =>
      Response.json({ error: { message: 'upstream detail' } }, { status: 403 }),
    5_000,
    (_message, context) => reports.push(context),
  );
  const response = await handler.fetch(request(), env(), {} as ExecutionContext);
  const body = await response.text();
  assert.equal(response.status, 502);
  assert.equal(body.includes('test-secret-key'), false);
  assert.equal(body.includes('upstream detail'), false);
  assert.deepEqual(reports, [
    {
      practiceSlug: 'drdronavalli',
      reason: 'upstream',
      upstreamStatus: 403,
    },
  ]);
  assert.equal(JSON.stringify(reports).includes('test-secret-key'), false);
  assert.equal(JSON.stringify(reports).includes('upstream detail'), false);
});

test('returns a generic 502 when the Google request times out', async () => {
  const handler = testHandler(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    5,
  );
  const response = await handler.fetch(request(), env(), {} as ExecutionContext);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'Rating unavailable' });
});

test('returns a generic 502 when the secret is missing', async () => {
  const handler = testHandler();
  const response = await handler.fetch(
    request(),
    env({ GOOGLE_MAPS_API_KEY: undefined }),
    {} as ExecutionContext,
  );
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'Rating unavailable' });
});
