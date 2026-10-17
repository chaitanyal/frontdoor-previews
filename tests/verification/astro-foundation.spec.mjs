import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { validateGooglePlacesConfiguration } from '../../scripts/validate_google_places_config.mjs';
import { assertMarketingCaseStudyRoute } from '../../src/lib/marketing-data.mjs';
import {
  financialSectionMode,
  practiceHomepageSchemas,
  providerAffiliationMode,
  providerEntityId,
  providerEntityType,
  providerProfile,
  schemaMedicalSpecialty,
} from '../../src/lib/practice-view.mjs';
import {
  homepageImageMetadata,
  providerImageMetadata,
  socialMetadata,
  webPageSchema,
} from '../../src/lib/seo.mjs';
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

async function expectStaticFilePage(page, relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  await page.goto(pathToFileURL(filePath).href, { waitUntil: 'load' });

  await expect(page.locator('h1')).toBeVisible();
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

test.describe.serial('Astro verification foundation', () => {
  test('@astro-foundation builds every target and loads copied assets through file URLs', async ({
    page,
  }) => {
    runNpmBuild('build:astro:marketing');
    expectRuntimeCopies('marketing');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/marketing/index.html',
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
      'href="/assets/marketing.css"',
    );
    expect(
      new URL('/assets/frontdoor-health-favicon.svg', 'https://frontdoor.health/foo/bar/').href,
    ).toBe('https://frontdoor.health/assets/frontdoor-health-favicon.svg');

    runNpmBuild('build:astro:practice', 'drdronavalli');
    expectRuntimeCopies('practice');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/practice/index.html',
    );

    runNpmBuild('build:astro:preview', 'northhillspsychiatry');
    expectRuntimeCopies('preview');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/northhillspsychiatry/index.html',
    );

    runNpmBuild('build:astro:preview:all');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/mariposa/index.html',
    );
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/northhillspsychiatry/index.html',
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
    expect(marketingHtml).not.toContain('verification fixture');

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
    expect(practicePrivacyHtml).toContain('/shared/analytics.js');
    expect(practicePrivacyHtml).toContain('FRONTDOOR_PRACTICE_SLUG');

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
    expect(previewPrivacyHtml).toContain('/shared/analytics.js');
    expect(previewPrivacyHtml).toContain('FRONTDOOR_PRACTICE_SLUG');
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
    const pilotConfig = JSON.parse(readFileSync(path.join(repoRoot, 'sites', 'northhillspsychiatry', 'practice.json'), 'utf8'));
    const previewProviderHtml = readFileSync(
      path.join(
        repoRoot,
        '.tmp',
        'astro-dist',
        'preview',
        'previews',
        'northhillspsychiatry',
        'providers',
        pilotConfig.providers[0].slug,
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
    const cashOnly = { financialPolicy: { paymentModel: 'cash_only' } };
    expect(financialSectionMode(cashOnly)).toBe('policy');
    expect(financialSectionMode({ insurance: { enabled: true }, financialPolicy: { paymentModel: 'insurance' } })).toBe('insurance');
    expect(financialSectionMode({})).toBeNull();
    const provider = { slug: 'example', name: 'Dr. Example', credentials: 'MD', specialty: 'Psychiatry', affiliations: ['Example professional organization'] };
    const practice = {
      practice: { slug: 'example', name: 'Example Practice' },
      seo: { siteUrl: 'https://example.com', title: 'Example Practice' },
      providers: [provider],
    };
    const profile = providerProfile(practice, provider);
    expect(profile.isPsychiatry).toBe(true);
    expect(providerAffiliationMode(profile)).toBe('');
    expect(providerAffiliationMode({ ...profile, isPsychiatry: false })).toBe('professional');
    expect(providerAffiliationMode({ ...profile, hospitalAffiliations: ['Example hospital'] })).toBe('hospital');

    const overrideProfile = providerProfile(practice, {
      ...provider,
      contactOverride: {
        phone: '(512) 555-0199',
        phoneHref: 'tel:+15125550199',
        addressLines: ['100 New Office Road', 'Austin, TX 78701'],
      },
    });
    expect(overrideProfile.phone).toBe('(512) 555-0199');
    expect(overrideProfile.phoneHref).toBe('tel:+15125550199');
    expect(overrideProfile.address).toBeUndefined();

    const structuredOverrideProfile = providerProfile(practice, {
      ...provider,
      contactOverride: {
        address: {
          streetAddress: '100 New Office Road',
          addressLocality: 'Austin',
          addressRegion: 'TX',
          postalCode: '78701',
          addressCountry: 'US',
        },
      },
    });
    expect(structuredOverrideProfile.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: '100 New Office Road',
      addressLocality: 'Austin',
      addressRegion: 'TX',
      postalCode: '78701',
      addressCountry: 'US',
    });

    const structuredSpecialtyProfile = providerProfile(practice, {
      ...provider,
      specialty: undefined,
      credentials: undefined,
      medicalSpecialty: 'https://schema.org/Psychiatry',
    });
    expect(structuredSpecialtyProfile.isPsychiatry).toBe(true);
    expect(schemaMedicalSpecialty('Psychiatry')).toBe(
      'https://schema.org/Psychiatric',
    );
    expect(schemaMedicalSpecialty('Made Up Specialty')).toBeUndefined();
  });

  test('@astro-foundation creates stable single and multi-provider schema identities', () => {
    const physician = {
      slug: 'jane-doe',
      name: 'Dr. Jane Doe',
      credentials: 'MD',
      specialty: 'Psychiatry',
      image: './images/jane.webp',
      tagline: 'Thoughtful psychiatric care.',
      conditions: ['Anxiety'],
    };
    const single = {
      seo: {
        siteUrl: 'https://example.com',
        title: 'Jane Doe, MD',
        description: 'Psychiatric care.',
      },
      practice: {
        name: 'Jane Doe, MD',
        phone: '(512) 555-0100',
        email: 'office@example.com',
        address: {
          addressLocality: 'Austin',
          addressRegion: 'TX',
          addressCountry: 'US',
        },
      },
      providers: [physician],
    };
    const singleSchemas = practiceHomepageSchemas(single);
    expect(singleSchemas.map((schema) => [schema['@type']].flat())).toEqual([
      ['Person', 'Physician'],
      ['MedicalClinic'],
    ]);
    expect(providerEntityId(single, physician)).toBe(
      'https://example.com/#physician',
    );

    const assistant = {
      ...physician,
      slug: 'alex-smith',
      name: 'Alex Smith',
      credentials: 'PA-C',
      specialty: 'Psychiatric Physician Assistant',
    };
    const multi = { ...single, providers: [physician, assistant] };
    const multiSchemas = practiceHomepageSchemas(multi);
    const clinic = multiSchemas[0];
    expect(clinic['@type']).toBe('MedicalClinic');
    expect(clinic.member).toEqual([
      { '@id': 'https://example.com/#physician-jane-doe' },
      { '@id': 'https://example.com/#provider-alex-smith' },
    ]);
    expect(providerEntityType(assistant)).toEqual(['Person']);
  });

  test('@astro-foundation resolves single and multi-physician page images', () => {
    const provider = {
      name: 'Dr. Single Provider',
      image: './images/providers/single.webp',
      imageAlt: 'Dr. Single Provider in Austin, Texas',
    };
    const baseConfig = {
      seo: {
        title: 'Example Practice',
        description: 'Example practice description.',
        siteUrl: 'https://example.com',
      },
      hero: {
        image: './images/hero/practice.webp',
        imageAlt: 'Example Practice office',
      },
      practice: { name: 'Example Practice' },
      providers: [provider],
    };

    expect(homepageImageMetadata(baseConfig)).toEqual({
      image: provider.image,
      imageAlt: provider.imageAlt,
    });
    expect(socialMetadata(baseConfig).image).toBe(
      'https://example.com/images/providers/single.webp',
    );

    const multiProvider = {
      ...baseConfig,
      providers: [
        provider,
        {
          name: 'Dr. Second Provider',
          image: './images/providers/second.webp',
          imageAlt: 'Dr. Second Provider in Austin, Texas',
        },
      ],
    };
    expect(homepageImageMetadata(multiProvider)).toEqual({
      image: multiProvider.hero.image,
      imageAlt: multiProvider.hero.imageAlt,
    });

    const explicitHomepage = {
      ...multiProvider,
      seo: {
        ...multiProvider.seo,
        ogImage: './images/practice/team.webp',
        ogImageAlt: 'The Example Practice care team',
      },
    };
    expect(homepageImageMetadata(explicitHomepage)).toEqual({
      image: './images/practice/team.webp',
      imageAlt: 'The Example Practice care team',
    });

    const providerOverride = {
      ...provider,
      seo: {
        ogImage: './images/providers/single-social.webp',
        ogImageAlt: 'Dr. Single Provider portrait',
      },
    };
    expect(providerImageMetadata(providerOverride)).toEqual({
      image: providerOverride.seo.ogImage,
      imageAlt: providerOverride.seo.ogImageAlt,
    });

    const social = socialMetadata(baseConfig);
    expect(webPageSchema(social, 'https://example.com/#clinic')).toMatchObject({
      '@type': 'WebPage',
      primaryImageOfPage: social.image,
      mainEntity: { '@id': 'https://example.com/#clinic' },
    });
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

  test('@astro-foundation scopes Google Places validation for targeted builds', async () => {
    mkdirSync(path.join(repoRoot, '.tmp'), { recursive: true });
    const fixtureRoot = mkdtempSync(
      path.join(repoRoot, '.tmp', 'google-places-scope-'),
    );

    try {
      mkdirSync(path.join(fixtureRoot, 'places-worker'), { recursive: true });
      mkdirSync(path.join(fixtureRoot, 'sites', 'selected-practice'), {
        recursive: true,
      });
      mkdirSync(path.join(fixtureRoot, 'sites', 'unrelated-practice'), {
        recursive: true,
      });
      writeFileSync(
        path.join(fixtureRoot, 'places-worker', 'wrangler.toml'),
        [
          'ALLOWED_ORIGINS = "https://frontdoor.health,https://selected.example"',
          "PRACTICE_PLACE_IDS = '{\"selected-practice\":\"selected-place-id\"}'",
          '',
        ].join('\n'),
      );
      writeFileSync(
        path.join(fixtureRoot, 'sites', 'selected-practice', 'practice.json'),
        JSON.stringify({
          practice: { slug: 'selected-practice' },
          location: {
            googleReviewSummary: { placeId: 'selected-place-id' },
          },
          seo: { siteUrl: 'https://selected.example' },
        }),
      );
      writeFileSync(
        path.join(fixtureRoot, 'sites', 'unrelated-practice', 'practice.json'),
        '{ invalid json',
      );

      await expect(
        validateGooglePlacesConfiguration(fixtureRoot, {
          practiceIds: ['selected-practice'],
        }),
      ).resolves.toEqual([['selected-practice', 'selected-place-id']]);
      await expect(
        validateGooglePlacesConfiguration(fixtureRoot),
      ).rejects.toThrow();
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
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
