import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test, expect } from '@playwright/test';
import {
  installDeterministicBrowser,
  installMockNetwork,
  waitForStablePage,
} from './helpers/static-site.mjs';

const pages = [
  {
    name: 'marketing-home',
    url: 'https://frontdoor.health/',
  },
  {
    name: 'marketing-case-study',
    url: 'https://frontdoor.health/case-studies/drdronavalli/',
  },
  {
    name: 'practice-home',
    url: 'https://drdronavalli.com/',
  },
  {
    name: 'practice-provider',
    url: 'https://drdronavalli.com/providers/goutham-dronavalli/',
  },
  {
    name: 'preview-northhillspsychiatry-home',
    url: 'https://frontdoor.health/previews/northhillspsychiatry/',
  },
];
const scope = process.env.FRONTDOOR_MIGRATION_SCOPE;
const target = process.env.FRONTDOOR_MIGRATION_TARGET;
const practiceSite = process.env.FRONTDOOR_MIGRATION_SITE || 'drdronavalli';
const practiceConfig = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'sites', practiceSite, 'practice.json'),
    'utf8',
  ),
);
const scopedPages = scope
  ? pages.filter((pageCase) => pageCase.name.startsWith(`${scope}-`))
  : pages;

const viewports = [
  {
    name: 'desktop',
    size: { width: 1440, height: 1000 },
  },
  {
    name: 'iphone',
    size: { width: 390, height: 844 },
  },
];

for (const pageCase of scopedPages) {
  for (const viewport of viewports) {
    test(`@visual ${pageCase.name} ${viewport.name}`, async ({ page }) => {
      test.skip(
        target === 'astro' &&
          scope === 'practice' &&
          practiceSite !== 'drdronavalli',
        'Pixel snapshots are locked to the Dr. Dronavalli migration pilot.',
      );
      await page.setViewportSize(viewport.size);
      await installDeterministicBrowser(page);
      const network = await installMockNetwork(page);
      let url = pageCase.url;
      if (target === 'astro' && scope === 'practice') {
        url = pathToFileURL(
          path.join(
            process.cwd(),
            '.tmp',
            'astro-dist',
            'practice',
            pageCase.name === 'practice-provider'
              ? `providers/${practiceConfig.providers[0].slug}/index.html`
              : 'index.html',
          ),
        ).href;
      } else if (target === 'astro' && scope === 'preview') {
        url = pathToFileURL(
          path.join(
            process.cwd(),
            '.tmp',
            'astro-dist',
            'preview',
            'previews',
            'northhillspsychiatry',
            'index.html',
          ),
        ).href;
      }
      await page.goto(url);
      await waitForStablePage(page);

      await expect(page).toHaveScreenshot(`${pageCase.name}-${viewport.name}.png`, {
        fullPage: true,
      });
      expect(network.unexpectedRequests).toEqual([]);
    });
  }
}

test('@visual practice local assets, resources, and mobile layout are valid', async ({
  page,
}) => {
  test.skip(
    target !== 'astro' || scope !== 'practice',
    'This check is specific to the Astro practice pilot.',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await installDeterministicBrowser(page);
  const network = await installMockNetwork(page);
  const root = path.join(
    process.cwd(),
    '.tmp',
    'astro-dist',
    'practice',
  );
  const localPages = [
    path.join(root, 'index.html'),
    path.join(root, 'privacy', 'index.html'),
    path.join(root, 'accessibility', 'index.html'),
    ...practiceConfig.providers.map((provider) =>
      path.join(root, 'providers', provider.slug, 'index.html')),
  ];

  for (const localPage of localPages) {
    await page.goto(pathToFileURL(localPage).href);
    await waitForStablePage(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator('img')
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0)),
    ).toBe(true);
  }

  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  const resourceUrls = await page
    .locator('[data-frontdoor-cta="resource"]')
    .evaluateAll((links) => links.map((link) => link.href));
  const expectedResourceCount = practiceConfig.resourceGroups?.length
    ? practiceConfig.resourceGroups.reduce(
        (count, group) => count + (group.resources?.length || 0),
        0,
      )
    : practiceConfig.resources?.length || 0;
  expect(resourceUrls).toHaveLength(expectedResourceCount);
  for (const resourceUrl of resourceUrls) {
    expect(resourceUrl.startsWith('file:')).toBe(true);
    expect(existsSync(fileURLToPath(resourceUrl))).toBe(true);
  }
  expect(network.unexpectedRequests).toEqual([]);
});
