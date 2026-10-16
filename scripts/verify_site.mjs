#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { affectsMarketing } from './verification/change-plan.mjs';
import { command, ensureBuild, fingerprint, recordCheck, reusableCheck, timed } from './verification/state.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const site = args.find((argument) => !argument.startsWith('--'));
const updateContract = args.includes('--update-contract');
const fresh = args.includes('--fresh');

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!site || !/^[a-z0-9-]+$/.test(site)) {
  fail('Usage: npm run verify:site -- <site> [--update-contract]');
}

const configPath = path.join('sites', site, 'practice.json');
if (!existsSync(path.join(ROOT, configPath))) {
  fail(`Unknown practice: ${site}`);
}

if (!updateContract && !fresh && reusableCheck(`site:${site}`)) {
  ensureBuild('practice', site);
  console.log(`Reusing verified checks: site:${site}`);
  process.exit(0);
}
const input = fingerprint();
const artifacts = [];
artifacts.push(ensureBuild('practice', site, { fresh }).name);
timed('practice contract', () => command(process.execPath, [
  'scripts/verification/verify_output_contracts.mjs',
  updateContract ? '--update' : '--check', '--scope=practice', `--site=${site}`,
], { stdio: 'inherit' }));

const marketingConfig = JSON.parse(
  readFileSync(path.join(ROOT, 'marketing', 'marketing.json'), 'utf8'),
);
const config = JSON.parse(readFileSync(path.join(ROOT, configPath), 'utf8'));
const previousResult = spawnSync('git', ['show', `HEAD:${configPath}`], { cwd: ROOT, encoding: 'utf8' });
const previous = previousResult.status === 0 ? JSON.parse(previousResult.stdout) : {};
if (affectsMarketing(site, config, marketingConfig.featuredPractice, previous)) {
  process.stdout.write(`\n${site} is published in marketing; verifying that dependent target.\n`);
  artifacts.push(ensureBuild('marketing', '', { fresh }).name);
  command(process.execPath, [
    'scripts/verification/verify_output_contracts.mjs',
    updateContract ? '--update' : '--check',
    '--scope=marketing',
  ], { stdio: 'inherit' });
}

if (!updateContract) recordCheck(`site:${site}`, artifacts, input);
process.stdout.write(`\nVerified practice: ${site}\n`);
