import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  installDeterministicBrowser,
  installMockNetwork,
  waitForStablePage,
} from './helpers/static-site.mjs';

const practiceHome = path.join(
  process.cwd(),
  '.tmp',
  'astro-dist',
  'practice',
  'index.html',
);

async function openPractice(page, placeRatingResponse) {
  await page.setViewportSize({ width: 390, height: 844 });
  await installDeterministicBrowser(page);
  const network = await installMockNetwork(page, { placeRatingResponse });
  await page.goto(pathToFileURL(practiceHome).href);
  await waitForStablePage(page);
  return network;
}

test('@google-maps lazily renders the current Google Maps rating', async ({ page }) => {
  const network = await openPractice(page, {
    status: 200,
    json: {
      ok: true,
      practiceSlug: 'drdronavalli',
      rating: 4.8,
      attributions: [],
    },
  });
  const summary = page.locator('[data-google-rating]');

  await expect(summary.locator('[data-google-rating-fallback]')).toBeVisible();
  await expect(summary.locator('[data-google-rating-fallback]')).toHaveText(
    'Google Maps reviews',
  );
  expect(network.placeRatingRequests).toHaveLength(0);

  await page.locator('#location').scrollIntoViewIfNeeded();
  await expect(summary).toHaveAttribute('data-rating-state', 'loaded');
  expect(network.placeRatingRequests).toHaveLength(1);
  expect(network.placeRatingRequests[0].url).toBe(
    'https://places.frontdoor.health/v1/ratings/drdronavalli',
  );
  expect(network.placeRatingRequests[0].method).toBe('GET');

  const success = summary.locator('[data-google-rating-success]');
  await expect(success).toBeVisible();
  await expect(summary.locator('[data-google-rating-visual]')).toHaveText(
    'Rated 4.8/5 on',
  );
  await expect(success.locator('a')).toHaveText('Google Maps');
  await expect(summary.locator('[data-google-rating-accessible]')).toHaveText(
    'Rated 4.8 out of 5 on',
  );
  await expect(success.locator('a')).toHaveAttribute(
    'href',
    'https://maps.app.goo.gl/52RpZsPXu8jd1cwK8',
  );

  const html = readFileSync(practiceHome, 'utf8');
  expect(html).not.toContain('reviewCount');
  expect(html).not.toContain('17 Google');
  expect(network.unexpectedRequests).toEqual([]);
});

test('@google-maps retains the link-only fallback when the endpoint fails', async ({
  page,
}) => {
  const network = await openPractice(page, {
    status: 502,
    json: { error: 'Rating unavailable' },
  });
  const summary = page.locator('[data-google-rating]');

  expect(network.placeRatingRequests).toHaveLength(0);
  await page.locator('#location').scrollIntoViewIfNeeded();
  await expect(summary).toHaveAttribute('data-rating-state', 'unavailable');
  expect(network.placeRatingRequests).toHaveLength(1);
  await expect(summary.locator('[data-google-rating-fallback]')).toBeVisible();
  await expect(summary.locator('[data-google-rating-fallback]')).toHaveText(
    'Google Maps reviews',
  );
  await expect(summary.locator('[data-google-rating-success]')).toBeHidden();
  expect(network.unexpectedRequests).toEqual([]);
});
