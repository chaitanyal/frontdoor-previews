#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const suppliedFiles = args
  .filter((argument) => argument.startsWith('--file='))
  .map((argument) => argument.slice('--file='.length));

function fail(message) {
  throw new Error(message);
}

function capture(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) fail(result.stderr || `Command failed: ${command}`);
  return result.stdout;
}

function run(command, commandArgs, environment = {}) {
  process.stdout.write(`> ${command} ${commandArgs.join(' ')}\n`);
  if (dryRun) return;
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    env: { ...process.env, ...environment },
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

function isDocumentation(file) {
  return file.toLowerCase().endsWith('.md');
}

function siteFor(file) {
  return file.match(/^sites\/([^/]+)\//)?.[1] || null;
}

function contractSiteFor(file) {
  return file.match(/^tests\/migration\/contracts\/practice-([a-z0-9-]+)\.json$/)?.[1] || null;
}

function isMarketingOnly(file) {
  return file.startsWith('marketing/') || file.startsWith('src/entries/marketing/');
}

try {
  const files = suppliedFiles.length
    ? suppliedFiles
    : capture('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
        .split(/\r?\n/)
        .filter(Boolean);

  if (!files.length) {
    process.stdout.write('No staged files; skipping pre-commit checks.\n');
    process.exit(0);
  }

  process.stdout.write(`Staged files: ${files.join(', ')}\n`);
  if (files.every(isDocumentation)) {
    process.stdout.write('Documentation-only change; skipping builds.\n');
    process.exit(0);
  }

  const relevantFiles = files.filter((file) => !isDocumentation(file));
  const siteIds = new Set(relevantFiles.map(siteFor).filter(Boolean));
  const contractSiteIds = relevantFiles.map(contractSiteFor).filter(Boolean);
  const siteScoped =
    siteIds.size > 0 &&
    !siteIds.has('template') &&
    relevantFiles.every((file) => {
      const fileSite = siteFor(file);
      const contractSite = contractSiteFor(file);
      return Boolean(fileSite || (contractSite && siteIds.has(contractSite)));
    }) &&
    contractSiteIds.every((siteId) => siteIds.has(siteId));

  if (siteScoped) {
    for (const siteId of [...siteIds].sort()) {
      run('node', ['scripts/verify_site.mjs', siteId]);
    }
    process.exit(0);
  }

  if (relevantFiles.every(isMarketingOnly)) {
    run('npm', ['run', 'build:astro:marketing']);
    run('python3', ['scripts/validate_built_html.py', '.tmp/astro-dist/marketing']);
    run('node', [
      'scripts/migration/verify_output_contracts.mjs',
      '--check',
      '--scope=marketing',
    ]);
    process.exit(0);
  }

  process.stdout.write('Shared or mixed change; running the full output-contract suite.\n');
  run('npm', ['run', 'test:output-contracts']);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
