import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { sourceSnapshot, assertIndexMatches } from '../../scripts/verification/state.mjs';
import { checksFor } from '../../scripts/verification/change-plan.mjs';

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
  assert.deepEqual(checksFor(['src/entries/practice/pages/content.md']), ['contracts:all']);
  assert.deepEqual(checksFor(['sites/one/removed.jpg', 'sites/two/renamed.jpg']), ['site:one', 'site:two']);
  assert.deepEqual(checksFor(['marketing/assets/removed.png']), ['contracts:marketing']);
  assert.deepEqual(checksFor(['shared/styles/frontdoor.css']), ['contracts:all']);
  assert.deepEqual(checksFor(['scripts/build_astro.mjs', 'sites/centexmh/practice.json']), ['contracts:all']);
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
  const run = () => spawnSync(process.execPath, [runner, '--staged'], { cwd: root, encoding: 'utf8' });
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
