import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_ROBOTS = (siteUrl) =>
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
const PREVIEW_ROBOTS =
  'User-agent: *\nAllow: /\n\nSitemap: https://frontdoor.health/sitemap.xml\n';
const STANDALONE_NOINDEX_HEADERS =
  '/*\n  X-Robots-Tag: noindex, nofollow\n';

export function productionSiteUrl(config, siteId = 'practice') {
  const value = String(config.seo?.siteUrl || '').replace(/\/+$/, '');
  if (!value) {
    throw new Error(`seo.siteUrl is required in sites/${siteId}/practice.json.`);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`seo.siteUrl must be a valid HTTPS URL in sites/${siteId}/practice.json.`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`seo.siteUrl must be an HTTPS URL in sites/${siteId}/practice.json.`);
  }
  return value;
}

function configuredSet(source, variableName) {
  const match = source.match(
    new RegExp(`^\\s*${variableName}\\s*=\\s*"([^"]*)"`, 'm'),
  );
  return new Set(
    String(match?.[1] || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function assertAnalyticsDeploymentAllowed(config, wranglerSource) {
  if (config.seo?.allowIndexing !== true) return;

  const siteUrl = productionSiteUrl(config, config.practice?.slug);
  const origin = new URL(siteUrl).origin;
  const slug = config.practice?.slug;
  const origins = configuredSet(wranglerSource, 'ALLOWED_ORIGINS');
  const slugs = configuredSet(wranglerSource, 'ALLOWED_PRACTICE_SLUGS');
  const missing = [];
  if (!origins.has(origin)) missing.push(`origin ${origin}`);
  if (!slugs.has(slug)) missing.push(`practice slug ${slug}`);
  if (!missing.length) return;

  throw new Error(
    `Analytics Worker allowlist is missing ${missing.join(' and ')}. ` +
      'Update both ALLOWED_ORIGINS and ALLOWED_PRACTICE_SLUGS in worker/wrangler.toml before deploying this production practice.',
  );
}

export function practiceRobots(config, siteUrl) {
  return config.seo?.allowIndexing === true
    ? PUBLIC_ROBOTS(siteUrl)
    : PREVIEW_ROBOTS;
}

export function standaloneNoindexHeaders() {
  return STANDALONE_NOINDEX_HEADERS;
}

async function walkFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(entryPath)));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

function canonicalHref(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel=["']canonical["']/i.test(match[0])) continue;
    return match[0].match(/\bhref=["']([^"']+)["']/i)?.[1] || '';
  }
  return '';
}

export async function validatePracticeOutput(outDir, config) {
  const siteUrl = productionSiteUrl(config, config.practice?.slug);
  const files = await walkFiles(outDir);
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  if (!htmlFiles.length) throw new Error('Production practice output contains no HTML pages.');

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, 'utf8');
    const relativePath = path.relative(outDir, htmlFile);
    const canonical = canonicalHref(html);
    if (!canonical.startsWith(`${siteUrl}/`)) {
      throw new Error(
        `Production canonical must begin with ${siteUrl}/ in ${relativePath}.`,
      );
    }
    if (config.seo?.allowIndexing === true) {
      if (/\bnoindex\b/i.test(html)) {
        throw new Error(`Indexable production output contains noindex in ${relativePath}.`);
      }
    } else if (!/<meta\s+name=["']robots["']\s+content=["']noindex, nofollow["']\s*\/?>/i.test(html)) {
      throw new Error(`Non-indexable production output is missing noindex in ${relativePath}.`);
    }
  }

  const searchableFiles = files.filter((file) =>
    ['.css', '.html', '.js', '.txt', '.xml'].includes(
      path.extname(file).toLowerCase(),
    ) || ['_headers', '_redirects'].includes(path.basename(file)));
  for (const outputFile of searchableFiles) {
    const contents = await readFile(outputFile, 'utf8');
    if (/pages\.dev|frontdoor-previews/i.test(contents)) {
      throw new Error(
        `Production output contains a forbidden deployment host in ${path.relative(outDir, outputFile)}.`,
      );
    }
  }

  const robots = await readFile(path.join(outDir, 'robots.txt'), 'utf8');
  if (robots !== practiceRobots(config, siteUrl)) {
    throw new Error('Production robots.txt does not match the configured indexing mode.');
  }

  const sitemapPath = path.join(outDir, 'sitemap.xml');
  const headersPath = path.join(outDir, '_headers');
  if (config.seo?.allowIndexing === true) {
    if (!existsSync(sitemapPath)) {
      throw new Error('Indexable production output is missing sitemap.xml.');
    }
    if (existsSync(headersPath)) {
      throw new Error('Indexable production output must not publish noindex headers.');
    }
  } else {
    if (existsSync(sitemapPath)) {
      throw new Error('Non-indexable production output must not publish sitemap.xml.');
    }
    const headers = await readFile(headersPath, 'utf8');
    if (headers !== standaloneNoindexHeaders()) {
      throw new Error('Non-indexable production output is missing the root X-Robots-Tag rule.');
    }
  }
}
