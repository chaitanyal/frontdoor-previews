import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { assertMarketingCaseStudyRoute } from '../../src/lib/marketing-data.mjs';
import { loadPracticeData } from '../../src/lib/practice-data.mjs';
import {
  financialSectionMode,
  providerAffiliationMode,
  providerProfile,
} from '../../src/lib/practice-view.mjs';
import {
  discoverIndexRoutes,
  renderSitemap,
} from '../../src/lib/sitemap.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function cleanBuildEnv(overrides = {}) {
  const env = { ...process.env };
  delete env.FRONTDOOR_ASTRO_PRACTICE_IDS;
  delete env.FRONTDOOR_ASTRO_SITE;
  delete env.FRONTDOOR_TARGET;
  delete env.SITE_ID;
  return { ...env, ...overrides };
}

function runNpmBuild(script, siteId) {
  const result = spawnSync(npmCommand, ['run', script], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: cleanBuildEnv(siteId ? { SITE_ID: siteId } : {}),
  });
  expect(
    result.status,
    `${script} failed:\n${result.stdout}\n${result.stderr}`,
  ).toBe(0);
}

async function expectStaticFilePage(page, relativePath, expectedDetail) {
  const filePath = path.join(repoRoot, relativePath);
  await page.goto(pathToFileURL(filePath).href, { waitUntil: 'load' });

  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByText(expectedDetail, { exact: true })).toBeVisible();
  expect(await page.locator('astro-island').count()).toBe(0);
  expect(await page.locator('script[src*="/_astro/"]').count()).toBe(0);
  expect(await page.locator('script[type="module"]').count()).toBe(0);

  const imageState = await page.locator('img').first().evaluate((image) => ({
    complete: image.complete,
    naturalWidth: image.naturalWidth,
  }));
  expect(imageState.complete).toBe(true);
  expect(imageState.naturalWidth).toBeGreaterThan(0);
}

function expectRuntimeCopies(target) {
  for (const runtimeFile of ['analytics.js', 'attribution.js', 'google-ads.js']) {
    const source = readFileSync(path.join(repoRoot, 'shared', runtimeFile));
    const output = readFileSync(
      path.join(repoRoot, '.tmp', 'astro-dist', target, 'shared', runtimeFile),
    );
    expect(output.equals(source), `${target}/${runtimeFile} changed while copying`).toBe(true);
  }
}

test.describe.serial('Astro migration foundation', () => {
  test('@astro-foundation builds every target and loads copied assets through file URLs', async ({
    page,
  }) => {
    runNpmBuild('build:astro:marketing');
    expectRuntimeCopies('marketing');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/marketing/index.html',
      'Help the right patients choose your practice.',
    );
    const marketingRoot = path.join(repoRoot, '.tmp', 'astro-dist', 'marketing');
    const marketingRoutes = await discoverIndexRoutes(marketingRoot, {
      excludePrefixes: ['previews/'],
    });
    expect(marketingRoutes).toEqual([
      '',
      'about/',
      'case-studies/',
      'case-studies/drdronavalli/',
      'privacy/',
      'transformations/',
    ]);
    expect(readFileSync(path.join(marketingRoot, 'sitemap.xml'), 'utf8')).toBe(
      renderSitemap('https://frontdoor.health', marketingRoutes),
    );
    const notFoundHtml = readFileSync(
      path.join(marketingRoot, '404.html'),
      'utf8',
    );
    expect(notFoundHtml).toContain(
      'href="/assets/frontdoor-health-favicon.svg"',
    );
    expect(notFoundHtml).toContain(
      'src="/assets/marketing-tailwind-config.js"',
    );
    expect(
      new URL('/assets/frontdoor-health-favicon.svg', 'https://frontdoor.health/foo/bar/').href,
    ).toBe('https://frontdoor.health/assets/frontdoor-health-favicon.svg');

    runNpmBuild('build:astro:practice', 'drdronavalli');
    expectRuntimeCopies('practice');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/practice/index.html',
      'Breathe easier with expert pulmonary care.',
    );

    runNpmBuild('build:astro:preview', 'northhillspsychiatry');
    expectRuntimeCopies('preview');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/northhillspsychiatry/index.html',
      'Care that starts with understanding.',
    );

    runNpmBuild('build:astro:preview:all');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/mariposa/index.html',
      'Insight-oriented psychiatric care.',
    );
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/northhillspsychiatry/index.html',
      'Care that starts with understanding.',
    );
    const mariposaHtml = readFileSync(
      path.join(
        repoRoot,
        '.tmp',
        'astro-dist',
        'preview',
        'previews',
        'mariposa',
        'index.html',
      ),
      'utf8',
    );
    expect(mariposaHtml).toContain(
      '<link rel="canonical" href="https://frontdoor.health/previews/mariposa/"',
    );
    expect(mariposaHtml).toContain(
      'https://frontdoor.health/previews/mariposa/images/hero/hero.webp',
    );
    expect(mariposaHtml).not.toContain('preview.frontdoor.health');

    const marketingHtml = readFileSync(
      path.join(repoRoot, '.tmp', 'astro-dist', 'marketing', 'index.html'),
      'utf8',
    );
    expect(marketingHtml).toContain('/shared/attribution.js');
    expect(marketingHtml).toContain('/shared/google-ads.js');
    expect(marketingHtml).not.toContain('/shared/analytics.js');
    expect(marketingHtml).not.toContain('FRONTDOOR_PRACTICE_SLUG');
    expect(marketingHtml).toContain('"@type":"Organization"');
    expect(marketingHtml).toContain('"@type":"WebSite"');
    expect(marketingHtml).toContain('"@type":"Service"');
    expect(marketingHtml).not.toContain('migration fixture');

    const practiceHtml = readFileSync(
      path.join(repoRoot, '.tmp', 'astro-dist', 'practice', 'index.html'),
      'utf8',
    );
    const practicePrivacyHtml = readFileSync(
      path.join(repoRoot, '.tmp', 'astro-dist', 'practice', 'privacy', 'index.html'),
      'utf8',
    );
    const slugIndex = practiceHtml.indexOf('FRONTDOOR_PRACTICE_SLUG');
    const attributionIndex = practiceHtml.indexOf('/shared/attribution.js');
    const analyticsIndex = practiceHtml.indexOf('/shared/analytics.js');
    expect(slugIndex).toBeGreaterThan(-1);
    expect(attributionIndex).toBeGreaterThan(slugIndex);
    expect(analyticsIndex).toBeGreaterThan(attributionIndex);
    expect(practicePrivacyHtml).toContain('/shared/attribution.js');
    expect(practicePrivacyHtml).not.toContain('/shared/analytics.js');
    expect(practicePrivacyHtml).not.toContain('FRONTDOOR_PRACTICE_SLUG');

    const previewPrivacyHtml = readFileSync(
      path.join(
        repoRoot,
        '.tmp',
        'astro-dist',
        'preview',
        'previews',
        'northhillspsychiatry',
        'privacy',
        'index.html',
      ),
      'utf8',
    );
    expect(previewPrivacyHtml).toContain('/shared/attribution.js');
    expect(previewPrivacyHtml).not.toContain('/shared/analytics.js');
    expect(previewPrivacyHtml).not.toContain('FRONTDOOR_PRACTICE_SLUG');
    expect(previewPrivacyHtml).toContain(
      '<link rel="stylesheet" href="../assets/styles.css">',
    );

    const previewHomeHtml = readFileSync(
      path.join(
        repoRoot,
        '.tmp',
        'astro-dist',
        'preview',
        'previews',
        'northhillspsychiatry',
        'index.html',
      ),
      'utf8',
    );
    const previewProviderHtml = readFileSync(
      path.join(
        repoRoot,
        '.tmp',
        'astro-dist',
        'preview',
        'previews',
        'northhillspsychiatry',
        'providers',
        'zita-samuel',
        'index.html',
      ),
      'utf8',
    );
    expect(previewHomeHtml).toContain(
      '<link rel="stylesheet" href="./assets/styles.css">',
    );
    expect(previewProviderHtml).toContain(
      '<link rel="stylesheet" href="../../assets/styles.css">',
    );
  });

  test('@astro-foundation preserves reusable practice configuration variants', async () => {
    const { config: northHills } = await loadPracticeData(
      repoRoot,
      'northhillspsychiatry',
    );
    expect(northHills.financialPolicy.paymentModel).toBe('cash_only');
    expect(financialSectionMode(northHills)).toBe('policy');
    expect(financialSectionMode({
      ...northHills,
      financialPolicy: undefined,
    })).toBeNull();
    runNpmBuild('build:astro:practice', 'northhillspsychiatry');
    const northHillsHome = readFileSync(
      path.join(repoRoot, '.tmp', 'astro-dist', 'practice', 'index.html'),
      'utf8',
    );
    expect(northHillsHome).toContain('Private Pay');
    expect(northHillsHome).toContain(
      'Please call the office for current rates and payment options.',
    );
    expect(northHillsHome).not.toContain('Insurance Coverage');

    const { config: mariposa } = await loadPracticeData(repoRoot, 'mariposa');
    const provider = mariposa.providers[0];
    const profile = providerProfile(mariposa, provider);
    expect(profile.isPsychiatry).toBe(true);
    expect(providerAffiliationMode(profile)).toBe('');
    runNpmBuild('build:astro:practice', 'mariposa');
    const mariposaProvider = readFileSync(
      path.join(
        repoRoot,
        '.tmp',
        'astro-dist',
        'practice',
        'providers',
        'alba-lara',
        'index.html',
      ),
      'utf8',
    );
    expect(mariposaProvider).not.toContain('Professional Affiliations');
    expect(mariposaProvider).not.toContain(
      'American Academy of Geriatric Psychiatry',
    );

    const overrideProfile = providerProfile(mariposa, {
      ...provider,
      contactOverride: {
        phone: '(512) 555-0199',
        phoneHref: 'tel:+15125550199',
        addressLines: ['100 New Office Road', 'Austin, TX 78701'],
      },
    });
    expect(overrideProfile.phone).toBe('(512) 555-0199');
    expect(overrideProfile.phoneHref).toBe('tel:+15125550199');
    expect(overrideProfile.address).toBe(
      '100 New Office Road, Austin, TX 78701',
    );

    const structuredSpecialtyProfile = providerProfile(mariposa, {
      ...provider,
      specialty: undefined,
      credentials: undefined,
      medicalSpecialty: 'https://schema.org/Psychiatry',
    });
    expect(structuredSpecialtyProfile.isPsychiatry).toBe(true);
  });

  test('@astro-foundation validates generated HTML before reporting build success', () => {
    const buildSource = readFileSync(
      path.join(repoRoot, 'scripts', 'build_astro.mjs'),
      'utf8',
    );
    const validationIndex = buildSource.indexOf('validate_built_html.py');
    const successIndex = buildSource.indexOf('console.log(`Astro ${target} output:');

    expect(validationIndex).toBeGreaterThan(-1);
    expect(successIndex).toBeGreaterThan(validationIndex);
  });

  test('@astro-foundation rejects invalid target and SITE_ID combinations', () => {
    expect(() =>
      assertMarketingCaseStudyRoute(repoRoot, 'drdronavalli'),
    ).not.toThrow();
    expect(() =>
      assertMarketingCaseStudyRoute(repoRoot, 'northhillspsychiatry'),
    ).toThrow(
      'Missing Astro marketing case study route for featured practice: northhillspsychiatry',
    );

    const cases = [
      [{}, 'FRONTDOOR_TARGET is required'],
      [
        { FRONTDOOR_TARGET: 'marketing', SITE_ID: 'northhillspsychiatry' },
        'SITE_ID is not used for marketing builds',
      ],
      [{ FRONTDOOR_TARGET: 'practice' }, 'SITE_ID is required for practice builds'],
      [
        { FRONTDOOR_TARGET: 'practice', SITE_ID: 'ALL' },
        'SITE_ID=ALL is only valid for preview builds',
      ],
      [{ FRONTDOOR_TARGET: 'preview' }, 'SITE_ID is required for preview builds'],
      [
        { FRONTDOOR_TARGET: 'preview', SITE_ID: 'drdronavalli' },
        'Preview builds require seo.allowIndexing=false',
      ],
      [
        { FRONTDOOR_TARGET: 'practice', SITE_ID: 'does-not-exist' },
        'Unknown SITE_ID: does-not-exist',
      ],
      [
        { FRONTDOOR_TARGET: 'practice', SITE_ID: 'template' },
        'Unknown SITE_ID: template',
      ],
    ];

    for (const [env, expectedError] of cases) {
      const result = spawnSync(
        process.execPath,
        [path.join(repoRoot, 'scripts', 'build_astro.mjs')],
        {
          cwd: repoRoot,
          encoding: 'utf8',
          env: cleanBuildEnv(env),
        },
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(expectedError);
    }
  });
});
