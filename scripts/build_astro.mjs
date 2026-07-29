import { existsSync } from 'node:fs';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  listEligiblePreviewSlugs,
  loadPracticeData,
} from '../src/lib/practice-data.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.env.FRONTDOOR_TARGET ?? '';
const siteId = process.env.SITE_ID ?? '';
const validTargets = new Set(['marketing', 'practice', 'preview']);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
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

if (target === 'marketing') {
  if (siteId) {
    fail('SITE_ID is not used for marketing builds.');
  }
  site = 'https://frontdoor.health';
} else if (target === 'practice') {
  if (!siteId) {
    fail('SITE_ID is required for practice builds.');
  }
  if (siteId === 'ALL') {
    fail('SITE_ID=ALL is only valid for preview builds.');
  }

  const { config: practice } = await readPractice(siteId);
  site = practice.seo?.siteUrl?.replace(/\/+$/, '');
  if (!site) {
    fail(`seo.siteUrl is required in sites/${siteId}/practice.json.`);
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
const outDir = path.join(repoRoot, '.tmp', 'astro-dist', target);
const proofAssetDir = path.join(publicDir, 'assets', 'astro-migration');
const sharedRuntimeDir = path.join(publicDir, 'shared');

await rm(publicDir, { recursive: true, force: true });
await rm(outDir, { recursive: true, force: true });
await mkdir(proofAssetDir, { recursive: true });
await mkdir(sharedRuntimeDir, { recursive: true });
await cp(
  path.join(repoRoot, 'shared', 'frontdoor-health-logo.svg'),
  path.join(proofAssetDir, 'frontdoor-health-logo.svg'),
);
for (const runtimeFile of ['analytics.js', 'attribution.js', 'google-ads.js']) {
  await cp(
    path.join(repoRoot, 'shared', runtimeFile),
    path.join(sharedRuntimeDir, runtimeFile),
  );
}

for (const practiceId of practiceIds) {
  const destinationRoot =
    target === 'preview'
      ? path.join(publicDir, 'previews', practiceId)
      : publicDir;
  for (const assetDirectory of ['assets', 'images']) {
    const source = path.join(repoRoot, 'sites', practiceId, assetDirectory);
    if (!existsSync(source)) continue;
    await cp(source, path.join(destinationRoot, assetDirectory), { recursive: true });
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

console.log(`Astro ${target} output: ${path.relative(repoRoot, outDir)}`);
