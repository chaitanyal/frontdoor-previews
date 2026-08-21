import { expect, test } from '@playwright/test';

const urls = {
  marketing:
    process.env.FRONTDOOR_STAGING_MARKETING_URL ||
    'https://astro-milestone-7.frontdoor-health.pages.dev',
  previews:
    process.env.FRONTDOOR_STAGING_PREVIEW_URL ||
    'https://astro-milestone-7.frontdoor-previews.pages.dev',
  practice:
    process.env.FRONTDOOR_STAGING_PRACTICE_URL ||
    'https://astro-milestone-7.drdronavalli.pages.dev',
};

function at(base, route) {
  return new URL(route, `${base}/`).href;
}

async function getHtml(request, url) {
  const response = await request.get(url);
  expect(response.status(), url).toBe(200);
  expect(response.headers()['content-type'], url).toContain('text/html');
  return {
    body: await response.text(),
    headers: response.headers(),
  };
}

function expectCloudflarePreviewNoindex(headers) {
  expect(headers['x-robots-tag']).toContain('noindex');
}

test('@staging serves Astro marketing and protects every preview route', async ({
  request,
}) => {
  const marketing = await getHtml(request, at(urls.marketing, '/'));
  expectCloudflarePreviewNoindex(marketing.headers);
  expect(marketing.body).toContain(
    'Help the right patients choose your practice.',
  );
  expect(marketing.body).not.toContain(
    '<meta name="robots" content="noindex, nofollow">',
  );

  for (const route of [
    '/about/',
    '/case-studies/drdronavalli/',
    '/privacy/',
    '/transformations/',
  ]) {
    const page = await getHtml(request, at(urls.marketing, route));
    expectCloudflarePreviewNoindex(page.headers);
  }

  for (const [base, route] of [
    [urls.marketing, '/previews/northhillspsychiatry/'],
    [
      urls.marketing,
      '/previews/northhillspsychiatry/providers/zita-samuel/',
    ],
    [urls.previews, '/previews/northhillspsychiatry/'],
    [
      urls.previews,
      '/previews/northhillspsychiatry/providers/zita-samuel/',
    ],
    [urls.previews, '/previews/mariposa/'],
  ]) {
    const preview = await getHtml(request, at(base, route));
    expectCloudflarePreviewNoindex(preview.headers);
    expect(preview.headers['x-robots-tag']).toContain('nofollow');
    expect(preview.body).toContain(
      '<meta name="robots" content="noindex, nofollow">',
    );
  }

  const sitemapResponse = await request.get(at(urls.marketing, '/sitemap.xml'));
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain('https://frontdoor.health/about/');
  expect(sitemap).not.toContain('/previews/');

  const previewSitemap = await request.get(at(urls.previews, '/sitemap.xml'));
  expect(previewSitemap.status()).toBe(404);
  const previewRobots = await request.get(at(urls.previews, '/robots.txt'));
  expect(previewRobots.status()).toBe(200);
  expect(await previewRobots.text()).toContain(
    'Sitemap: https://frontdoor.health/sitemap.xml',
  );
});

test('@staging serves the indexable practice contract behind deployment noindex', async ({
  request,
}) => {
  for (const route of [
    '/',
    '/providers/goutham-dronavalli/',
    '/privacy/',
    '/accessibility/',
  ]) {
    const page = await getHtml(request, at(urls.practice, route));
    expectCloudflarePreviewNoindex(page.headers);
    expect(page.body).not.toContain(
      '<meta name="robots" content="noindex, nofollow">',
    );
    expect(page.body).toContain(
      '<link rel="canonical" href="https://drdronavalli.com/',
    );
  }

  const robots = await request.get(at(urls.practice, '/robots.txt'));
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(
    'Sitemap: https://drdronavalli.com/sitemap.xml',
  );

  const sitemap = await request.get(at(urls.practice, '/sitemap.xml'));
  expect(sitemap.status()).toBe(200);
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain(
    'https://drdronavalli.com/providers/goutham-dronavalli/',
  );
  expect(sitemapBody).not.toMatch(/pages\.dev|frontdoor-previews/);
});

test('@staging loads nested assets at mobile width and preserves analytics payloads', async ({
  page,
}) => {
  const analyticsRequests = [];
  const failedSameOriginResponses = [];

  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://analytics.frontdoor.health/**', async (route) => {
    analyticsRequests.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'content-type',
      },
    });
  });
  await page.route(/https:\/\/(?:www\.)?googletagmanager\.com\/.*/, (route) =>
    route.abort(),
  );
  await page.on('response', (response) => {
    const responseUrl = new URL(response.url());
    if (
      responseUrl.hostname.endsWith('.pages.dev') &&
      response.status() >= 400
    ) {
      failedSameOriginResponses.push({
        status: response.status(),
        url: response.url(),
      });
    }
  });

  await page.goto(
    at(urls.previews, '/previews/northhillspsychiatry/'),
    { waitUntil: 'load' },
  );
  await expect.poll(() => analyticsRequests.length).toBe(1);
  expect(analyticsRequests[0]).toEqual(
    expect.objectContaining({
      event: 'page_view',
      path: '/previews/northhillspsychiatry/',
      practice_slug: 'northhillspsychiatry',
    }),
  );

  const phone = page.locator('[data-frontdoor-cta="phone"]').first();
  const destination = await phone.getAttribute('href');
  await phone.evaluate((element) => {
    element.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    });
    element.click();
  });
  await expect.poll(() => analyticsRequests.length).toBe(2);
  expect(analyticsRequests[1]).toEqual(
    expect.objectContaining({
      practice_slug: 'northhillspsychiatry',
      event_type: 'phone_click',
      page_path: '/previews/northhillspsychiatry/',
      destination_url: destination,
    }),
  );

  for (const route of [
    '/previews/northhillspsychiatry/',
    '/previews/northhillspsychiatry/providers/zita-samuel/',
    '/previews/mariposa/providers/alba-lara/',
  ]) {
    await page.goto(at(urls.previews, route), { waitUntil: 'load' });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator('img')
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    ).toBe(true);
  }

  expect(failedSameOriginResponses).toEqual([]);
});

test('@staging exposes the preview-request Function without sending email', async ({
  request,
}) => {
  const response = await request.fetch(
    at(urls.marketing, '/api/preview-request'),
    { method: 'OPTIONS' },
  );
  expect(response.status()).toBe(204);
  expect(response.headers().allow).toContain('POST');
});
