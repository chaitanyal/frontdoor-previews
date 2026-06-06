function normalizedSiteUrl(config) {
  return String(config.seo?.siteUrl || '').replace(/\/+$/, '');
}

function canonicalUrl(config, pagePath = '') {
  const siteUrl = normalizedSiteUrl(config);
  if (!siteUrl) return '';
  const normalizedPath = String(pagePath || '').replace(/^\/+|\/+$/g, '');
  return normalizedPath ? `${siteUrl}/${normalizedPath}/` : `${siteUrl}/`;
}

function absoluteUrl(config, value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const siteUrl = normalizedSiteUrl(config);
  if (!siteUrl) return value;
  return `${siteUrl}/${String(value).replace(/^\.\//, '')}`;
}

function relFromProvider(pathValue) {
  if (!pathValue) return '';
  const value = String(pathValue);
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `../../${value.replace(/^\/+/, '')}`;
  if (value.startsWith('./')) return `../../${value.slice(2)}`;
  if (value.startsWith('../')) return `../../${value}`;
  return `../../${value}`;
}

module.exports = {
  absoluteUrl,
  canonicalUrl,
  normalizedSiteUrl,
  relFromProvider,
};
