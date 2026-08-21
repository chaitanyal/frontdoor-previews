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
import { compareAstroPracticeContract } from '../../scripts/migration/capture_legacy_contracts.mjs';
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
      writeFileSync(fixturePath, JSON.stringify(invalidConfig));
      const validation = run('python3', [
        'scripts/validate_practice_json.py',
        fixturePath,
      ]);
      expect(validation.status).not.toBe(0);
      expect(validation.stderr).toContain(
        'phone and providers[0].contactOverride.phoneHref must be provided together',
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
      compareAstroPracticeContract(practiceId);

      const siteUrl = productionSiteUrl(config, practiceId);
      const htmlFiles = [
        path.join(practiceRoot, 'index.html'),
        path.join(practiceRoot, 'privacy', 'index.html'),
        path.join(practiceRoot, 'accessibility', 'index.html'),
        ...config.providers.map((provider) =>
          path.join(
            practiceRoot,
            'providers',
            provider.slug,
            'index.html',
          )),
      ];

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
