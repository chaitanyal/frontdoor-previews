import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  absoluteUrl,
  canonicalUrl,
  homepageImageMetadata,
  providerImageMetadata,
} from './seo.mjs';
import { financialSectionMode, providerEntityType } from './practice-view.mjs';
import { homeSectionNavigation } from './home-sections.mjs';
import { hasProviderDirectory } from './provider-team.mjs';
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
      'Update both ALLOWED_ORIGINS and ALLOWED_PRACTICE_SLUGS in analytics-worker/wrangler.toml before deploying this production practice.',
  );
}

export function practiceRobots(config, siteUrl) {
  return config.seo?.allowIndexing === true
    ? PUBLIC_ROBOTS(siteUrl)
    : PREVIEW_ROBOTS;
}

function markdownText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/([\\[\]])/g, '\\$1');
}

/** Curated production guide: visible practice facts precede grouped page links. */
export function practiceLlms(config, siteUrl) {
  const baseUrl = String(siteUrl || '').replace(/\/+$/, '');
  const practice = config.practice || {};
  const lines = [
    `# ${markdownText(practice.name)}`,
    '',
    `> ${markdownText(config.seo?.description)}`,
    '',
  ];

  if (practice.tagline) {
    lines.push(`- Specialty: ${markdownText(practice.tagline)}`);
  }
  if (practice.addressLines?.length) {
    lines.push(`- Location: ${markdownText(practice.addressLines.join(', '))}`);
  }
  if (practice.phone) {
    lines.push(`- Phone: ${markdownText(practice.phone)}`);
  }
  const location = config.location || {};
  if (location.hours?.length) {
    const timeZone = location.timeZone ? ` (${markdownText(location.timeZone)})` : '';
    const hours = location.hours.map(([day, schedule]) => `${markdownText(day)}, ${markdownText(schedule)}`).join('; ');
    lines.push(`- Office hours${timeZone}: ${hours}.`);
    const telehealthDays = Object.entries(location.weeklyHours || {})
      .filter(([, schedule]) => schedule.telehealthOnly === true)
      .map(([day]) => markdownText(day));
    if (telehealthDays.length) lines.push(`- Telehealth-only days: ${telehealthDays.join(', ')}.`);
  }
  if (practice.acceptsNewPatients === true) {
    lines.push('- Accepting new patients: Yes');
  } else if (practice.acceptsNewPatients === false) {
    lines.push('- Accepting new patients: No');
  }

  const policy = config.financialPolicy || {};
  const paymentSummaries = {
    insurance: 'Insurance-based payment; contact the office to confirm plan participation.',
    cash_only: 'Private pay; the practice does not participate in insurance networks.',
    out_of_network: 'Out-of-network with insurance providers.',
    hybrid: 'Select insurance plans and self-pay options; contact the office to confirm details.',
    mixed: 'Select insurance plans and self-pay options; contact the office to confirm details.',
  };
  const financialMode = financialSectionMode(config);
  const paymentSummary = financialMode === 'insurance'
    ? config.insurance?.summary || policy.summary || paymentSummaries[policy.paymentModel]
    : policy.summary || paymentSummaries[policy.paymentModel];
  if (financialMode && paymentSummary) {
    lines.push(`- Payment: ${markdownText(paymentSummary)}`);
  }
  const telehealthSummary = location.telehealthNotice || config.appointmentSection?.telehealth?.summary;
  if (telehealthSummary) {
    lines.push(`- Telehealth: ${markdownText(telehealthSummary)}`);
  }

  if (config.conditions?.length) {
    lines.push(
      '',
      `Areas of care: ${config.conditions.map(markdownText).join(', ')}.`,
    );
  }

  const sectionDescriptions = {
    providers: 'provider profiles',
    conditions: 'areas of care',
    treatments: 'treatments',
    contact: 'appointments and contact',
    location: config.location?.hours?.length ? 'location and office hours' : 'location',
    faq: 'FAQs',
    resources: 'patient resources',
  };
  const overview = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(
    homeSectionNavigation(config).map((section) => section.key === 'financial'
      ? section.label.toLowerCase()
      : sectionDescriptions[section.key]),
  );
  lines.push(
    '',
    '## Official pages',
    '',
    `- [Practice overview](${baseUrl}/): ${overview}.`,
  );
  const providers = config.providers || [];
  const treatments = config.treatments || [];
  if (providers.length && (providers.length > 1 || treatments.length || hasProviderDirectory(config))) {
    lines.push('', '## Providers', '');
  }
  if (hasProviderDirectory(config)) {
    lines.push(`- [Provider directory](${baseUrl}/providers/): Complete care team and links to individual profiles.`);
  }
  for (const provider of providers) {
    lines.push(
      `- [${markdownText(provider.name)}](${baseUrl}/providers/${encodeURIComponent(provider.slug)}/): ${markdownText(provider.seo?.description)}`,
    );
  }
  if (treatments.length) lines.push('', '## Treatments', '');
  for (const treatment of treatments) {
    lines.push(
      `- [${markdownText(treatment.name)}](${baseUrl}/treatment/${treatment.slug}/): ${markdownText(treatment.seo.description)}`,
    );
  }
  lines.push('');

  return lines.join('\n');
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

function hasSchemaType(block, type) {
  return [block?.['@type']].flat().includes(type);
}

function assertJsonLdInHead(html, relativePath) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const jsonLdPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/gi;
  const documentCount = [...html.matchAll(jsonLdPattern)].length;
  const headCount = [...head.matchAll(jsonLdPattern)].length;
  if (documentCount !== headCount) {
    throw new Error(`JSON-LD must be rendered inside <head> in ${relativePath}.`);
  }
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
  expectedEntityImage = expectedImage,
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
  const webPage = jsonLd.find((block) => hasSchemaType(block, 'WebPage'));
  if (webPage?.primaryImageOfPage !== expectedImage) {
    throw new Error(
      `WebPage.primaryImageOfPage must be ${expectedImage} in ${relativePath}.`,
    );
  }
  const entity = jsonLd.find((block) => hasSchemaType(block, entityType));
  if (entity?.image !== expectedEntityImage) {
    throw new Error(
      `${entityType}.image must be ${expectedEntityImage} in ${relativePath}.`,
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
    assertJsonLdInHead(html, relativePath);
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
    const discoveryLinks = [...html.matchAll(/<link\b[^>]*>/gi)]
      .map((match) => match[0])
      .filter((tag) => tagAttribute(tag, 'rel') === 'describedby');
    if (config.seo?.allowIndexing === true) {
      if (discoveryLinks.length !== 1 ||
        tagAttribute(discoveryLinks[0], 'type') !== 'text/markdown' ||
        path.resolve(path.dirname(htmlFile), tagAttribute(discoveryLinks[0], 'href')) !== path.resolve(outDir, 'llms.txt')) {
        throw new Error(`Indexable page must link to the practice llms.txt in ${relativePath}.`);
      }
    } else if (discoveryLinks.length) {
      throw new Error(`Non-indexable page must not link to llms.txt in ${relativePath}.`);
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
    config.providers?.length === 1 ? 'Physician' : 'MedicalClinic',
    config.providers?.length === 1
      ? absoluteUrl(config, providerImageMetadata(config.providers[0]).image)
      : homeImage,
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
      providerEntityType(provider).includes('Physician') ? 'Physician' : 'Person',
    );
    const visiblePortrait = String(provider.image).replace(/^\.\//, '');
    if (!imageSources(html).some((source) => source.endsWith(visiblePortrait))) {
      throw new Error(
        `Provider page ${relativePath} must visibly render ${provider.image}.`,
      );
    }
  }

  for (const treatment of config.treatments || []) {
    const relativePath = path.join('treatment', treatment.slug, 'index.html');
    const treatmentPath = path.join(outDir, relativePath);
    if (!existsSync(treatmentPath)) {
      throw new Error(`Production output is missing ${relativePath}.`);
    }
    const html = await readFile(treatmentPath, 'utf8');
    const jsonLd = jsonLdObjects(html, relativePath);
    if (!jsonLd.some((block) => hasSchemaType(block, 'WebPage'))) {
      throw new Error(`Treatment page ${relativePath} must include WebPage structured data.`);
    }
    if (metaContent(html, 'property', 'og:url') !== canonicalUrl(config, `treatment/${treatment.slug}`)) {
      throw new Error(`Treatment page ${relativePath} has incorrect social metadata.`);
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
  const llmsPath = path.join(outDir, 'llms.txt');
  if (config.seo?.allowIndexing === true) {
    if (!existsSync(sitemapPath)) {
      throw new Error('Indexable production output is missing sitemap.xml.');
    }
    if (existsSync(headersPath)) {
      throw new Error('Indexable production output must not publish noindex headers.');
    }
    if (!existsSync(llmsPath)) {
      throw new Error('Indexable production output is missing llms.txt.');
    }
    const llms = await readFile(llmsPath, 'utf8');
    if (llms !== practiceLlms(config, siteUrl)) {
      throw new Error('Production llms.txt does not match the configured practice data.');
    }
    for (const match of llms.matchAll(/\]\((https?:\/\/[^\s)]+)\)/g)) {
      const destination = new URL(match[1]);
      const route = decodeURIComponent(destination.pathname).replace(/^\/+/, '');
      if (destination.origin !== siteUrl || !existsSync(path.join(outDir, route, 'index.html'))) {
        throw new Error(`Production llms.txt links to a missing practice page: ${match[1]}.`);
      }
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
    if (existsSync(llmsPath)) {
      throw new Error('Non-indexable production output must not publish llms.txt.');
    }
  }
}
