#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function parseLiteralVariable(toml, name) {
  const match = toml.match(new RegExp(`^${name}\\s*=\\s*'([^']*)'\\s*$`, 'm'));
  if (!match) throw new Error(`places-worker/wrangler.toml must define ${name} as a TOML literal string.`);
  return match[1];
}

function parseStringVariable(toml, name) {
  const match = toml.match(new RegExp(`^${name}\\s*=\\s*"([^"]*)"\\s*$`, 'm'));
  if (!match) throw new Error(`places-worker/wrangler.toml must define ${name}.`);
  return match[1];
}

export async function validateGooglePlacesConfiguration(
  repoRoot = defaultRepoRoot,
  { practiceIds } = {},
) {
  const selectedPracticeIds = practiceIds ? new Set(practiceIds) : null;
  const workerConfigPath = path.join(repoRoot, 'places-worker', 'wrangler.toml');
  const workerConfig = await readFile(workerConfigPath, 'utf8');
  let workerPlaces;
  try {
    workerPlaces = JSON.parse(
      parseLiteralVariable(workerConfig, 'PRACTICE_PLACE_IDS'),
    );
  } catch (error) {
    throw new Error(`PRACTICE_PLACE_IDS must be valid JSON: ${error.message}`);
  }

  if (!workerPlaces || typeof workerPlaces !== 'object' || Array.isArray(workerPlaces)) {
    throw new Error('PRACTICE_PLACE_IDS must be a JSON object.');
  }

  const allowedOrigins = new Set(
    parseStringVariable(workerConfig, 'ALLOWED_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  const expectedPlaces = new Map();
  const sitesRoot = path.join(repoRoot, 'sites');
  const entries = await readdir(sitesRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'template') continue;
    if (selectedPracticeIds && !selectedPracticeIds.has(entry.name)) continue;
    const configPath = path.join(sitesRoot, entry.name, 'practice.json');
    if (!existsSync(configPath)) continue;
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    const integration = config.location?.googleReviewSummary;
    if (!integration) continue;

    expectedPlaces.set(config.practice.slug, integration.placeId);
    const productionOrigin = new URL(config.seo.siteUrl).origin;
    if (!allowedOrigins.has(productionOrigin)) {
      throw new Error(
        `ALLOWED_ORIGINS is missing ${productionOrigin} for ${config.practice.slug}.`,
      );
    }
  }

  if (!allowedOrigins.has('https://frontdoor.health')) {
    throw new Error('ALLOWED_ORIGINS must include https://frontdoor.health for previews.');
  }

  const workerEntries = Object.entries(workerPlaces)
    .filter(([practiceId]) =>
      selectedPracticeIds ? selectedPracticeIds.has(practiceId) : true,
    )
    .sort(([left], [right]) => left.localeCompare(right));
  const expectedEntries = [...expectedPlaces.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );

  if (JSON.stringify(workerEntries) !== JSON.stringify(expectedEntries)) {
    throw new Error(
      `Google Places mapping drift. practice.json expects ${JSON.stringify(Object.fromEntries(expectedEntries))}; ` +
        `wrangler.toml contains ${JSON.stringify(Object.fromEntries(workerEntries))}.`,
    );
  }

  return expectedEntries;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const entries = await validateGooglePlacesConfiguration();
    console.log(`Google Places configuration valid for ${entries.length} practice(s).`);
  } catch (error) {
    console.error(`Google Places configuration validation failed: ${error.message}`);
    process.exit(1);
  }
}
