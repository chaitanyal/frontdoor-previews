import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.env.FRONTDOOR_TARGET ?? '';
const siteId = process.env.SITE_ID ?? '';
const validTargets = new Set(['marketing', 'practice', 'preview']);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function practicePath(practiceId) {
  return path.join(repoRoot, 'sites', practiceId);
}

async function readPractice(practiceId) {
  const practiceDir = practicePath(practiceId);
  const configPath = path.join(practiceDir, 'practice.json');

  if (!existsSync(practiceDir)) {
    fail(`Unknown SITE_ID: ${practiceId}`);
  }
  if (!existsSync(configPath)) {
    fail(`Missing sites/${practiceId}/practice.json`);
  }

  const validation = spawnSync(
    'python3',
    [path.join(repoRoot, 'scripts', 'validate_practice_json.py'), configPath],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  if (validation.status !== 0) {
    process.stderr.write(validation.stderr);
    fail(`Invalid sites/${practiceId}/practice.json`);
  }

  return JSON.parse(await readFile(configPath, 'utf8'));
}

async function eligiblePreviewIds() {
  const entries = await readdir(path.join(repoRoot, 'sites'), { withFileTypes: true });
  const ids = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name === 'template') {
      continue;
    }
    const practice = await readPractice(entry.name);
    if (practice.seo?.allowIndexing === false) {
      ids.push(entry.name);
    }
  }

  if (ids.length === 0) {
    fail('Preview build found no sites with seo.allowIndexing=false.');
  }
  return ids;
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

  const practice = await readPractice(siteId);
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
    practiceIds = await eligiblePreviewIds();
  } else {
    const practice = await readPractice(siteId);
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

await rm(publicDir, { recursive: true, force: true });
await rm(outDir, { recursive: true, force: true });
await mkdir(proofAssetDir, { recursive: true });
await cp(
  path.join(repoRoot, 'shared', 'frontdoor-health-logo.svg'),
  path.join(proofAssetDir, 'frontdoor-health-logo.svg'),
);

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
