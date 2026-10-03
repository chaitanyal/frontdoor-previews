import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { hasProviderDirectory, homepageProviders } from '../../src/lib/provider-team.mjs';
import { practiceHomepageSchemas, providerDirectorySchemas, providerProfile, providerBreadcrumbSchema } from '../../src/lib/practice-view.mjs';
import { practiceLlms } from '../../src/lib/practice-production.mjs';
import { previewProviderDirectoryPaths } from '../../src/lib/preview-paths.mjs';

const centex = JSON.parse(readFileSync('sites/centexmh/practice.json', 'utf8'));

test('portrait focal coordinates accept percentages and reject incomplete or unsafe values', () => {
  const python = 'import json,sys; from pathlib import Path; from scripts.validate_practice_json import validate_practice_config; validate_practice_config(json.load(sys.stdin), Path("sites/centexmh/practice.json"))';
  for (const [position, valid] of [
    [{ x: 50, y: 20 }, true], [{ x: 0, y: 100 }, true],
    [{ x: -1, y: 20 }, false], [{ x: 50, y: 101 }, false],
    [{ x: true, y: 20 }, false], [{ x: '50%; color:red', y: 20 }, false],
    [{ x: 50 }, false],
  ]) {
    const config = structuredClone(centex);
    config.providers[0].imagePosition = position;
    const result = spawnSync('python3', ['-c', python], { input: JSON.stringify(config), encoding: 'utf8' });
    assert.equal(result.status === 0, valid, result.stderr);
  }
});

test('homepage selection retains all directory members and stable profile identities', () => {
  assert.deepEqual(homepageProviders(centex).map(p => p.slug), ['michael-musgrove', 'julie-williams', 'emily-morris']);
  const schemas = practiceHomepageSchemas(centex);
  assert.equal(schemas.filter(s => [s['@type']].flat().includes('Person')).length, 3);
  assert.equal(practiceHomepageSchemas({ ...centex, home: { ...centex.home, featuredProviderSlugs: ['julie-williams'] } })[0]['@type'], 'MedicalClinic');
  const directory = providerDirectorySchemas(centex)[0];
  assert.equal(directory.numberOfItems, 7);
  assert.deepEqual(directory.itemListElement.map(item => item.item.url), centex.providers.map(p => `https://frontdoor.health/previews/centexmh/providers/${p.slug}/`));
  for (const count of [1, 3, 7, 25]) {
    const config = { providers: Array.from({ length: count }, (_, i) => ({ slug: `provider-${i}` })) };
    assert.equal(hasProviderDirectory(config), count >= 5);
    assert.equal(homepageProviders(config).length, count);
  }
  assert.equal(hasProviderDirectory({ providers: centex.providers, providerDirectory: false }), false);
});

test('provider selection validation rejects missing, duplicate, and inaccessible choices', () => {
  const python = 'import json,sys; from pathlib import Path; from scripts.validate_practice_json import validate_practice_config; validate_practice_config(json.load(sys.stdin), Path("sites/centexmh/practice.json"))';
  for (const [slugs, directory, error] of [
    [['missing'], true, 'reference existing providers'],
    [['julie-williams', 'julie-williams'], true, 'duplicates'],
    [[], true, 'at least 1'],
    [['julie-williams'], false, 'enabled provider directory'],
  ]) {
    const config = { ...centex, providerDirectory: directory, home: { ...centex.home, featuredProviderSlugs: slugs } };
    const result = spawnSync('python3', ['-c', python], { input: JSON.stringify(config), encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(error), result.stderr);
  }
});

test('PA labels and availability stay evidence-bound without trust overrides', () => {
  const provider = { ...centex.providers[1] };
  delete provider.heroTrustItems;
  const profile = providerProfile({ ...centex, providerProfileLabels: {} }, provider);
  assert.equal(profile.labels.howProviderHelps, 'How Julie Williams helps');
  assert.ok(!profile.trustItems.includes('Accepting New Patients'));
  assert.ok(!profile.trustItems.includes('Board Certified Psychiatrist'));
  assert.equal(profile.schema.isAcceptingNewPatients, undefined);
  assert.equal(providerProfile(centex, { ...provider, acceptsNewPatients: true }).schema.isAcceptingNewPatients, true);
});

test('directory routes and machine-readable links follow directory enablement', async () => {
  const previous = process.env.FRONTDOOR_ASTRO_PRACTICE_IDS;
  process.env.FRONTDOOR_ASTRO_PRACTICE_IDS = JSON.stringify(['centexmh', 'drdronavalli']);
  try {
    assert.deepEqual((await previewProviderDirectoryPaths(process.cwd())).map(path => path.params), [{ practice: 'centexmh', directory: 'providers' }]);
    assert.ok(practiceLlms(centex, 'https://example.com').includes('[Provider directory](https://example.com/providers/)'));
    const solo = JSON.parse(readFileSync('sites/drdronavalli/practice.json'));
    assert.ok(!practiceLlms(solo, 'https://example.com').includes('[Provider directory]'));
    assert.equal(providerBreadcrumbSchema(solo, solo.providers[0]).itemListElement[1].item, 'https://drdronavalli.com/#providers');
  } finally {
    if (previous === undefined) delete process.env.FRONTDOOR_ASTRO_PRACTICE_IDS;
    else process.env.FRONTDOOR_ASTRO_PRACTICE_IDS = previous;
  }
});

test('retiring a featured provider validates the adjusted selection without changing the roster in dry-run mode', () => {
  const before = readFileSync('sites/centexmh/practice.json', 'utf8');
  for (const slug of centex.home.featuredProviderSlugs) {
    const result = spawnSync(process.execPath, ['scripts/manage_practice.mjs', 'provider-retire', 'centexmh', slug, '--dry-run'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(`Would retire provider ${slug}`));
  }
  assert.equal(readFileSync('sites/centexmh/practice.json', 'utf8'), before);
});
