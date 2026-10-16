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
import { ensureBuild } from '../../scripts/verification/state.mjs';
import {
  verifyMarketingOutputContract,
  verifyMarketingPreviewOutputContract,
  verifyPreviewOutputContract,
} from '../../scripts/verification/verify_output_contracts.mjs';
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
const practices = readdirSync(path.join(repoRoot, 'sites')).filter(slug =>
  slug !== 'template' && existsSync(path.join(repoRoot, 'sites', slug, 'practice.json')),
).map(slug => ({ slug, config: JSON.parse(readFileSync(path.join(repoRoot, 'sites', slug, 'practice.json'), 'utf8')) }));
const eligiblePractices = practices.filter(({ config }) => config.seo.allowIndexing === false);
const northHills = practices.find(({ slug }) => slug === 'northhillspsychiatry').config;

function expectedRoutes(config) {
  return [
    'accessibility/index.html', 'index.html', 'privacy/index.html', 'terms/index.html',
    ...config.providers.map(provider => `providers/${provider.slug}/index.html`),
    ...((config.providerDirectory ?? config.providers.length >= 5) ? ['providers/index.html'] : []),
    ...(config.treatments || []).map(treatment => `treatment/${treatment.slug}/index.html`),
  ].sort();
}

function jsonLdTypes(html) {
  return [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => [JSON.parse(match[1])['@type']].flat());
}

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

test.describe.serial('Astro preview verification', () => {
  test('@astro-preview passes the North Hills single-preview gate first', async ({
    page,
  }) => {
    ensureBuild('preview', 'northhillspsychiatry');
    verifyPreviewOutputContract('northhillspsychiatry');
    expectNoindexCoverage(previewRoot, ['northhillspsychiatry']);
    expect(existsSync(path.join(previewRoot, 'sitemap.xml'))).toBe(false);

    expect(
      htmlFiles(northHillsRoot).map((file) =>
        path.relative(northHillsRoot, file).split(path.sep).join('/')).sort(),
    ).toEqual(expectedRoutes(northHills));

    for (const forbidden of ['practice.json', '.DS_Store']) {
      expect(walkFiles(previewRoot).some((file) => path.basename(file) === forbidden)).toBe(false);
    }
    expect(walkFiles(previewRoot).some((file) => file.endsWith('.md'))).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    await installDeterministicBrowser(page);
    const network = await installMockNetwork(page);
    for (const relativePath of [
      'index.html',
      ...northHills.providers.map(provider => `providers/${provider.slug}/index.html`),
      'privacy/index.html',
      'accessibility/index.html',
      'terms/index.html',
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
    const resources = northHills.resourceGroups?.length ? northHills.resourceGroups.flatMap(group => group.resources) : northHills.resources || [];
    expect(resourceUrls).toEqual(resources.map(resource => new URL(resource.url, pathToFileURL(path.join(northHillsRoot, 'index.html'))).href));
    for (const resourceUrl of resourceUrls) {
      if (resourceUrl.startsWith('file:')) expect(statSync(fileURLToPath(resourceUrl)).isFile()).toBe(true);
      else expect(new URL(resourceUrl).protocol).toBe('https:');
    }
    expect(network.unexpectedRequests).toEqual([]);
  });

  test('@astro-preview rejects an indexable practice', () => {
    const indexable = practices.find(({ config }) => config.seo.allowIndexing === true);
    expect(indexable, 'An indexable practice must cover preview rejection').toBeDefined();
    const result = runBuild('build:astro:preview', indexable.slug);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Preview builds require seo.allowIndexing=false',
    );
  });

  test('@astro-preview generates all and only eligible previews', async ({
    page,
  }) => {
    const result = runBuild('build:astro:preview:all');
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    verifyPreviewOutputContract('ALL');
    expectNoindexCoverage(previewRoot, eligiblePractices.map(({ slug }) => slug));
    expect(existsSync(path.join(previewRoot, 'sitemap.xml'))).toBe(false);

    const generatedPractices = readdirSync(path.join(previewRoot, 'previews'))
      .filter((entry) => statSync(path.join(previewRoot, 'previews', entry)).isDirectory())
      .sort();
    expect(generatedPractices).toEqual(eligiblePractices.map(({ slug }) => slug).sort());
    for (const { slug, config } of practices) if (config.seo.allowIndexing !== false) expect(generatedPractices).not.toContain(slug);
    expect(generatedPractices).not.toContain('template');

    for (const { slug: practiceId, config } of eligiblePractices) {
      const root = path.join(previewRoot, 'previews', practiceId);
      expect(htmlFiles(root).map(file => path.relative(root, file).split(path.sep).join('/')).sort()).toEqual(expectedRoutes(config));
      for (const provider of config.providers) {
        const providerHtml = readFileSync(
          path.join(
            previewRoot,
            'previews',
            practiceId,
            'providers',
            provider.slug,
            'index.html',
          ),
          'utf8',
        );
        expect(providerHtml).toContain(`data-theme="${config.theme}"`);
        expect(providerHtml).toContain('class="provider-page ');
        expect(providerHtml).toContain('provider-hero');
        expect(providerHtml.includes('data-provider-section="conditions"')).toBe(Boolean((provider.conditions || provider.specialties || config.conditions || []).length));
        if (config.fictionalDemo) {
          expect(providerHtml).toContain('Website concept');
          expect(jsonLdTypes(providerHtml)).toEqual(['WebPage']);
        }
      }
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await installDeterministicBrowser(page);
    const network = await installMockNetwork(page);
    await page.goto(
      pathToFileURL(
        path.join(
          previewRoot,
          'previews',
          'northwestpsychiatry',
          'providers',
          practices.find(({ slug }) => slug === 'northwestpsychiatry').config.providers[0].slug,
          'index.html',
        ),
      ).href,
    );
    await waitForStablePage(page);

    expect(
      await page.locator('.provider-hero-panel').evaluate((panel) => ({
        backgroundColor: getComputedStyle(panel).backgroundColor,
        borderRadius: getComputedStyle(panel).borderRadius,
      })),
    ).toEqual({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderRadius: '0px',
    });
    expect(
      await page
        .locator('[data-provider-section="conditions"] li')
        .first()
        .evaluate((item) => ({
          backgroundColor: getComputedStyle(item).backgroundColor,
          borderRadius: getComputedStyle(item).borderRadius,
          display: getComputedStyle(item).display,
          marker: getComputedStyle(item, '::before').content,
        })),
    ).toEqual({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderRadius: '0px',
      display: 'list-item',
      marker: 'none',
    });
    const providerShellOffsets = await page
      .locator(
        '.provider-hero > .section-shell, .provider-page-section > .provider-section-shell',
      )
      .evaluateAll((shells) =>
        shells.map((shell) => Math.round(shell.getBoundingClientRect().left)),
      );
    expect(new Set(providerShellOffsets).size).toBe(1);
    expect(network.unexpectedRequests).toEqual([]);
  });

  test('@astro-preview includes protected previews in the marketing build', () => {
    const result = runBuild('build:astro:marketing');
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    verifyMarketingOutputContract();
    verifyMarketingPreviewOutputContract();

    const marketingRoot = path.join(repoRoot, '.tmp', 'astro-dist', 'marketing');
    expectNoindexCoverage(marketingRoot, eligiblePractices.map(({ slug }) => slug));
    const sitemap = readFileSync(path.join(marketingRoot, 'sitemap.xml'), 'utf8');
    expect(sitemap).not.toContain('/previews/');
  });
});
