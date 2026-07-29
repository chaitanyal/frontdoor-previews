import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

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
  expect(await page.locator('script').count()).toBe(0);
  expect(await page.locator('astro-island').count()).toBe(0);

  const imageState = await page.locator('img').evaluate((image) => ({
    complete: image.complete,
    naturalWidth: image.naturalWidth,
  }));
  expect(imageState.complete).toBe(true);
  expect(imageState.naturalWidth).toBeGreaterThan(0);
}

test.describe.serial('Milestone 1 Astro foundation', () => {
  test('@astro-foundation builds every target and loads copied assets through file URLs', async ({
    page,
  }) => {
    runNpmBuild('build:astro:marketing');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/marketing/index.html',
      'Marketing Astro build proof',
    );

    runNpmBuild('build:astro:practice', 'drdronavalli');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/practice/index.html',
      'SITE_ID=drdronavalli',
    );

    runNpmBuild('build:astro:preview', 'northhillspsychiatry');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/northhillspsychiatry/index.html',
      'SITE_ID=northhillspsychiatry',
    );

    runNpmBuild('build:astro:preview:all');
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/mariposa/index.html',
      'SITE_ID=mariposa',
    );
    await expectStaticFilePage(
      page,
      '.tmp/astro-dist/preview/previews/northhillspsychiatry/index.html',
      'SITE_ID=northhillspsychiatry',
    );
  });

  test('@astro-foundation rejects invalid target and SITE_ID combinations', () => {
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
