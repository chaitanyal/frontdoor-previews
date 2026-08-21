import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  listEligiblePreviewSlugs,
  loadPracticeData,
} from '../src/lib/practice-data.mjs';
import { loadMarketingData } from '../src/lib/marketing-data.mjs';
import {
  assertAnalyticsDeploymentAllowed,
  practiceRobots,
  productionSiteUrl,
  standaloneNoindexHeaders,
  validatePracticeOutput,
} from '../src/lib/practice-production.mjs';
import {
  discoverIndexRoutes,
  renderSitemap,
} from '../src/lib/sitemap.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.env.FRONTDOOR_TARGET ?? '';
const siteId = process.env.SITE_ID ?? '';
const deployOutput = process.env.FRONTDOOR_ASTRO_DEPLOY === '1';
const validTargets = new Set(['marketing', 'practice', 'preview']);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function renderPreviewHeaders(practiceSlugs) {
  return practiceSlugs
    .map(
      (practiceSlug) =>
        `/previews/${practiceSlug}/*\n  X-Robots-Tag: noindex, nofollow`,
    )
    .join('\n');
}

async function readPractice(practiceId) {
  try {
    return await loadPracticeData(repoRoot, practiceId);
  } catch (error) {
    if (error.message === `Unknown practice slug: ${practiceId}`) {
      fail(`Unknown SITE_ID: ${practiceId}`);
    }
    fail(error.message);
  }
}

if (!validTargets.has(target)) {
  fail('FRONTDOOR_TARGET is required and must be marketing, practice, or preview.');
}

let site;
let practiceIds = [];
let productionPractice;

if (target === 'marketing') {
  if (siteId) {
    fail('SITE_ID is not used for marketing builds.');
  }
  site = 'https://frontdoor.health';
  practiceIds = await listEligiblePreviewSlugs(repoRoot);
  if (practiceIds.length === 0) {
    fail('Marketing build found no preview sites with seo.allowIndexing=false.');
  }
} else if (target === 'practice') {
  if (!siteId) {
    fail('SITE_ID is required for practice builds.');
  }
  if (siteId === 'ALL') {
    fail('SITE_ID=ALL is only valid for preview builds.');
  }

  const { config: practice } = await readPractice(siteId);
  productionPractice = practice;
  try {
    site = productionSiteUrl(practice, siteId);
    const workerConfig = await readFile(
      path.join(repoRoot, 'worker', 'wrangler.toml'),
      'utf8',
    );
    assertAnalyticsDeploymentAllowed(practice, workerConfig);
  } catch (error) {
    fail(error.message);
  }
  practiceIds = [siteId];
} else {
  if (!siteId) {
    fail('SITE_ID is required for preview builds. Use SITE_ID=ALL for all previews.');
  }

  if (siteId === 'ALL') {
    practiceIds = await listEligiblePreviewSlugs(repoRoot);
    if (practiceIds.length === 0) {
      fail('Preview build found no sites with seo.allowIndexing=false.');
    }
  } else {
    const { config: practice } = await readPractice(siteId);
    if (practice.seo?.allowIndexing !== false) {
      fail(`Preview builds require seo.allowIndexing=false in sites/${siteId}/practice.json.`);
    }
    practiceIds = [siteId];
  }
  site = 'https://frontdoor.health';
}

const publicDir = path.join(repoRoot, '.tmp', 'astro-public', target);
const outDir = deployOutput
  ? path.join(repoRoot, 'dist')
  : path.join(repoRoot, '.tmp', 'astro-dist', target);
const astroOutDir = deployOutput
  ? './dist'
  : `./.tmp/astro-dist/${target}`;
const sharedRuntimeDir = path.join(publicDir, 'shared');
const tailwindExecutable = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tailwindcss.cmd' : 'tailwindcss',
);

await rm(publicDir, { recursive: true, force: true });
await rm(outDir, { recursive: true, force: true });
if (target === 'marketing') {
  const { marketing, practice } = await loadMarketingData(repoRoot);
  await cp(
    path.join(repoRoot, 'marketing', 'assets'),
    path.join(publicDir, 'assets'),
    { recursive: true },
  );
  await cp(
    path.join(repoRoot, 'marketing', 'case-studies', marketing.featuredPractice),
    path.join(publicDir, 'case-studies', marketing.featuredPractice),
    {
      recursive: true,
      filter(source) {
        return !source.endsWith('index.html');
      },
    },
  );

  const heroSource = path.resolve(
    repoRoot,
    'sites',
    marketing.featuredPractice,
    practice.hero.image,
  );
  await mkdir(path.join(publicDir, 'assets', 'featured-practice'), {
    recursive: true,
  });
  await cp(
    heroSource,
    path.join(
      publicDir,
      'assets',
      'featured-practice',
      path.basename(practice.hero.image),
    ),
  );

}
await mkdir(sharedRuntimeDir, { recursive: true });
for (const runtimeFile of ['analytics.js', 'attribution.js', 'google-ads.js']) {
  await cp(
    path.join(repoRoot, 'shared', runtimeFile),
    path.join(sharedRuntimeDir, runtimeFile),
  );
}

for (const practiceId of practiceIds) {
  const destinationRoot =
    target === 'practice'
      ? publicDir
      : path.join(publicDir, 'previews', practiceId);
  await mkdir(path.join(destinationRoot, 'assets'), { recursive: true });

  const cssResult = spawnSync(
    tailwindExecutable,
    [
      '-c',
      'tailwind.config.js',
      '-i',
      './shared/styles/frontdoor.css',
      '-o',
      path.join(destinationRoot, 'assets', 'styles.css'),
      '--minify',
    ],
    {
      cwd: repoRoot,
      env: { ...process.env, BROWSERSLIST_IGNORE_OLD_DATA: 'true' },
      stdio: 'inherit',
    },
  );
  if (cssResult.error) {
    fail(`Unable to start Tailwind CSS: ${cssResult.error.message}`);
  }
  if (cssResult.status !== 0) {
    process.exit(cssResult.status ?? 1);
  }

  for (const assetDirectory of ['assets', 'images']) {
    const source = path.join(repoRoot, 'sites', practiceId, assetDirectory);
    if (!existsSync(source)) continue;
    await cp(source, path.join(destinationRoot, assetDirectory), {
      recursive: true,
      filter(sourcePath) {
        return path.basename(sourcePath) !== '.DS_Store';
      },
    });
  }

  const fontSource = path.join(repoRoot, 'shared', 'fonts');
  if (existsSync(fontSource)) {
    await cp(fontSource, path.join(destinationRoot, 'assets', 'fonts'), {
      recursive: true,
      filter(sourcePath) {
        return path.basename(sourcePath) !== '.DS_Store';
      },
    });
  }

  const redirectsSource = path.join(
    repoRoot,
    'sites',
    practiceId,
    '_redirects',
  );
  if (existsSync(redirectsSource)) {
    await cp(redirectsSource, path.join(destinationRoot, '_redirects'));
  }
}

const astroExecutable = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'astro.cmd' : 'astro',
);
const result = spawnSync(astroExecutable, ['build', '--config', 'astro.config.mjs'], {
  cwd: repoRoot,
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: '1',
    FRONTDOOR_ASTRO_SITE: site,
    FRONTDOOR_ASTRO_OUT_DIR: astroOutDir,
    FRONTDOOR_ASTRO_PRACTICE_IDS: JSON.stringify(practiceIds),
  },
  stdio: 'inherit',
});

if (result.error) {
  fail(`Unable to start Astro: ${result.error.message}`);
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (target === 'marketing') {
  const sitemapRoutes = await discoverIndexRoutes(outDir, {
    excludePrefixes: ['previews/'],
  });
  await writeFile(
    path.join(outDir, 'sitemap.xml'),
    renderSitemap(site, sitemapRoutes),
  );
  await writeFile(
    path.join(outDir, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
  );
  await writeFile(
    path.join(outDir, '_headers'),
    `${renderPreviewHeaders(practiceIds)}\n`,
  );
} else if (target === 'practice') {
  if (productionPractice.seo?.allowIndexing === true) {
    const sitemapRoutes = await discoverIndexRoutes(outDir);
    await writeFile(
      path.join(outDir, 'sitemap.xml'),
      renderSitemap(site, sitemapRoutes),
    );
    await writeFile(
      path.join(outDir, 'robots.txt'),
      practiceRobots(productionPractice, site),
    );
  } else {
    await writeFile(
      path.join(outDir, '_headers'),
      standaloneNoindexHeaders(),
    );
    await writeFile(
      path.join(outDir, 'robots.txt'),
      practiceRobots(productionPractice, site),
    );
  }
  try {
    await validatePracticeOutput(outDir, productionPractice);
  } catch (error) {
    fail(error.message);
  }
} else {
  await writeFile(
    path.join(outDir, '_headers'),
    `${renderPreviewHeaders(practiceIds)}\n`,
  );
  await writeFile(
    path.join(outDir, 'robots.txt'),
    'User-agent: *\nAllow: /\n\nSitemap: https://frontdoor.health/sitemap.xml\n',
  );
}

console.log(`Astro ${target} output: ${path.relative(repoRoot, outDir)}`);
