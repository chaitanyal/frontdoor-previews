#!/usr/bin/env node
/** Validate the deliberately broad Pages policy; never reuse local check routing as deployment routing. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const policy = JSON.parse(readFileSync('docs/deployment/cloudflare/build-watch-policy.json', 'utf8'));
assert.deepEqual(policy.path_includes, ['*'], 'Unknown/new inputs must trigger builds');
assert.deepEqual(policy.path_excludes, ['docs/*', 'assessments/*'], 'Only audited documentation/research trees may be excluded');
assert.equal(policy.build_caching, true);
const excluded = file => file.startsWith('docs/') || file.startsWith('assessments/');
// Cloudflare treats * as matching path separators; empty/large pushes bypass matching.
function triggers(files, commits = 1) {
  return !files.length || files.length >= 3000 || commits >= 20 || files.some(file => !excluded(file));
}
const cases = [
  [['docs/buildimprovement.md'], false],
  [['docs/deployment/cloudflare/nested/file.md', 'assessments/centexmh/sources/page.png'], false],
  [['assessments/new-clinic/assessment.md'], false],
  [['docs/plan.md', 'sites/centexmh/practice.json'], true],
  [['sites/drdronavalli/images/hero/new.webp'], true],
  [['src/content/new-page.md'], true],
  [['sites/centexmh/assets/instructions.md'], true],
  [['src/components/practice/ProviderCard.astro'], true],
  [['shared/styles/frontdoor.css', 'shared/fonts/new.woff2'], true],
  [['package-lock.json', 'astro.config.mjs', 'wrangler.toml'], true],
  [['functions/api/preview-request.js', 'analytics-worker/wrangler.toml', 'places-worker/wrangler.toml'], true],
  [['tests/verification/contracts/marketing.json'], true],
  [['README.md', 'AGENTS.md'], true],
  [['unknown-new-subsystem/new.file'], true],
  // git --no-renames supplies both old and new paths, including removed inputs.
  [['src/removed.astro', 'assessments/archived/removed.astro'], true],
  [[], true],
];
for (const project of Object.keys(policy.projects)) {
  for (const [files, expected] of cases) assert.equal(triggers(files), expected, `${project}: ${files}`);
  assert.equal(triggers(['docs/plan.md'], 20), true);
  assert.equal(triggers(Array.from({ length: 3000 }, (_, i) => `docs/${i}.md`)), true);
}
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const protectedFiles = tracked.filter(file => /^(?:src|sites|shared|marketing|scripts|functions|analytics-worker|places-worker|tests)\//.test(file));
for (const file of protectedFiles) assert.equal(triggers([file]), true, `Build/check input excluded: ${file}`);
// Audit configured local image/file references. Evidence links are not build assets.
for (const file of tracked.filter(file => /^sites\/[^/]+\/practice\.json$/.test(file))) {
  const config = JSON.parse(readFileSync(file, 'utf8'));
  function visit(value, key = '') {
    if (Array.isArray(value)) return value.forEach(item => visit(item, key));
    if (value && typeof value === 'object') return Object.entries(value).forEach(([key, item]) => visit(item, key));
    if (typeof value === 'string' && /(?:image|portrait|file|logo|src|href|url)$/i.test(key)) {
      assert.ok(!/(?:^|\/)\.{0,2}\/?(?:docs|assessments)\//.test(value), `${file}: publishable ${key} references excluded evidence: ${value}`);
    }
  }
  visit(config);
}
const commits = execFileSync('git', ['log', '-80', '--format=%H'], { encoding: 'utf8' }).trim().split('\n');
let skipped = 0;
for (const commit of commits) {
  const files = execFileSync('git', ['diff-tree', '--root', '-m', '--no-commit-id', '--no-renames', '--name-only', '-r', '-z', commit], { encoding: 'utf8' }).split('\0').filter(Boolean);
  if (!triggers(files)) {
    assert.ok(files.every(excluded));
    skipped++;
  }
}
console.log(`Pages policy passed: ${Object.keys(policy.projects).length} projects, ${cases.length + 2} cases each, ${protectedFiles.length} protected tracked paths. ${skipped}/${commits.length} historical commits contain only excluded paths.`);
console.log('This validates path selection, not future arbitrary build dependencies or live Git push behavior.');
