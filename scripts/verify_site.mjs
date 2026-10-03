#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { ensureBuild, fingerprint, recordCheck, reusableCheck, timed } from './verification/state.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const site = args.find((argument) => !argument.startsWith('--'));
const updateContract = args.includes('--update-contract');
const fresh = args.includes('--fresh');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, commandArgs, environment = {}) {
  process.stdout.write(`\n> ${command} ${commandArgs.join(' ')}\n`);
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    env: { ...process.env, ...environment },
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status || 1);
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
timed('practice configuration', () => run('python3', ['scripts/validate_practice_json.py', configPath]));
artifacts.push(ensureBuild('practice', site, { fresh }).name);
timed('practice contract', () => run('node', [
  'scripts/verification/verify_output_contracts.mjs',
  updateContract ? '--update' : '--check', '--scope=practice', `--site=${site}`,
]));

const marketingConfig = JSON.parse(
  readFileSync(path.join(ROOT, 'marketing', 'marketing.json'), 'utf8'),
);
if (marketingConfig.featuredPractice === site) {
  process.stdout.write(`\n${site} is the featured marketing practice; verifying that dependent target.\n`);
  artifacts.push(ensureBuild('marketing', '', { fresh }).name);
  run('node', [
    'scripts/verification/verify_output_contracts.mjs',
    updateContract ? '--update' : '--check',
    '--scope=marketing',
  ]);
}

if (!updateContract) recordCheck(`site:${site}`, artifacts, input);
process.stdout.write(`\nVerified practice: ${site}\n`);
