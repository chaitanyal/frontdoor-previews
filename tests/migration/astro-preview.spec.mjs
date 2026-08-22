import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  verifyMarketingOutputContract,
  verifyMarketingPreviewOutputContract,
  verifyPreviewOutputContract,
} from '../../scripts/migration/verify_output_contracts.mjs';
import {
  installDeterministicBrowser,
  installMockNetwork,
  waitForStablePage,
} from './helpers/static-site.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const previewRoot = path.join(repoRoot, '.tmp', 'astro-dist', 'preview');
const northHillsRoot = path.join(
  previewRoot,
  'previews',
  'northhillspsychiatry',
);

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function runBuild(script, siteId) {
  const env = { ...process.env };
  delete env.FRONTDOOR_TARGET;
  delete env.SITE_ID;
  if (siteId) env.SITE_ID = siteId;
  return spawnSync('npm', ['run', script], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

function htmlFiles(root = previewRoot) {
  return walkFiles(root).filter((file) => file.endsWith('.html'));
}

function expectNoindexCoverage(root, practiceIds) {
  const headers = readFileSync(path.join(root, '_headers'), 'utf8');
  for (const practiceId of practiceIds) {
    expect(headers).toContain(
      `/previews/${practiceId}/*\n  X-Robots-Tag: noindex, nofollow`,
    );
  }
  for (const htmlFile of htmlFiles(path.join(root, 'previews'))) {
    const html = readFileSync(htmlFile, 'utf8');
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
  }
}

test.describe.serial('Astro preview migration', () => {
  test('@astro-preview passes the North Hills single-preview gate first', async ({
    page,
  }) => {
    verifyPreviewOutputContract('northhillspsychiatry');
    expectNoindexCoverage(previewRoot, ['northhillspsychiatry']);
    expect(existsSync(path.join(previewRoot, 'sitemap.xml'))).toBe(false);

    expect(
      htmlFiles(northHillsRoot).map((file) =>
        path.relative(northHillsRoot, file).split(path.sep).join('/')),
    ).toEqual([
      'accessibility/index.html',
      'index.html',
      'privacy/index.html',
      'providers/diana-samuel/index.html',
      'providers/zita-samuel/index.html',
    ]);

    for (const forbidden of ['practice.json', '.DS_Store']) {
      expect(walkFiles(previewRoot).some((file) => path.basename(file) === forbidden)).toBe(false);
    }
    expect(walkFiles(previewRoot).some((file) => file.endsWith('.md'))).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    await installDeterministicBrowser(page);
    const network = await installMockNetwork(page);
    for (const relativePath of [
      'index.html',
      'providers/zita-samuel/index.html',
      'privacy/index.html',
      'accessibility/index.html',
    ]) {
      await page.goto(pathToFileURL(path.join(northHillsRoot, relativePath)).href);
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

    await page.goto(pathToFileURL(path.join(northHillsRoot, 'index.html')).href);
    const resourceUrls = await page
      .locator('[data-frontdoor-cta="resource"]')
      .evaluateAll((links) => links.map((link) => link.href));
    expect(resourceUrls.length).toBeGreaterThan(0);
    for (const resourceUrl of resourceUrls) {
      expect(resourceUrl.startsWith('file:')).toBe(true);
      expect(statSync(fileURLToPath(resourceUrl)).isFile()).toBe(true);
    }
    expect(network.unexpectedRequests).toEqual([]);
  });

  test('@astro-preview rejects an indexable practice', () => {
    const result = runBuild('build:astro:preview', 'drdronavalli');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Preview builds require seo.allowIndexing=false',
    );
  });

  test('@astro-preview generates all and only eligible previews', () => {
    const result = runBuild('build:astro:preview:all');
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    verifyPreviewOutputContract('ALL');
    expectNoindexCoverage(previewRoot, ['mariposa', 'northhillspsychiatry']);
    expect(existsSync(path.join(previewRoot, 'sitemap.xml'))).toBe(false);

    const generatedPractices = readdirSync(path.join(previewRoot, 'previews'))
      .filter((entry) => statSync(path.join(previewRoot, 'previews', entry)).isDirectory())
      .sort();
    expect(generatedPractices).toEqual(['mariposa', 'northhillspsychiatry']);
    expect(generatedPractices).not.toContain('drdronavalli');
    expect(generatedPractices).not.toContain('template');
  });

  test('@astro-preview includes protected previews in the marketing build', () => {
    const result = runBuild('build:astro:marketing');
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    verifyMarketingOutputContract();
    verifyMarketingPreviewOutputContract();

    const marketingRoot = path.join(repoRoot, '.tmp', 'astro-dist', 'marketing');
    expectNoindexCoverage(marketingRoot, [
      'mariposa',
      'northhillspsychiatry',
    ]);
    const sitemap = readFileSync(path.join(marketingRoot, 'sitemap.xml'), 'utf8');
    expect(sitemap).not.toContain('/previews/');
  });
});
