import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { hasProviderDirectory, homepageProviders } from '../../src/lib/provider-team.mjs';
import { practiceHomepageSchemas, providerDirectorySchemas, providerProfile, providerBreadcrumbSchema, providerIdentityLine, providerEntityType } from '../../src/lib/practice-view.mjs';
import { practiceLlms } from '../../src/lib/practice-production.mjs';
import { previewProviderDirectoryPaths } from '../../src/lib/preview-paths.mjs';

const centex = JSON.parse(readFileSync('sites/centexmh/practice.json', 'utf8'));

test('professional identity distinguishes doctoral clinicians, PAs, NPs, and physicians', () => {
  for (const [provider, identity, types] of [
    [{ name: 'Dr. Example Psychologist', credentials: 'PhD', specialty: 'Clinical Psychologist' }, 'PhD · Clinical Psychologist', ['Person']],
    [{ name: 'Example PA', credentials: 'MPAM, PA-C, CAQ', specialty: 'Physician Assistant · Psychiatry' }, 'Certified Physician Assistant', ['Person']],
    [{ name: 'Dr. Example NP', credentials: 'DNP, APRN, PMHNP-BC', specialty: 'Adult Psychiatry' }, 'Nurse Practitioner', ['Person']],
    [{ name: 'Example Nurse', credentials: 'APRN', specialty: 'Advanced Practice Registered Nurse' }, 'APRN · Advanced Practice Registered Nurse', ['Person']],
    [{ name: 'Dr. Example Physician', credentials: 'DO', specialty: 'Psychiatry' }, 'DO', ['Person', 'Physician']],
  ]) {
    assert.equal(providerIdentityLine(provider), identity);
    assert.deepEqual(providerEntityType(provider), types);
  }
});

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
  const fixture = {
    ...centex,
    seo: { ...centex.seo, siteUrl: 'https://example.com' },
    providers: ['alpha', 'bravo', 'charlie'].map(slug => ({ ...centex.providers[0], slug, name: `Dr. ${slug}`, credentials: 'MD' })),
    home: { featuredProviderSlugs: ['charlie', 'alpha'] },
    providerDirectory: true,
  };
  assert.deepEqual(homepageProviders(fixture).map(p => p.slug), ['charlie', 'alpha']);
  const schemas = practiceHomepageSchemas(fixture);
  assert.equal(schemas.filter(s => [s['@type']].flat().includes('Person')).length, 2);
  assert.equal(practiceHomepageSchemas({ ...fixture, home: { featuredProviderSlugs: ['bravo'] } })[0]['@type'], 'MedicalClinic');
  const directory = providerDirectorySchemas(fixture)[0];
  assert.equal(directory.numberOfItems, 3);
  assert.deepEqual(directory.itemListElement.map(item => item.item.url), ['alpha', 'bravo', 'charlie'].map(slug => `https://example.com/providers/${slug}/`));
  for (const count of [1, 3, 7, 25]) {
    const config = { providers: Array.from({ length: count }, (_, i) => ({ slug: `provider-${i}` })) };
    assert.equal(hasProviderDirectory(config), count >= 5);
    assert.equal(homepageProviders(config).length, count);
  }
  assert.equal(hasProviderDirectory({ providers: centex.providers, providerDirectory: false }), false);
});

test('provider selection validation rejects missing, duplicate, and inaccessible choices', () => {
  const fixture = { ...centex, providers: ['alpha', 'bravo'].map(slug => ({ ...centex.providers[0], slug })) };
  const selected = 'alpha';
  const python = 'import json,sys; from pathlib import Path; from scripts.validate_practice_json import validate_practice_config; validate_practice_config(json.load(sys.stdin), Path("sites/centexmh/practice.json"))';
  for (const [slugs, directory, error] of [
    [['missing'], true, 'reference existing providers'],
    [[selected, selected], true, 'duplicates'],
    [[], true, 'at least 1'],
    [[selected], false, 'enabled provider directory'],
  ]) {
    const config = { ...fixture, providerDirectory: directory, home: { featuredProviderSlugs: slugs } };
    const result = spawnSync('python3', ['-c', python], { input: JSON.stringify(config), encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(error), result.stderr);
  }
});

test('PA labels and availability stay evidence-bound without trust overrides', () => {
  const provider = { slug: 'example-pa', name: 'Example PA', credentials: 'PA-C', specialty: 'Physician Assistant · Psychiatry' };
  const profile = providerProfile({ ...centex, providerProfileLabels: {} }, provider);
  assert.equal(profile.labels.howProviderHelps, 'How Example PA helps');
  assert.ok(!profile.trustItems.includes('Accepting New Patients'));
  assert.ok(!profile.trustItems.includes('Board Certified Psychiatrist'));
  assert.equal(profile.schema.isAcceptingNewPatients, undefined);
  assert.equal(providerProfile(centex, { ...provider, acceptsNewPatients: true }).schema.isAcceptingNewPatients, true);
});

test('directory routes and machine-readable links follow directory enablement', async () => {
  const previous = process.env.FRONTDOOR_ASTRO_PRACTICE_IDS;
  process.env.FRONTDOOR_ASTRO_PRACTICE_IDS = JSON.stringify(['centexmh', 'drdronavalli']);
  try {
    const solo = JSON.parse(readFileSync('sites/drdronavalli/practice.json'));
    const configs = [centex, solo];
    const directoryEnabled = config => config.providerDirectory ?? config.providers.length >= 5;
    assert.deepEqual((await previewProviderDirectoryPaths(process.cwd())).map(path => path.params),
      configs.filter(directoryEnabled).map(config => ({ practice: config.practice.slug, directory: 'providers' })));
    for (const config of configs) assert.equal(practiceLlms(config, 'https://example.com').includes('[Provider directory](https://example.com/providers/)'), directoryEnabled(config));
    const baseUrl = solo.seo.siteUrl.replace(/\/$/, '');
    assert.equal(providerBreadcrumbSchema(solo, solo.providers[0]).itemListElement[1].item, `${baseUrl}/${directoryEnabled(solo) ? 'providers/' : '#providers'}`);
  } finally {
    if (previous === undefined) delete process.env.FRONTDOOR_ASTRO_PRACTICE_IDS;
    else process.env.FRONTDOOR_ASTRO_PRACTICE_IDS = previous;
  }
});

test('retiring a featured provider validates the adjusted selection without changing the roster in dry-run mode', () => {
  const before = readFileSync('sites/centexmh/practice.json', 'utf8');
  const featuredSlugs = centex.home?.featuredProviderSlugs || [];
  assert.ok(featuredSlugs.length, 'The retirement pilot must define featured providers');
  for (const slug of featuredSlugs) {
    const result = spawnSync(process.execPath, ['scripts/manage_practice.mjs', 'provider-retire', 'centexmh', slug, '--dry-run'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(`Would retire provider ${slug}`));
  }
  assert.equal(readFileSync('sites/centexmh/practice.json', 'utf8'), before);
});

test('restoring a retired provider removes only that profile’s redirects and respects dry-run', () => {
  mkdirSync('.tmp', { recursive: true });
  const root = mkdtempSync(path.resolve('.tmp/provider-return-'));
  try {
    cpSync('sites/centexmh', path.join(root, 'sites/audit'), { recursive: true });
    cpSync('shared', path.join(root, 'shared'), { recursive: true });
    mkdirSync(path.join(root, 'scripts'));
    cpSync('scripts/validate_practice_json.py', path.join(root, 'scripts/validate_practice_json.py'));
    const config = structuredClone(centex);
    config.seo.allowIndexing = true;
    const provider = config.providers[0];
    const configPath = path.join(root, 'sites/audit/practice.json');
    const redirectsPath = path.join(root, 'sites/audit/_redirects');
    const unrelated = '# Keep other routes\n/old /#contact 302\n/providers/another-provider /#providers 301\n';
    writeFileSync(configPath, JSON.stringify(config));
    writeFileSync(redirectsPath, unrelated);
    writeFileSync(path.join(root, 'returning.json'), JSON.stringify(provider));
    const run = (...args) => {
      const result = spawnSync(process.execPath, [path.resolve('scripts/manage_practice.mjs'), ...args], { cwd: root, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    };
    run('provider-retire', 'audit', provider.slug);
    const retired = readFileSync(configPath, 'utf8');
    const redirects = readFileSync(redirectsPath, 'utf8');
    assert.ok(redirects.includes(`/providers/${provider.slug} /providers/ 301`));
    assert.ok(redirects.includes(`/providers/${provider.slug}/ /providers/ 301`));
    run('provider-add', 'audit', 'returning.json', '--dry-run');
    assert.equal(readFileSync(configPath, 'utf8'), retired);
    assert.equal(readFileSync(redirectsPath, 'utf8'), redirects);
    run('provider-add', 'audit', 'returning.json');
    assert.ok(JSON.parse(readFileSync(configPath, 'utf8')).providers.some(item => item.slug === provider.slug));
    assert.equal(readFileSync(redirectsPath, 'utf8'), unrelated);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
