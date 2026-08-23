#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const ROOT = process.cwd();
const [command, site, value, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');

function fail(message) {
  throw new Error(message);
}

function parseJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Unable to read JSON from ${filePath}: ${error.message}`);
  }
}

function sitePaths(siteId) {
  if (!siteId || !/^[a-z0-9-]+$/.test(siteId)) {
    fail('Practice slug must contain only lowercase letters, numbers, and hyphens.');
  }
  const directory = path.join(ROOT, 'sites', siteId);
  const config = path.join(directory, 'practice.json');
  if (!existsSync(config)) fail(`Unknown practice: ${siteId}`);
  return { directory, config };
}

function writeJsonAtomic(filePath, data) {
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(temporaryPath, filePath);
}

function validateCandidate(siteId, candidate) {
  const temporaryDirectory = path.join(ROOT, '.tmp', 'practice-maintenance');
  mkdirSync(temporaryDirectory, { recursive: true });
  const candidatePath = path.join(temporaryDirectory, `${siteId}-${process.pid}.json`);
  writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);
  const result = spawnSync('python3', ['scripts/validate_practice_json.py', candidatePath], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  unlinkSync(candidatePath);
  if (result.status !== 0) {
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    fail('Candidate practice configuration failed validation.');
  }
}

function assertProviderImage(provider, siteDirectory) {
  const image = provider?.image;
  if (typeof image !== 'string' || !image.trim()) fail('Provider image is required.');
  const resolved = path.resolve(siteDirectory, image);
  const sitePrefix = `${path.resolve(siteDirectory)}${path.sep}`;
  if (!resolved.startsWith(sitePrefix)) fail('Provider image must stay inside the practice directory.');
  if (!existsSync(resolved)) fail(`Provider image does not exist: ${image}`);
}

function redirectValue() {
  const argument = flags.find((flag) => flag.startsWith('--redirect='));
  const destination = argument?.slice('--redirect='.length) || '/#providers';
  if (!destination.startsWith('/') && !destination.startsWith('https://')) {
    fail('Redirect destination must be root-relative or an HTTPS URL.');
  }
  if (/\s/.test(destination)) fail('Redirect destination must not contain whitespace.');
  return destination;
}

function addRedirects(siteDirectory, providerSlug, destination) {
  const redirectsPath = path.join(siteDirectory, '_redirects');
  const existing = existsSync(redirectsPath) ? readFileSync(redirectsPath, 'utf8') : '';
  const retained = existing
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => {
      const source = line.trim().split(/\s+/)[0];
      return source !== `/providers/${providerSlug}` && source !== `/providers/${providerSlug}/`;
    });
  retained.push(
    `/providers/${providerSlug} ${destination} 301`,
    `/providers/${providerSlug}/ ${destination} 301`,
  );
  return `${retained.join('\n')}\n`;
}

function providerAdd() {
  if (!value) fail('Usage: npm run provider:add -- <site> <provider-json> [--dry-run]');
  const paths = sitePaths(site);
  const config = parseJson(paths.config);
  const source = parseJson(path.resolve(ROOT, value));
  const provider = source.provider || source;
  if (!provider || Array.isArray(provider) || typeof provider !== 'object') {
    fail('Provider JSON must contain one provider object.');
  }
  if (!/^[a-z0-9-]+$/.test(provider.slug || '')) {
    fail('Provider slug must contain only lowercase letters, numbers, and hyphens.');
  }
  if (config.providers.some((item) => item.slug === provider.slug)) {
    fail(`Provider already exists: ${provider.slug}`);
  }
  if (config.providers.some((item) => item.image === provider.image)) {
    fail(`Provider image is already assigned: ${provider.image}`);
  }
  assertProviderImage(provider, paths.directory);
  const candidate = { ...config, providers: [...config.providers, provider] };
  validateCandidate(site, candidate);
  if (!dryRun) writeJsonAtomic(paths.config, candidate);
  process.stdout.write(`${dryRun ? 'Would add' : 'Added'} provider ${provider.slug} to ${site}.\n`);
  process.stdout.write(`Next: npm run verify:site -- ${site} --update-contract\n`);
}

function providerRetire() {
  if (!value) {
    fail('Usage: npm run provider:retire -- <site> <provider-slug> [--redirect=/#providers] [--dry-run]');
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    fail('Provider slug must contain only lowercase letters, numbers, and hyphens.');
  }
  const paths = sitePaths(site);
  const config = parseJson(paths.config);
  const provider = config.providers.find((item) => item.slug === value);
  if (!provider) fail(`Provider not found: ${value}`);
  if (config.providers.length === 1) {
    fail('Cannot retire the only provider. Add the replacement provider first.');
  }
  const candidate = {
    ...config,
    providers: config.providers.filter((item) => item.slug !== value),
  };
  validateCandidate(site, candidate);
  const destination = redirectValue();
  const redirects = config.seo?.allowIndexing
    ? addRedirects(paths.directory, value, destination)
    : null;
  if (!dryRun) {
    writeJsonAtomic(paths.config, candidate);
    if (redirects !== null) writeFileSync(path.join(paths.directory, '_redirects'), redirects);
  }
  process.stdout.write(`${dryRun ? 'Would retire' : 'Retired'} provider ${value} from ${site}.\n`);
  if (redirects !== null) {
    process.stdout.write(`${dryRun ? 'Would redirect' : 'Redirected'} the retired provider routes to ${destination}.\n`);
  }
  process.stdout.write('The provider image was retained for history and possible reuse.\n');
  process.stdout.write(`Next: npm run verify:site -- ${site} --update-contract\n`);
}

function themeSet() {
  if (!value) fail('Usage: npm run theme:set -- <site> <theme> [--dry-run]');
  const paths = sitePaths(site);
  const themes = parseJson(path.join(ROOT, 'shared', 'themes.json'));
  if (!Object.hasOwn(themes, value)) {
    fail(`Unknown theme: ${value}. Available themes: ${Object.keys(themes).sort().join(', ')}`);
  }
  const config = parseJson(paths.config);
  const previousTheme = config.theme;
  if (previousTheme === value) {
    process.stdout.write(`${site} already uses ${value}; no change needed.\n`);
    return;
  }
  const candidate = { ...config, theme: value };
  validateCandidate(site, candidate);
  if (!dryRun) writeJsonAtomic(paths.config, candidate);
  process.stdout.write(`${dryRun ? 'Would change' : 'Changed'} ${site} theme from ${previousTheme} to ${value}.\n`);
  process.stdout.write(`Next: npm run verify:site -- ${site}\n`);
}

try {
  if (command === 'provider-add') providerAdd();
  else if (command === 'provider-retire') providerRetire();
  else if (command === 'theme-set') themeSet();
  else {
    fail([
      'Usage:',
      '  npm run provider:add -- <site> <provider-json> [--dry-run]',
      '  npm run provider:retire -- <site> <provider-slug> [--redirect=/#providers] [--dry-run]',
      '  npm run theme:set -- <site> <theme> [--dry-run]',
    ].join('\n'));
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
