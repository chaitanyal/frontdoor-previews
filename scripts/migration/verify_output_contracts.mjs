#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const ROOT = process.cwd();
const ASTRO_ROOT = path.join(ROOT, '.tmp', 'astro-dist');
const CONTRACT_ROOT = path.join(ROOT, 'tests', 'migration', 'contracts');
const practiceIds = readdirSync(path.join(ROOT, 'sites'), { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      entry.name !== 'template' &&
      existsSync(path.join(ROOT, 'sites', entry.name, 'practice.json')),
  )
  .map((entry) => entry.name)
  .sort();

const TARGETS = [
  {
    name: 'marketing',
    command: ['run', 'build:astro:marketing'],
    environment: {},
    output: path.join(ASTRO_ROOT, 'marketing'),
  },
  ...practiceIds.map((practiceId) => ({
    name: `practice-${practiceId}`,
    command: ['run', 'build:astro:practice'],
    environment: { SITE_ID: practiceId },
    output: path.join(ASTRO_ROOT, 'practice'),
  })),
  {
    name: 'preview-northhillspsychiatry',
    command: ['run', 'build:astro:preview'],
    environment: { SITE_ID: 'northhillspsychiatry' },
    output: path.join(ASTRO_ROOT, 'preview'),
  },
  {
    name: 'preview-all',
    command: ['run', 'build:astro:preview:all'],
    environment: {},
    output: path.join(ASTRO_ROOT, 'preview'),
  },
];

function fail(message) {
  throw new Error(message);
}

function run(command, args, environment = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...environment },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    fail(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function walkFiles(directory, relative = '') {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryRelative = path.posix.join(relative, entry.name);
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath, entryRelative));
    } else if (entry.isFile()) {
      files.push(entryRelative);
    }
  }
  return files.sort();
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'");
}

function normalizeText(value) {
  return decodeHtml(String(value || '').replace(/<[^>]+>/g, ' '))
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

function attributes(tag) {
  const values = {};
  const pattern = /([:@A-Za-z_][:@A-Za-z0-9_.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of tag.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    if (name === 'meta' || name === 'link' || name === 'script') continue;
    values[name] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return values;
}

function tags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function firstContent(html, pattern) {
  const match = html.match(pattern);
  return match ? normalizeText(match[1]) : null;
}

function metadata(html) {
  const result = {};
  for (const tag of tags(html, 'meta')) {
    const attrs = attributes(tag);
    const key = attrs.name || attrs.property;
    if (key && attrs.content !== undefined) result[key.toLowerCase()] = attrs.content;
  }
  return result;
}

function canonicalUrl(html) {
  for (const tag of tags(html, 'link')) {
    const attrs = attributes(tag);
    if (String(attrs.rel || '').toLowerCase().split(/\s+/).includes('canonical')) {
      return attrs.href || null;
    }
  }
  return null;
}

function structuredData(html) {
  const blocks = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const attrs = attributes(`<script ${match[1]}>`);
    if (attrs.type !== 'application/ld+json') continue;
    const parsed = JSON.parse(match[2]);
    const types = [];
    if (parsed && typeof parsed === 'object' && parsed['@type']) {
      types.push(...(Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']]));
    }
    if (Array.isArray(parsed?.['@graph'])) {
      for (const item of parsed['@graph']) {
        if (!item?.['@type']) continue;
        types.push(...(Array.isArray(item['@type']) ? item['@type'] : [item['@type']]));
      }
    }
    blocks.push([...new Set(types.map(String))].sort());
  }
  return {
    count: blocks.length,
    topLevelTypes: [...new Set(blocks.flat())].sort(),
  };
}

function isLocalAsset(value) {
  if (!value || value.startsWith('#')) return false;
  return !/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value);
}

function assets(html) {
  const values = [];
  for (const tagName of ['a', 'img', 'link', 'script', 'source', 'video']) {
    for (const tag of tags(html, tagName)) {
      const attrs = attributes(tag);
      for (const name of ['href', 'src', 'poster']) {
        if (isLocalAsset(attrs[name])) values.push(attrs[name]);
      }
    }
  }
  return [...new Set(values)].sort();
}

function runtimeScripts(html) {
  return tags(html, 'script')
    .map((tag) => attributes(tag).src)
    .filter(Boolean);
}

function ctaCounts(html) {
  const counts = {};
  for (const match of html.matchAll(/\bdata-frontdoor-cta\s*=\s*["']([^"']+)["']/gi)) {
    counts[match[1]] = (counts[match[1]] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function routeFor(relativePath) {
  if (relativePath === 'index.html') return '/';
  if (relativePath === '404.html') return '/404.html';
  if (relativePath.endsWith('/index.html')) {
    return `/${relativePath.slice(0, -'index.html'.length)}`;
  }
  return `/${relativePath}`;
}

function pageContract(root, relativePath) {
  const html = readFileSync(path.join(root, relativePath), 'utf8');
  const meta = metadata(html);
  return {
    route: routeFor(relativePath),
    outputFile: relativePath,
    title: firstContent(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
    description: meta.description || null,
    robots: meta.robots || null,
    canonical: canonicalUrl(html),
    openGraphUrls: {
      image: meta['og:image'] || null,
      url: meta['og:url'] || null,
    },
    twitterUrls: {
      image: meta['twitter:image'] || null,
    },
    jsonLd: structuredData(html),
    localAssetUrls: assets(html),
    runtimeScripts: runtimeScripts(html),
    inlineScriptCount: [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/gi)].length,
    ctaCounts: ctaCounts(html),
  };
}

function readOptional(root, fileName) {
  const filePath = path.join(root, fileName);
  return existsSync(filePath) ? readFileSync(filePath, 'utf8').trimEnd() : null;
}

function sitemapLocations(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .map((match) => decodeHtml(match[1].trim()))
    .sort();
}

function contractFor(root, target) {
  const outputFiles = walkFiles(root);
  const sitemap = readOptional(root, 'sitemap.xml');
  return {
    target,
    pages: outputFiles
      .filter((file) => file.endsWith('.html'))
      .map((file) => pageContract(root, file))
      .sort((left, right) => left.route.localeCompare(right.route)),
    outputFiles,
    headers: readOptional(root, '_headers'),
    robots: readOptional(root, 'robots.txt'),
    sitemapLocations: sitemapLocations(sitemap),
  };
}

function previewsFromMarketing(contract) {
  const retainedFiles = new Set([
    '_headers',
    'robots.txt',
    'shared/analytics.js',
    'shared/attribution.js',
    'shared/google-ads.js',
  ]);
  return {
    target: 'preview-all',
    pages: contract.pages.filter((page) => page.route.startsWith('/previews/')),
    outputFiles: contract.outputFiles.filter(
      (file) => file.startsWith('previews/') || retainedFiles.has(file),
    ),
    headers: contract.headers,
    robots: contract.robots,
    sitemapLocations: [],
  };
}

function compareContract(actual, expectedPath) {
  if (!existsSync(expectedPath)) {
    fail(`Missing contract baseline: ${path.relative(ROOT, expectedPath)}. Run npm run capture:output-contracts.`);
  }
  const expected = JSON.parse(readFileSync(expectedPath, 'utf8'));
  const actualText = `${JSON.stringify(actual, null, 2)}\n`;
  const expectedText = `${JSON.stringify(expected, null, 2)}\n`;
  if (actualText === expectedText) return;

  const actualPath = path.join(ROOT, '.tmp', 'migration-contracts', 'actual', path.basename(expectedPath));
  mkdirSync(path.dirname(actualPath), { recursive: true });
  writeFileSync(actualPath, actualText);
  fail(
    `Output contract changed for ${actual.target}. Compare ${path.relative(ROOT, expectedPath)} with ${path.relative(ROOT, actualPath)}.`,
  );
}

function updateContract(actual, baselinePath) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify(actual, null, 2)}\n`);
}

function verifyContract(actual, baselinePath, { update = false } = {}) {
  if (update) {
    updateContract(actual, baselinePath);
  } else {
    compareContract(actual, baselinePath);
  }
}

export function verifyOutputContracts({ update = false } = {}) {
  mkdirSync(CONTRACT_ROOT, { recursive: true });

  for (const target of TARGETS) {
    process.stdout.write(`Building Astro output contract target: ${target.name}\n`);
    run('npm', target.command, target.environment);
    const contract = contractFor(target.output, target.name);
    const baselinePath = path.join(CONTRACT_ROOT, `${target.name}.json`);
    verifyContract(contract, baselinePath, { update });
  }

  process.stdout.write(update ? 'Astro output contracts updated.\n' : 'Astro output contracts match.\n');
}

export function verifyMarketingOutputContract({ update = false } = {}) {
  const baselinePath = path.join(CONTRACT_ROOT, 'marketing.json');
  const astroRoot = path.join(ASTRO_ROOT, 'marketing');
  if (!existsSync(astroRoot)) {
    fail('Missing Astro marketing output. Run npm run build:astro:marketing first.');
  }
  verifyContract(contractFor(astroRoot, 'marketing'), baselinePath, { update });
  process.stdout.write(`Astro marketing output contract ${update ? 'updated' : 'matches'}.\n`);
}

export function verifyPracticeOutputContract(site = 'drdronavalli', { update = false } = {}) {
  const targetName = `practice-${site}`;
  const baselinePath = path.join(CONTRACT_ROOT, `${targetName}.json`);
  const astroRoot = path.join(ASTRO_ROOT, 'practice');
  if (!existsSync(astroRoot)) {
    fail('Missing Astro practice output. Run npm run build:astro:practice first.');
  }
  verifyContract(contractFor(astroRoot, targetName), baselinePath, { update });
  process.stdout.write(`Astro ${site} output contract ${update ? 'updated' : 'matches'}.\n`);
}

export function verifyPreviewOutputContract(site = 'northhillspsychiatry', { update = false } = {}) {
  const targetName = site === 'ALL' ? 'preview-all' : `preview-${site}`;
  const baselinePath = path.join(CONTRACT_ROOT, `${targetName}.json`);
  const astroRoot = path.join(ASTRO_ROOT, 'preview');
  if (!existsSync(astroRoot)) {
    fail('Missing Astro preview output. Run npm run build:astro:preview first.');
  }
  verifyContract(contractFor(astroRoot, targetName), baselinePath, { update });
  process.stdout.write(`Astro ${targetName} output contract ${update ? 'updated' : 'matches'}.\n`);
}

export function verifyMarketingPreviewOutputContract() {
  const baselinePath = path.join(CONTRACT_ROOT, 'preview-all.json');
  const astroRoot = path.join(ASTRO_ROOT, 'marketing');
  if (!existsSync(astroRoot)) {
    fail('Missing Astro marketing output. Run npm run build:astro:marketing first.');
  }
  const actual = previewsFromMarketing(contractFor(astroRoot, 'marketing'));
  compareContract(actual, baselinePath);
  process.stdout.write('Astro marketing preview output contract matches.\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const update = process.argv.includes('--update');
  const check = process.argv.includes('--check');
  const scopeArgument = process.argv.find((argument) => argument.startsWith('--scope='));
  const scope = scopeArgument?.slice('--scope='.length);
  const siteArgument = process.argv.find((argument) => argument.startsWith('--site='));
  const site = siteArgument?.slice('--site='.length);
  if (update === check) {
    console.error('Use exactly one of --update or --check.');
    process.exit(2);
  }
  try {
    if (scope) {
      if (!['marketing', 'practice', 'preview'].includes(scope)) {
        fail('Scoped output contract verification supports marketing, practice, or preview.');
      }
      if (scope === 'marketing') {
        verifyMarketingOutputContract({ update });
      } else if (scope === 'preview') {
        verifyPreviewOutputContract(site, { update });
      } else {
        verifyPracticeOutputContract(site, { update });
      }
    } else {
      verifyOutputContracts({ update });
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
