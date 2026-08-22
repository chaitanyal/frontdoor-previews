import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const marketingCss = path.join(
  repoRoot,
  '.tmp',
  'playwright-fixtures',
  'marketing.css',
);

function run(command, args, environment = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...environment },
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
}

function runAstroBuild(script, siteId) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(npmCommand, ['run', script], {
    FRONTDOOR_TARGET: '',
    SITE_ID: siteId || '',
  });
}

function compileMarketingTestCss() {
  mkdirSync(path.dirname(marketingCss), { recursive: true });
  const executable = path.join(
    repoRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tailwindcss.cmd' : 'tailwindcss',
  );
  run(
    executable,
    [
      '-c',
      'tests/migration/fixtures/marketing-tailwind.config.cjs',
      '-i',
      'tests/migration/fixtures/marketing-tailwind-input.css',
      '-o',
      marketingCss,
      '--minify',
    ],
    { BROWSERSLIST_IGNORE_OLD_DATA: 'true' },
  );
}

export default function globalSetup() {
  if (process.env.FRONTDOOR_STAGING === '1') return;
  const scope = process.env.FRONTDOOR_MIGRATION_SCOPE;
  if (!scope || scope === 'marketing') {
    runAstroBuild('build:astro:marketing');
    compileMarketingTestCss();
  }
  if (scope === 'marketing') return;
  runAstroBuild(
    'build:astro:practice',
    process.env.FRONTDOOR_MIGRATION_SITE || 'drdronavalli',
  );
  if (scope === 'practice') return;
  runAstroBuild('build:astro:preview', 'northhillspsychiatry');
}
