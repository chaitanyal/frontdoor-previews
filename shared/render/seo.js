const { esc } = require('./html');
const { canonicalUrl } = require('./urls');

function robotsMeta(config) {
  return config.seo?.allowIndexing === true ? '' : '  <meta name="robots" content="noindex, nofollow">\n';
}

function canonicalLink(config, pagePath = '') {
  const canonical = canonicalUrl(config, pagePath);
  return canonical ? `  <link rel="canonical" href="${esc(canonical)}" />\n` : '';
}

module.exports = {
  canonicalLink,
  robotsMeta,
};
