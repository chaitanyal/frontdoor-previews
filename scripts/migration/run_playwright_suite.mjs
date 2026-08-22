import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const suite = process.argv[2];
const supportedSuites = new Set(['analytics', 'visual']);

if (!supportedSuites.has(suite)) {
  console.error(`ERROR: Unsupported migration Playwright suite: ${suite || '(missing)'}`);
  process.exit(1);
}

let scope = '';
let site = '';
const passthroughArgs = [];
for (const argument of process.argv.slice(3)) {
  if (argument.startsWith('--scope=')) {
    scope = argument.slice('--scope='.length);
  } else if (argument.startsWith('--site=')) {
    site = argument.slice('--site='.length);
  } else {
    passthroughArgs.push(argument);
  }
}
if (scope && !['marketing', 'practice', 'preview'].includes(scope)) {
  console.error(`ERROR: --scope must be marketing, practice, or preview, received: ${scope}`);
  process.exit(1);
}

const playwrightExecutable = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'playwright.cmd' : 'playwright',
);
const result = spawnSync(
  playwrightExecutable,
  [
    'test',
    '--config=playwright.migration.config.mjs',
    '--grep',
    `@${suite}`,
    ...passthroughArgs,
  ],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      FRONTDOOR_MIGRATION_SCOPE: scope,
      FRONTDOOR_MIGRATION_SITE: site,
    },
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(`ERROR: Unable to start Playwright: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
