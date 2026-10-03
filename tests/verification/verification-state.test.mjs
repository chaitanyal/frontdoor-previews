import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { sourceSnapshot, assertIndexMatches } from '../../scripts/verification/state.mjs';
import { passedBrowserSuites } from '../../scripts/verify_change.mjs';
import { checksFor, affectsMarketing } from '../../scripts/verification/change-plan.mjs';

const stateUrl = pathToFileURL(path.resolve('scripts/verification/state.mjs')).href;

function fixture(action) {
  mkdirSync('.tmp', { recursive: true });
  const root = mkdtempSync(path.resolve('.tmp/verification-state-test-'));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  function write(file, text) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), text);
  }
  function evaluate(code, environment = {}) {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `import * as state from ${JSON.stringify(stateUrl)}; ${code}`], {
      cwd: root, env: { ...process.env, ...environment }, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return JSON.parse(result.stdout.trim().split('\n').at(-1));
  }
  try {
    git('init', '-q');
    write('.gitignore', '.tmp/\n.env\n');
    write('src/input.js', 'first');
    write('scripts/build_astro.mjs', `
      import fs from 'node:fs';
      const name = process.env.FRONTDOOR_BUILD_KEY;
      const out = '.tmp/astro-dist/' + name;
      fs.mkdirSync(out, { recursive: true });
      const count = Number(fs.existsSync('.tmp/count') ? fs.readFileSync('.tmp/count') : 0) + 1;
      fs.writeFileSync('.tmp/count', String(count));
      if (fs.readFileSync('src/input.js', 'utf8') === 'FAIL') process.exit(1);
      fs.writeFileSync(out + '/index.html', name + ':' + fs.readFileSync('src/input.js'));
    `);
    git('add', '.');
    return action({ root, git, write, evaluate });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('index guard catches partial staging, untracked inputs, deletion and rename', () => fixture(({ root, git, write }) => {
  assertIndexMatches(root);
  write('docs/notes.md', 'non-build notes');
  assertIndexMatches(root);
  write('src/input.js', 'unstaged version');
  assert.throws(() => assertIndexMatches(root), /Staged verification inputs differ/);
  git('add', 'src/input.js');
  assertIndexMatches(root);
  write('src/new.js', 'new input');
  assert.throws(() => assertIndexMatches(root), /src\/new.js/);
  git('add', 'src/new.js');
  assertIndexMatches(root);
  rmSync(path.join(root, 'src/new.js'));
  assert.throws(() => assertIndexMatches(root), /src\/new.js/);
  git('add', '-A');
  assertIndexMatches(root);
  renameSync(path.join(root, 'src/input.js'), path.join(root, 'src/renamed.js'));
  assert.throws(() => assertIndexMatches(root), /Staged verification inputs differ/);
  git('add', '-A');
  assertIndexMatches(root);
  assert.deepEqual(sourceSnapshot({ root }), sourceSnapshot({ root, index: true }));
}));

test('artifact identities remain isolated and stale, missing or modified outputs rebuild', () => fixture(({ root, write, evaluate }) => {
  assert.equal(evaluate(`state.ensureBuild('practice','one'); state.ensureBuild('practice','one'); console.log(JSON.stringify(Number(state.command('cat',['.tmp/count']))));`), 1);
  assert.equal(evaluate(`state.ensureBuild('practice','two'); state.ensureBuild('practice','one'); console.log(JSON.stringify(Number(state.command('cat',['.tmp/count']))));`), 2);
  assert.equal(readFileSync(path.join(root, '.tmp/astro-dist/practice-one/index.html'), 'utf8'), 'practice-one:first');
  assert.equal(readFileSync(path.join(root, '.tmp/astro-dist/practice-two/index.html'), 'utf8'), 'practice-two:first');
  write('.tmp/astro-dist/practice-one/index.html', 'tampered');
  assert.equal(evaluate(`state.ensureBuild('practice','one'); console.log(JSON.stringify(Number(state.command('cat',['.tmp/count']))));`), 3);
  rmSync(path.join(root, '.tmp/astro-dist/practice-one/index.html'));
  assert.equal(evaluate(`state.ensureBuild('practice','one'); console.log(JSON.stringify(Number(state.command('cat',['.tmp/count']))));`), 4);
  write('src/input.js', 'changed');
  assert.equal(evaluate(`state.ensureBuild('practice','one'); console.log(JSON.stringify(Number(state.command('cat',['.tmp/count']))));`), 5);
  write('.tmp/verification-state/artifacts/practice-one.json', '{"name":"practice-one"}');
  assert.equal(evaluate(`state.ensureBuild('practice','one'); console.log(JSON.stringify(Number(state.command('cat',['.tmp/count']))));`), 6);
  write('src/input.js', 'FAIL');
  assert.equal(evaluate(`let failed=false; try {state.ensureBuild('practice','one');} catch {failed=true;} console.log(JSON.stringify(failed));`), true);
}));

test('receipts reject changed checks, configuration, environment, dotenv and artifacts', () => fixture(({ root, write, evaluate }) => {
  const record = `state.ensureBuild('practice','one'); state.recordCheck('example',['practice-one']);`;
  const reuse = `console.log(JSON.stringify(state.reusableCheck('example')));`;
  assert.equal(evaluate(reuse), false);
  assert.equal(evaluate(record + reuse), true);
  assert.equal(evaluate(reuse, { TZ: 'different-test-timezone' }), false);
  write('.env', 'PRIVATE_TEST_VALUE=changed');
  assert.equal(evaluate(reuse), false);
  rmSync(path.join(root, '.env'));
  assert.equal(evaluate(reuse), true);
  write('tests/new-check.mjs', 'new test');
  assert.equal(evaluate(reuse), false);
  evaluate(record + reuse);
  write('astro.config.mjs', 'changed configuration');
  assert.equal(evaluate(reuse), false);
  evaluate(record + reuse);
  write('.tmp/astro-dist/practice-one/index.html', 'unexpected output');
  assert.equal(evaluate(reuse), false);
  evaluate(record + reuse);
  const checkFile = path.join(root, '.tmp/verification-state/checks', readdirSync(path.join(root, '.tmp/verification-state/checks'))[0]);
  writeFileSync(checkFile, '{not valid json');
  assert.equal(evaluate(reuse), false);
  evaluate(record + reuse);
  const receipt = JSON.parse(readFileSync(checkFile));
  receipt.artifacts = [];
  writeFileSync(checkFile, JSON.stringify(receipt));
  assert.equal(evaluate(reuse), false);
  assert.equal(evaluate(`const before=state.fingerprint(); state.command('python3',['-c','from pathlib import Path; Path("src/input.js").write_text("changed mid-check")']); let failed=false; try {state.recordCheck('changed',[],before);} catch {failed=true;} console.log(JSON.stringify(failed));`), true);
}));

test('selection retains full shared coverage and includes deleted inputs and both rename sides', () => {
  assert.deepEqual(checksFor(['docs/buildimprovement.md', 'assessments/example/page.png']), []);
  assert.deepEqual(checksFor(['sites/centexmh/practice.json']), ['site:centexmh']);
  assert.deepEqual(checksFor(['sites/centexmh/assets/guide.md']), ['site:centexmh']);
  assert.deepEqual(checksFor(['src/entries/practice/pages/content.md']), ['contracts:all', 'browser:themes', 'browser:providers', 'browser:analytics']);
  assert.deepEqual(checksFor(['sites/one/removed.jpg', 'sites/two/renamed.jpg']), ['site:one', 'site:two']);
  assert.deepEqual(checksFor(['marketing/assets/removed.png']), ['contracts:marketing']);
  assert.deepEqual(checksFor(['shared/styles/frontdoor.css']), ['contracts:representatives', 'browser:themes', 'screenshots']);
  assert.deepEqual(checksFor(['scripts/build_astro.mjs', 'sites/centexmh/practice.json']), ['contracts:all', 'browser:themes', 'browser:providers', 'browser:analytics']);
  assert.deepEqual(checksFor(['places-worker/wrangler.toml']), ['places:typecheck', 'places:test', 'places:config']);
});

test('staged runner reuses a passed check, reruns absent receipts and refuses partial staging', () => fixture(({ root, git, write }) => {
  write('scripts/verification/verify_output_contracts.mjs', `
    import * as state from ${JSON.stringify(stateUrl)};
    import fs from 'node:fs';
    const before=state.fingerprint();
    state.ensureBuild('practice','one');
    const count=Number(fs.existsSync('.tmp/check-count') ? fs.readFileSync('.tmp/check-count') : 0)+1;
    fs.writeFileSync('.tmp/check-count',String(count));
    state.recordCheck('contracts:all',['practice-one'],before);
  `);
  git('add', '.');
  const runner = path.resolve('scripts/verify_change.mjs');
  const run = () => spawnSync(process.execPath, [runner, '--staged', '--file=src/input.js'], { cwd: root, encoding: 'utf8' });
  let result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(path.join(root, '.tmp/count'), 'utf8'), '1');
  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Reusing verified checks: contracts:all/);
  assert.equal(readFileSync(path.join(root, '.tmp/check-count'), 'utf8'), '1');
  rmSync(path.join(root, '.tmp/verification-state/checks'), { recursive: true });
  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(path.join(root, '.tmp/check-count'), 'utf8'), '2');
  assert.equal(readFileSync(path.join(root, '.tmp/count'), 'utf8'), '1');
  write('src/input.js', 'different unstaged version');
  result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Staged verification inputs differ/);
  assert.equal(readFileSync(path.join(root, '.tmp/check-count'), 'utf8'), '2');
}));


test('behavior selection chooses publishing contracts and relevant browser suites', () => {
  assert.equal(affectsMarketing('centexmh', {seo:{allowIndexing:false}}, 'drdronavalli'), true);
  assert.equal(affectsMarketing('drdronavalli', {seo:{allowIndexing:true}}, 'drdronavalli'), true);
  assert.equal(affectsMarketing('other', {seo:{allowIndexing:true}}, 'drdronavalli'), false);
  assert.equal(affectsMarketing('other', {seo:{allowIndexing:true}}, 'drdronavalli', {seo:{allowIndexing:false}}), true);
  assert.deepEqual(checksFor(['src/components/practice/ProviderCard.astro']), ['contracts:all', 'browser:providers', 'browser:analytics']);
  assert.deepEqual(checksFor(['shared/analytics.js']), ['contracts:all', 'browser:analytics']);
  assert.deepEqual(checksFor(['src/lib/practice-production.mjs']), ['contracts:all']);
  assert.deepEqual(checksFor(['shared/styles/frontdoor.css', 'src/components/practice/ProviderProfile.astro']), ['contracts:all', 'browser:themes', 'screenshots', 'browser:providers', 'browser:analytics']);
  assert.deepEqual(checksFor(['src/lib/preview-paths.mjs']), ['contracts:all', 'browser:themes', 'browser:providers', 'browser:analytics']);
  assert.deepEqual(checksFor(['sites/template/practice.json']), ['contracts:all']);
});

test('headers, footers and section navigation select theme checks alone or in mixed edits', () => {
  for (const file of ['PracticeHeader', 'PracticeFooter']) {
    const changed = `src/components/practice/${file}.astro`;
    assert.deepEqual(checksFor([changed]), ['contracts:all', 'browser:themes']);
    assert.deepEqual(checksFor([changed, 'sites/centexmh/practice.json']), ['contracts:all', 'browser:themes']);
    assert.deepEqual(checksFor([changed, 'shared/analytics.js']), ['contracts:all', 'browser:analytics', 'browser:themes']);
  }
  for (const file of ['HomeHeader', 'MarketingFooter']) {
    const changed = `src/components/marketing/${file}.astro`;
    assert.deepEqual(checksFor([changed]), ['contracts:marketing', 'browser:themes']);
    assert.deepEqual(checksFor([changed, 'marketing/marketing.json']), ['contracts:marketing', 'browser:themes']);
    assert.deepEqual(checksFor([changed, 'src/components/practice/ProviderCard.astro']), ['contracts:all', 'browser:providers', 'browser:analytics', 'browser:themes']);
  }
  assert.deepEqual(checksFor(['src/lib/home-sections.mjs']), ['contracts:all', 'browser:themes']);
  assert.deepEqual(checksFor(['src/components/practice/PracticeFooter.astro', 'shared/styles/frontdoor.css']), ['contracts:all', 'browser:themes', 'screenshots']);
});

test('browser results preserve only complete passing suites after a failure', () => {
  const spec = (title, status) => ({ title, tests: [{ results: [{ status }] }] });
  const report = { suites: [{ specs: [spec('@theme-polish one', 'passed'), spec('@analytics two', 'failed'), spec('@provider-experience three', 'skipped')] }] };
  assert.deepEqual(passedBrowserSuites(report, ['themes', 'analytics', 'providers']), ['themes']);
  assert.deepEqual(passedBrowserSuites({ ...report, errors: [{ message: 'setup failed' }] }, ['themes']), []);
  assert.deepEqual(passedBrowserSuites({ suites: [] }, ['themes']), []);
});

test('reviewed baselines use unchanged artifacts without builds and reject stale or altered evidence', () => fixture(({ root, write, evaluate }) => {
  write('sites/one/practice.json', '{}');
  const contractsUrl = pathToFileURL(path.resolve('scripts/verification/verify_output_contracts.mjs')).href;
  const module = `const contracts = await import(${JSON.stringify(contractsUrl)}); `;
  const review = `contracts.reviewContracts({targets:['practice-one']});`;
  const accept = `contracts.acceptReviewedContracts();`;
  const count = `console.log(JSON.stringify(Number(state.command('cat',['.tmp/count']))));`;
  assert.equal(evaluate(module + review + accept + `state.ensureBuild('practice','one');` + count), 1);
  const baseline = readFileSync(path.join(root, 'tests/verification/contracts/practice-one.json'), 'utf8');
  write('tests/verification/contracts/practice-one.json', '{}');
  assert.equal(evaluate(`state.ensureBuild('practice','one');` + count), 1);
  evaluate(module + accept + count);
  assert.equal(readFileSync(path.join(root, 'tests/verification/contracts/practice-one.json'), 'utf8'), baseline);
  write('.tmp/verification-contracts/review/practice-one.json', '{}');
  assert.equal(evaluate(module + `let failed=false; try {${accept}} catch {failed=true;} console.log(JSON.stringify(failed));`), true);
  evaluate(module + review + count);
  write('.tmp/astro-dist/practice-one/index.html', 'changed output');
  assert.equal(evaluate(module + `let failed=false; try {${accept}} catch {failed=true;} console.log(JSON.stringify(failed));`), true);
  evaluate(module + review + count);
  write('src/input.js', 'changed source');
  assert.equal(evaluate(module + `let failed=false; try {${accept}} catch {failed=true;} console.log(JSON.stringify(failed));`), true);
}));
