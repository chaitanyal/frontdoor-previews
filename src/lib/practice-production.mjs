import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  absoluteUrl,
  canonicalUrl,
  homepageImageMetadata,
  providerImageMetadata,
} from './seo.mjs';
import { discoverIndexRoutes, renderSitemap } from './sitemap.mjs';

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

function tagAttribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] || '';
}

function metaContent(html, attribute, value) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (tagAttribute(match[0], attribute) === value) {
      return tagAttribute(match[0], 'content');
    }
  }
  return '';
}

function jsonLdObjects(html, relativePath) {
  const objects = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      objects.push(JSON.parse(match[1]));
    } catch (error) {
      throw new Error(`Invalid JSON-LD in ${relativePath}: ${error.message}`);
    }
  }
  return objects;
}

function imageSources(html) {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((match) =>
    tagAttribute(match[0], 'src'),
  );
}

function assertPageImageMetadata(
  html,
  relativePath,
  expectedCanonical,
  expectedImage,
  entityType,
) {
  const canonical = canonicalHref(html);
  if (canonical !== expectedCanonical) {
    throw new Error(
      `Canonical must be ${expectedCanonical} in ${relativePath}; found ${canonical || 'none'}.`,
    );
  }

  for (const [attribute, key] of [
    ['property', 'og:image'],
    ['name', 'twitter:image'],
  ]) {
    const image = metaContent(html, attribute, key);
    if (image !== expectedImage) {
      throw new Error(
        `${key} must be ${expectedImage} in ${relativePath}; found ${image || 'none'}.`,
      );
    }
  }

  const jsonLd = jsonLdObjects(html, relativePath);
  const webPage = jsonLd.find((block) => block['@type'] === 'WebPage');
  if (webPage?.primaryImageOfPage !== expectedImage) {
    throw new Error(
      `WebPage.primaryImageOfPage must be ${expectedImage} in ${relativePath}.`,
    );
  }
  const entity = jsonLd.find((block) => block['@type'] === entityType);
  if (entity?.image !== expectedImage) {
    throw new Error(
      `${entityType}.image must be ${expectedImage} in ${relativePath}.`,
    );
  }
  if (webPage?.mainEntity?.['@id'] !== entity?.['@id']) {
    throw new Error(`WebPage.mainEntity must reference the ${entityType} in ${relativePath}.`);
  }
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
    const pagePath = relativePath === 'index.html'
      ? ''
      : relativePath.replace(/(?:^|\/)index\.html$/, '');
    const expectedCanonical = canonicalUrl(config, pagePath);
    if (canonical !== expectedCanonical) {
      throw new Error(
        `Canonical must be ${expectedCanonical} in ${relativePath}; found ${canonical || 'none'}.`,
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

  const homePath = path.join(outDir, 'index.html');
  const homeImage = absoluteUrl(config, homepageImageMetadata(config).image);
  assertPageImageMetadata(
    await readFile(homePath, 'utf8'),
    'index.html',
    canonicalUrl(config),
    homeImage,
    'MedicalClinic',
  );

  for (const provider of config.providers || []) {
    const relativePath = path.join(
      'providers',
      provider.slug,
      'index.html',
    );
    const providerPath = path.join(outDir, relativePath);
    if (!existsSync(providerPath)) {
      throw new Error(`Production output is missing ${relativePath}.`);
    }
    const html = await readFile(providerPath, 'utf8');
    const providerImage = absoluteUrl(
      config,
      providerImageMetadata(provider).image,
    );
    assertPageImageMetadata(
      html,
      relativePath,
      canonicalUrl(config, `providers/${provider.slug}`),
      providerImage,
      'Physician',
    );
    const visiblePortrait = String(provider.image).replace(/^\.\//, '');
    if (!imageSources(html).some((source) => source.endsWith(visiblePortrait))) {
      throw new Error(
        `Provider page ${relativePath} must visibly render ${provider.image}.`,
      );
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
    const routes = await discoverIndexRoutes(outDir);
    const sitemap = await readFile(sitemapPath, 'utf8');
    if (sitemap !== renderSitemap(siteUrl, routes)) {
      throw new Error('Indexable production sitemap.xml does not match generated routes.');
    }
    for (const provider of config.providers || []) {
      const providerUrl = canonicalUrl(config, `providers/${provider.slug}`);
      if (!sitemap.includes(`<loc>${providerUrl}</loc>`)) {
        throw new Error(`Indexable production sitemap.xml is missing ${providerUrl}.`);
      }
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
