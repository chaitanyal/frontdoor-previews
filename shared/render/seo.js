const { esc } = require('./html');
const { absoluteUrl, canonicalUrl } = require('./urls');

function robotsMeta(config) {
  return config.seo?.allowIndexing === true ? '' : '  <meta name="robots" content="noindex, nofollow">\n';
}

function canonicalLink(config, pagePath = '') {
  const canonical = canonicalUrl(config, pagePath);
  return canonical ? `  <link rel="canonical" href="${esc(canonical)}" />\n` : '';
}

function socialMeta(config, options = {}) {
  const title = options.title || config.seo?.title || '';
  const description = options.description || config.seo?.description || '';
  const canonical = canonicalUrl(config, options.pagePath);
  const image = absoluteUrl(config, options.image || config.seo?.ogImage || config.hero?.image);
  const imageAlt = options.imageAlt || config.seo?.ogImageAlt || config.hero?.imageAlt || title;
  const siteName = config.practice?.name || title;
  const locale = config.seo?.locale || 'en_US';
  const type = options.type || 'website';
  const lines = [
    `  <meta property="og:title" content="${esc(title)}" />`,
    `  <meta property="og:type" content="${esc(type)}" />`,
  ];

  if (description) lines.push(`  <meta property="og:description" content="${esc(description)}" />`);
  if (canonical) lines.push(`  <meta property="og:url" content="${esc(canonical)}" />`);
  if (siteName) lines.push(`  <meta property="og:site_name" content="${esc(siteName)}" />`);
  if (locale) lines.push(`  <meta property="og:locale" content="${esc(locale)}" />`);
  if (image) {
    lines.push(`  <meta property="og:image" content="${esc(image)}" />`);
    if (imageAlt) lines.push(`  <meta property="og:image:alt" content="${esc(imageAlt)}" />`);
  }

  lines.push('  <meta name="twitter:card" content="summary_large_image" />');
  if (title) lines.push(`  <meta name="twitter:title" content="${esc(title)}" />`);
  if (description) lines.push(`  <meta name="twitter:description" content="${esc(description)}" />`);
  if (image) {
    lines.push(`  <meta name="twitter:image" content="${esc(image)}" />`);
    if (imageAlt) lines.push(`  <meta name="twitter:image:alt" content="${esc(imageAlt)}" />`);
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  canonicalLink,
  robotsMeta,
  socialMeta,
};
