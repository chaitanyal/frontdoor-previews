/** Local, content-checked build artifacts and verification receipts. No age-based reuse. */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const VERSION = 1;
const ROOT = process.cwd();
const STATE = path.join(ROOT, '.tmp', 'verification-state');
const hash = value => createHash('sha256').update(value).digest('hex');

export function timed(label, action) {
  const start = performance.now();
  try { return action(); }
  finally { console.log(`[timing] ${label}: ${((performance.now() - start) / 1000).toFixed(2)}s`); }
}

export function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, { cwd: ROOT, encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || `${executable} ${args.join(' ')} failed:\n${result.stdout || ''}${result.stderr || ''}`);
  }
  return result.stdout;
}

// Research/local state and current non-rendered Markdown do not affect website checks.
// Other Git-visible inputs (including new files, tests, lockfiles, assets and workers)
// are deliberately conservative dependencies until finer selection is implemented.
export function relevantInput(file) {
  const publishedMarkdown = /^(?:sites\/[^/]+\/(?:assets|images)\/|marketing\/(?:assets|case-studies)\/|shared\/branding\/|src\/(?!README\.md$))/.test(file);
  return !/^(?:docs|assessments|\.codex|\.agents)\//.test(file) &&
    (!file.toLowerCase().endsWith('.md') || publishedMarkdown) && !/(?:^|\/)(?:\.DS_Store|__pycache__)(?:\/|$)/.test(file);
}

export function sourceSnapshot({ index = false, root = ROOT } = {}) {
  const git = args => command('git', args, { cwd: root });
  const format = git(['rev-parse', '--show-object-format']).trim();
  if (index) {
    return git(['ls-files', '--stage', '-z']).split('\0').filter(Boolean).map(entry => {
      const separator = entry.indexOf('\t');
      const metadata = entry.slice(0, separator), file = entry.slice(separator + 1);
      const [mode, oid, stage] = metadata.split(' ');
      if (stage !== '0') throw new Error(`Unresolved index entry: ${file}`);
      return [file, mode, oid];
    }).filter(([file]) => relevantInput(file)).sort(([a], [b]) => a.localeCompare(b));
  }
  const files = new Set(git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(relevantInput).filter(Boolean));
  return [...files].sort().flatMap(file => {
    const absolute = path.join(root, file);
    if (!existsSync(absolute)) return [];
    const stat = lstatSync(absolute);
    if (!stat.isFile() && !stat.isSymbolicLink()) throw new Error(`Unsupported verification input: ${file}`);
    // Resolving links outside the Git snapshot could hide changes from the hook.
    if (stat.isSymbolicLink()) throw new Error(`Verification inputs must be regular files: ${file}`);
    const data = readFileSync(absolute);
    const oid = createHash(format).update(`blob ${data.length}\0`).update(data).digest('hex');
    return [[file, stat.mode & 0o111 ? '100755' : '100644', oid]];
  }).sort(([a], [b]) => a.localeCompare(b));
}

export function assertIndexMatches(root = ROOT) {
  const working = sourceSnapshot({ root });
  const staged = sourceSnapshot({ root, index: true });
  if (JSON.stringify(working) !== JSON.stringify(staged)) {
    const a = new Map(working.map(row => [row[0], row.slice(1).join(' ')]));
    const b = new Map(staged.map(row => [row[0], row.slice(1).join(' ')]));
    const files = [...new Set([...a.keys(), ...b.keys()])].filter(file => a.get(file) !== b.get(file));
    throw new Error(`Staged verification inputs differ from the working tree: ${files.join(', ')}. Stage the intended versions or restore unstaged inputs before committing; verification will not approve different staged content.`);
  }
}

export function fingerprint() {
  const versions = ['astro', 'tailwindcss', '@playwright/test'].map(name => {
    const file = path.join(ROOT, 'node_modules', name, 'package.json');
    return [name, existsSync(file) ? JSON.parse(readFileSync(file)).version : null];
  });
  const environment = Object.fromEntries(['NODE_ENV', 'NODE_OPTIONS', 'TZ', 'LANG', 'LC_ALL'].map(key => [key, process.env[key] || '']));
  const dotenv = readdirSync(ROOT).filter(file => /^\.env(?:\.|$)/.test(file)).sort()
    .filter(file => { const stat = lstatSync(path.join(ROOT, file)); return stat.isFile() || stat.isSymbolicLink(); })
    .map(file => [file, hash(readFileSync(path.join(ROOT, file)))]);
  return hash(JSON.stringify({ version: VERSION, source: sourceSnapshot(), versions,
    node: process.version, executable: process.execPath, platform: process.platform, arch: process.arch,
    python: command('python3', ['--version']).trim(), environment, dotenv }));
}

export function outputFingerprint(directory) {
  const digest = createHash('sha256');
  function visit(relative = '') {
    for (const entry of readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) visit(name);
      else if (entry.isFile()) digest.update(JSON.stringify([name, hash(readFileSync(path.join(directory, name)))]));
      else throw new Error(`Unexpected artifact entry: ${name}`);
    }
  }
  visit();
  return digest.digest('hex');
}

function readRecord(file) {
  try {
    const { integrity, ...record } = JSON.parse(readFileSync(file, 'utf8'));
    return integrity === hash(JSON.stringify(record)) ? record : null;
  }
  catch { return null; }
}

function writeRecord(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ ...value, integrity: hash(JSON.stringify(value)) }, null, 2)}\n`);
}

export function buildName(target, site = '') {
  if (!['marketing', 'practice', 'preview'].includes(target) ||
      (target === 'marketing' ? Boolean(site) : !/^(?:ALL|[a-z0-9-]+)$/.test(site))) {
    throw new Error(`Invalid build identity: ${target}/${site}`);
  }
  return target === 'marketing' ? target : `${target}-${site === 'ALL' ? 'all' : site}`;
}

function artifact(name, input) {
  const record = readRecord(path.join(STATE, 'artifacts', `${name}.json`));
  const directory = path.join(ROOT, '.tmp', 'astro-dist', name);
  if (!record || record.name !== name || record.input !== input || !existsSync(directory)) return null;
  try { return record.output === outputFingerprint(directory) ? { ...record, directory } : null; }
  catch { return null; }
}

export function ensureBuild(target, site = '', { fresh = false } = {}) {
  const name = buildName(target, site);
  const input = fingerprint();
  let record = fresh ? null : artifact(name, input);
  if (!record) {
    timed(`build ${name}`, () => command(process.execPath, ['scripts/build_astro.mjs'], {
      env: { ...process.env, FRONTDOOR_TARGET: target, SITE_ID: site, FRONTDOOR_ASTRO_DEPLOY: '', FRONTDOOR_BUILD_KEY: name },
      stdio: 'inherit',
    }));
    if (fingerprint() !== input) throw new Error('Verification inputs changed during the build; rerun verification.');
    const directory = path.join(ROOT, '.tmp', 'astro-dist', name);
    record = { name, input, output: outputFingerprint(directory), directory };
    writeRecord(path.join(STATE, 'artifacts', `${name}.json`), { name, input, output: record.output });
  } else console.log(`Reusing verified build: ${name}`);
  // Existing file:// tests and scoped contract commands retain their public paths.
  // Each identity has its own immutable directory; only the compatibility link changes.
  if (name !== target) {
    const alias = path.join(ROOT, '.tmp', 'astro-dist', target);
    if (!existsSync(alias) || !lstatSync(alias).isSymbolicLink() || readlinkSync(alias) !== name) {
      rmSync(alias, { recursive: true, force: true });
      symlinkSync(name, alias, 'dir');
    }
  }
  return record;
}

export function recordCheck(check, names = [], input = fingerprint()) {
  if (fingerprint() !== input) throw new Error('Verification inputs changed during checks; rerun verification.');
  const artifacts = names.map(name => {
    const record = artifact(name, input);
    if (!record) throw new Error(`Missing or changed verified artifact: ${name}`);
    return { name, output: record.output };
  });
  writeRecord(path.join(STATE, 'checks', `${hash(check)}.json`), { check, input, artifacts });
}

export function reusableCheck(check) {
  const input = fingerprint();
  const record = readRecord(path.join(STATE, 'checks', `${hash(check)}.json`));
  if (!record || record.check !== check || record.input !== input || !Array.isArray(record.artifacts)) return false;
  return record.artifacts.every(saved => saved && typeof saved.name === 'string' &&
    /^[a-z0-9-]+$/.test(saved.name) && typeof saved.output === 'string' &&
    artifact(saved.name, input)?.output === saved.output);
}
