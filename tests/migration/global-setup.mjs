import { spawnSync } from 'node:child_process';
import { captureLegacyContracts } from '../../scripts/migration/capture_legacy_contracts.mjs';

function runAstroBuild(script, siteId) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const env = { ...process.env };
  delete env.FRONTDOOR_TARGET;
  delete env.SITE_ID;
  if (siteId) env.SITE_ID = siteId;

  const result = spawnSync(npmCommand, ['run', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env,
  });
  if (result.status !== 0) {
    throw new Error(`${script} failed:\n${result.stdout}\n${result.stderr}`);
  }
}

export default function globalSetup() {
  if (process.env.FRONTDOOR_MIGRATION_TARGET === 'astro') {
    runAstroBuild('build:astro:marketing');
    if (process.env.FRONTDOOR_MIGRATION_SCOPE === 'marketing') return;
    runAstroBuild('build:astro:practice', 'drdronavalli');
    runAstroBuild('build:astro:preview', 'northhillspsychiatry');
    return;
  }
  captureLegacyContracts({ update: false });
}
