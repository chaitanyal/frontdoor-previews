import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { verifyPracticeOutputContract } from '../../scripts/migration/verify_output_contracts.mjs';
import { homeSectionNavigation } from '../../src/lib/home-sections.mjs';
import {
  assertAnalyticsDeploymentAllowed,
  productionSiteUrl,
  standaloneNoindexHeaders,
} from '../../src/lib/practice-production.mjs';
import { discoverIndexRoutes, renderSitemap } from '../../src/lib/sitemap.mjs';
import {
  installDeterministicBrowser,
  installMockNetwork,
  waitForStablePage,
} from './helpers/static-site.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const practiceRoot = path.join(repoRoot, '.tmp', 'astro-dist', 'practice');
const practiceIds = readdirSync(path.join(repoRoot, 'sites'), {
  withFileTypes: true,
})
  .filter(
    (entry) =>
      entry.isDirectory() &&
      entry.name !== 'template' &&
      existsSync(path.join(repoRoot, 'sites', entry.name, 'practice.json')),
  )
  .map((entry) => entry.name)
  .sort();

function run(command, args, environment = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...environment },
  });
}

function buildPractice(practiceId) {
  const result = run('npm', ['run', 'build:astro:practice'], {
    SITE_ID: practiceId,
  });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
}

async function verifyHomeSectionNavigation(page, config, homeFile) {
  await page.goto(pathToFileURL(homeFile).href);
  await waitForStablePage(page);

  const expectedSections = homeSectionNavigation(config);
  const expectedIds = expectedSections.map((section) => section.id);
  const expectedHeaderSections = expectedSections.filter(
    (section) => section.header,
  );
  const expectedHeaderIds = [
    ...expectedHeaderSections.filter((section) => !section.cta),
    ...expectedHeaderSections.filter((section) => section.cta),
  ].map((section) => section.id);

  expect(
    await page
      .locator('main > section[id]')
      .evaluateAll((sections) => sections.map((section) => section.id)),
  ).toEqual(expectedIds);

  expect(
    await page
      .locator('nav[aria-label="Primary navigation"] [data-home-section-link]')
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute('data-home-section-link'))),
  ).toEqual(expectedHeaderIds);

  const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links.flatMap((link) => {
      const href = link.getAttribute('href') || '';
      const id = decodeURIComponent(href.slice(1));
      return id && document.getElementById(id) ? [] : [href];
    }),
  );
  expect(brokenAnchors).toEqual([]);

  const sectionHeadings = [];
  for (const section of expectedSections) {
    const target = page.locator(`#${section.id}`);
    await expect(target).toHaveCount(1);
    await expect(target.locator('h2')).toHaveCount(1);
    await expect(target.locator('[data-section-summary]')).toHaveCount(1);
    const heading = (await target.locator('h2').textContent()).trim();
    const summary = (
      await target.locator('[data-section-summary]').textContent()
    ).trim();
    expect(heading).not.toBe('');
    expect(summary).not.toBe('');
    sectionHeadings.push(heading);
  }
  expect(new Set(sectionHeadings).size).toBe(sectionHeadings.length);
  await expect(
    page.locator('footer nav[aria-label="Practice sections"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('footer nav[aria-label="Legal navigation"] a'),
  ).toHaveCount(3);
}

test.describe.serial('Astro production practice builds', () => {
  test('@astro-practice-production rejects unsafe production configuration', () => {
    expect(() => productionSiteUrl({ seo: {} }, 'missing-site')).toThrow(
      'seo.siteUrl is required',
    );
    expect(() =>
      productionSiteUrl({ seo: { siteUrl: 'http://example.com' } }, 'http-site'),
    ).toThrow('seo.siteUrl must be an HTTPS URL');

    const config = {
      seo: { siteUrl: 'https://new-practice.example', allowIndexing: true },
      practice: { slug: 'new-practice' },
    };
    expect(() => assertAnalyticsDeploymentAllowed(config, '[vars]\n')).toThrow(
      /Update both ALLOWED_ORIGINS and ALLOWED_PRACTICE_SLUGS/,
    );

    mkdirSync(path.join(repoRoot, '.tmp'), { recursive: true });
    const fixtureDirectory = mkdtempSync(
      path.join(repoRoot, '.tmp', 'invalid-practice-'),
    );
    try {
      const invalidConfig = JSON.parse(
        readFileSync(
          path.join(repoRoot, 'sites', 'drdronavalli', 'practice.json'),
          'utf8',
        ),
      );
      invalidConfig.providers[0].contactOverride = {
        phone: '(512) 555-0199',
      };
      const fixturePath = path.join(fixtureDirectory, 'practice.json');
      const validate = (config) => {
        writeFileSync(fixturePath, JSON.stringify(config));
        return run('python3', [
          'scripts/validate_practice_json.py',
          fixturePath,
        ]);
      };
      const validation = validate(invalidConfig);
      expect(validation.status).not.toBe(0);
      expect(validation.stderr).toContain(
        'phone and providers[0].contactOverride.phoneHref must be provided together',
      );

      const missingImageAlt = structuredClone(invalidConfig);
      delete missingImageAlt.providers[0].contactOverride;
      delete missingImageAlt.providers[0].imageAlt;
      const imageAltValidation = validate(missingImageAlt);
      expect(imageAltValidation.status).not.toBe(0);
      expect(imageAltValidation.stderr).toContain(
        'providers[0].imageAlt is required',
      );

      const missingProductionTitle = structuredClone(invalidConfig);
      delete missingProductionTitle.providers[0].contactOverride;
      delete missingProductionTitle.providers[0].seo.title;
      const titleValidation = validate(missingProductionTitle);
      expect(titleValidation.status).not.toBe(0);
      expect(titleValidation.stderr).toContain(
        'providers[0].seo.title is required',
      );

      const unsupportedImageKey = structuredClone(invalidConfig);
      delete unsupportedImageKey.providers[0].contactOverride;
      unsupportedImageKey.seo.defaultOgImage = unsupportedImageKey.seo.ogImage;
      const unsupportedImageValidation = validate(unsupportedImageKey);
      expect(unsupportedImageValidation.status).not.toBe(0);
      expect(unsupportedImageValidation.stderr).toContain(
        'seo.defaultOgImage is no longer supported',
      );

      const legacyGoogleRating = structuredClone(invalidConfig);
      delete legacyGoogleRating.providers[0].contactOverride;
      legacyGoogleRating.location.googleReviewSummary = {
        placeId: 'valid-place-id',
        url: 'https://maps.google.com',
        rating: 4.8,
      };
      const legacyGoogleRatingValidation = validate(legacyGoogleRating);
      expect(legacyGoogleRatingValidation.status).not.toBe(0);
      expect(legacyGoogleRatingValidation.stderr).toContain(
        'Google rating data must be retrieved dynamically',
      );

      const invalidPlaceId = structuredClone(invalidConfig);
      delete invalidPlaceId.providers[0].contactOverride;
      invalidPlaceId.location.googleReviewSummary = {
        placeId: 'invalid place id',
        url: 'https://maps.google.com',
      };
      const invalidPlaceIdValidation = validate(invalidPlaceId);
      expect(invalidPlaceIdValidation.status).not.toBe(0);
      expect(invalidPlaceIdValidation.stderr).toContain(
        'location.googleReviewSummary.placeId contains unsupported characters',
      );
    } finally {
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test('@astro-practice-production builds and verifies every real practice', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installDeterministicBrowser(page);
    const network = await installMockNetwork(page);
    const workerConfig = readFileSync(
      path.join(repoRoot, 'worker', 'wrangler.toml'),
      'utf8',
    );

    expect(practiceIds).toEqual([
      'drdronavalli',
      'mariposa',
      'northhillspsychiatry',
      'northwestpsychiatry',
    ]);

    for (const practiceId of practiceIds) {
      const configPath = path.join(
        repoRoot,
        'sites',
        practiceId,
        'practice.json',
      );
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      const validation = run('python3', [
        'scripts/validate_practice_json.py',
        configPath,
      ]);
      expect(validation.status, validation.stderr).toBe(0);

      buildPractice(practiceId);
      const htmlValidation = run('python3', [
        'scripts/validate_built_html.py',
        practiceRoot,
      ]);
      expect(htmlValidation.status, htmlValidation.stderr).toBe(0);
      verifyPracticeOutputContract(practiceId);

      const siteUrl = productionSiteUrl(config, practiceId);
      const htmlFiles = [
        path.join(practiceRoot, 'index.html'),
        path.join(practiceRoot, 'privacy', 'index.html'),
        path.join(practiceRoot, 'accessibility', 'index.html'),
        path.join(practiceRoot, 'terms', 'index.html'),
        ...config.providers.map((provider) =>
          path.join(
            practiceRoot,
            'providers',
            provider.slug,
            'index.html',
          )),
      ];

      for (const sectionRoute of ['services', 'insurance', 'faq']) {
        expect(existsSync(path.join(practiceRoot, sectionRoute))).toBe(false);
      }

      for (const htmlFile of htmlFiles) {
        const html = readFileSync(htmlFile, 'utf8');
        expect(html).not.toMatch(/pages\.dev|frontdoor-previews/i);
        expect(html).toContain(`<link rel="canonical" href="${siteUrl}/`);

        await page.goto(pathToFileURL(htmlFile).href);
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

      await verifyHomeSectionNavigation(
        page,
        config,
        path.join(practiceRoot, 'index.html'),
      );

      if (config.seo.allowIndexing === true) {
        assertAnalyticsDeploymentAllowed(config, workerConfig);
        const routes = await discoverIndexRoutes(practiceRoot);
        expect(readFileSync(path.join(practiceRoot, 'sitemap.xml'), 'utf8')).toBe(
          renderSitemap(siteUrl, routes),
        );
        expect(readFileSync(path.join(practiceRoot, 'robots.txt'), 'utf8')).toContain(
          `${siteUrl}/sitemap.xml`,
        );
        expect(existsSync(path.join(practiceRoot, '_headers'))).toBe(false);
      } else {
        expect(existsSync(path.join(practiceRoot, 'sitemap.xml'))).toBe(false);
        expect(readFileSync(path.join(practiceRoot, '_headers'), 'utf8')).toBe(
          standaloneNoindexHeaders(),
        );
      }

      expect(existsSync(path.join(practiceRoot, 'practice.json'))).toBe(false);
      expect(network.unexpectedRequests).toEqual([]);
    }
  });
});
