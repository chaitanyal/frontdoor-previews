export function normalizedSiteUrl(config) {
  return String(config.seo?.siteUrl || '').replace(/\/+$/, '');
}

export function canonicalUrl(config, pagePath = '') {
  const siteUrl = normalizedSiteUrl(config);
  if (!siteUrl) return '';

  const normalizedPath = String(pagePath || '').replace(/^\/+|\/+$/g, '');
  return normalizedPath ? `${siteUrl}/${normalizedPath}/` : `${siteUrl}/`;
}

export function absoluteUrl(config, value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;

  const siteUrl = normalizedSiteUrl(config);
  if (!siteUrl) return value;
  return `${siteUrl}/${String(value).replace(/^\.\//, '')}`;
}

export function robotsMeta(config) {
  return config.seo?.allowIndexing === true ? null : 'noindex, nofollow';
}

export function socialMetadata(config, options = {}) {
  const title = options.title || config.seo?.title || '';
  const description = options.description || config.seo?.description || '';
  const imageValue = options.image || config.seo?.ogImage || config.hero?.image;

  return {
    canonical: canonicalUrl(config, options.pagePath),
    description,
    image: absoluteUrl(config, imageValue),
    imageAlt: options.imageAlt || config.seo?.ogImageAlt || config.hero?.imageAlt || title,
    locale: config.seo?.locale || 'en_US',
    siteName: config.practice?.name || title,
    title,
    type: options.type || 'website',
  };
}

export function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
