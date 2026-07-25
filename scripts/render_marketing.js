#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { canonicalLink, socialMeta } = require('../shared/render/seo');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const GOOGLE_ADS_GLOBAL_TAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18297020270"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-18297020270');
</script>`;

function injectGoogleAdsGlobalTag(htmlText, filePath) {
  if (htmlText.includes('https://www.googletagmanager.com/gtag/js?id=AW-18297020270')) {
    return htmlText;
  }
  if (!htmlText.includes('</head>')) {
    throw new Error(`Missing </head> in marketing page: ${filePath}`);
  }
  return htmlText.replace('</head>', `${GOOGLE_ADS_GLOBAL_TAG}\n</head>`);
}

function injectGoogleAdsGlobalTagIntoMarketingPages(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'previews') continue;
      injectGoogleAdsGlobalTagIntoMarketingPages(entryPath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const htmlText = fs.readFileSync(entryPath, 'utf8');
    fs.writeFileSync(entryPath, injectGoogleAdsGlobalTag(htmlText, entryPath), 'utf8');
  }
}

function decodeHtml(value) {
  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

function textFromHeadTag(htmlText, tagName) {
  const match = htmlText.match(new RegExp(`<${tagName}\\b[^>]*>(.*?)<\\/${tagName}>`, 'is'));
  if (!match) return '';
  return decodeHtml(match[1])
    .replace(/<[^>]+>/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

function descriptionFromHead(htmlText) {
  const match = htmlText.match(/<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/i);
  return match ? decodeHtml(match[1]) : '';
}

function marketingPagePath(root, filePath) {
  const relative = path.relative(root, filePath).split(path.sep).join('/');
  return relative === 'index.html' ? '' : relative.replace(/\/index\.html$/, '');
}

function injectSocialMetadata(htmlText, filePath, root, seo) {
  if (htmlText.includes('property="og:title"')) return htmlText;

  const title = textFromHeadTag(htmlText, 'title');
  const description = descriptionFromHead(htmlText);
  if (!title || !description) {
    throw new Error(`Missing title or meta description in marketing page: ${filePath}`);
  }

  const pagePath = marketingPagePath(root, filePath);
  const siteUrl = String(seo.siteUrl || '').replace(/\/+$/, '');
  const image = new URL(String(seo.ogImage || '').replace(/^\.\//, ''), `${siteUrl}/`).toString();
  const metadataConfig = {
    seo: { siteUrl, locale: seo.locale },
    practice: { name: seo.siteName },
  };
  const canonical = canonicalLink(metadataConfig, pagePath);
  const metadata = socialMeta(metadataConfig, {
    title,
    description,
    pagePath,
    image,
    imageAlt: seo.ogImageAlt,
    type: 'website',
  }).trimEnd();
  const descriptionTag = htmlText.match(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i)?.[0];
  if (!descriptionTag) {
    throw new Error(`Missing meta description tag in marketing page: ${filePath}`);
  }
  return htmlText.replace(descriptionTag, `${descriptionTag}\n${canonical}${metadata}`);
}

function injectSocialMetadataIntoMarketingPages(root, seo, currentDirectory = root) {
  if (!seo?.siteUrl || !seo?.siteName || !seo?.ogImage || !seo?.ogImageAlt) {
    throw new Error('marketing.seo must include siteUrl, siteName, ogImage, and ogImageAlt');
  }

  const imagePath = path.join(root, String(seo.ogImage).replace(/^\.\//, ''));
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Missing marketing social image: ${imagePath}`);
  }

  for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
    const entryPath = path.join(currentDirectory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'previews') continue;
      injectSocialMetadataIntoMarketingPages(root, seo, entryPath);
      continue;
    }
    if (!entry.isFile() || entry.name !== 'index.html') continue;
    const htmlText = fs.readFileSync(entryPath, 'utf8');
    fs.writeFileSync(entryPath, injectSocialMetadata(htmlText, entryPath, root, seo), 'utf8');
  }
}

function injectMarketingStructuredData(htmlText, root, seo, schema) {
  if (!schema?.logo || !schema?.service?.name || !schema?.service?.serviceType || !schema?.service?.description) {
    throw new Error('marketing.schema must include logo and complete service details');
  }

  const siteUrl = `${String(seo.siteUrl || '').replace(/\/+$/, '')}/`;
  const organizationId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;
  const serviceId = `${siteUrl}#service`;
  const logoId = `${siteUrl}#logo`;
  const logoPath = path.join(root, String(schema.logo).replace(/^\.\//, ''));
  if (!fs.existsSync(logoPath)) {
    throw new Error(`Missing marketing schema logo: ${logoPath}`);
  }

  const logoUrl = new URL(String(schema.logo).replace(/^\.\//, ''), siteUrl).toString();
  const description = descriptionFromHead(htmlText);
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: seo.siteName,
        url: siteUrl,
        description,
        logo: {
          '@type': 'ImageObject',
          '@id': logoId,
          url: logoUrl,
          contentUrl: logoUrl,
          caption: seo.siteName,
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: siteUrl,
        name: seo.siteName,
        ...(schema.alternateSiteName ? { alternateName: schema.alternateSiteName } : {}),
        description,
        inLanguage: String(seo.locale || 'en_US').replace('_', '-'),
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'Service',
        '@id': serviceId,
        name: schema.service.name,
        serviceType: schema.service.serviceType,
        description: schema.service.description,
        url: siteUrl,
        provider: { '@id': organizationId },
      },
    ],
  };
  const json = JSON.stringify(graph).replace(/</g, '\\u003c');
  return htmlText.replace('</head>', `  <script type="application/ld+json">${json}</script>\n</head>`);
}

function textFromFirstH1(filePath) {
  if (!fs.existsSync(filePath)) return '';

  const match = fs.readFileSync(filePath, 'utf8').match(/<h1\b[^>]*>(.*?)<\/h1>/is);
  if (!match) return '';

  return match[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

function featuredPracticeName(practiceConfig) {
  const practiceName = practiceConfig.practice?.name || '';
  const providers = practiceConfig.providers || [];
  if (providers.length === 1) {
    const providerName = providers[0].name || '';
    const suffix = practiceName.includes(',') ? practiceName.split(/,(.*)/s)[1].trim() : '';
    if (providerName && suffix && !providerName.includes(suffix)) {
      return `${providerName}, ${suffix}`;
    }
  }
  return practiceName;
}

function renderMarketing(root = 'dist') {
  const config = loadJson(path.join('marketing', 'marketing.json'));
  const siteId = config.featuredPractice;
  if (!siteId) {
    throw new Error('Missing marketing.featuredPractice');
  }

  const practicePath = path.join('sites', siteId, 'practice.json');
  if (!fs.existsSync(practicePath)) {
    throw new Error(`Unknown featured practice: ${siteId}`);
  }

  const caseStudyPath = path.join('marketing', 'case-studies', siteId, 'index.html');
  if (!fs.existsSync(caseStudyPath)) {
    throw new Error(`Missing featured practice case study: ${caseStudyPath}`);
  }

  const practiceConfig = loadJson(practicePath);
  const siteUrl = (practiceConfig.seo?.siteUrl || '').replace(/\/+$/, '');
  const heroImage = practiceConfig.hero?.image || '';
  if (!siteUrl) {
    throw new Error(`Missing seo.siteUrl in ${practicePath}`);
  }
  if (!heroImage) {
    throw new Error(`Missing hero.image in ${practicePath}`);
  }

  const sourceHero = path.resolve(path.dirname(practicePath), heroImage);
  if (!fs.existsSync(sourceHero)) {
    throw new Error(`Missing featured practice hero image: ${sourceHero}`);
  }

  const previewImage = config.featuredPracticePreviewImage || '';
  if (!previewImage) {
    throw new Error('Missing marketing.featuredPracticePreviewImage');
  }

  const sourcePreview = path.resolve(previewImage);
  if (!fs.existsSync(sourcePreview)) {
    throw new Error(`Missing featured practice preview image: ${sourcePreview}`);
  }

  const beforeImage = config.featuredPracticeBeforeImage || '';
  const afterImage = config.featuredPracticeAfterImage || '';
  const proofSource = config.featuredPracticeProofSource || '';
  if (!beforeImage || !afterImage || !proofSource) {
    throw new Error('marketing must include featured practice before/after images and a proof source');
  }

  const sourceBefore = path.resolve(beforeImage);
  const sourceAfter = path.resolve(afterImage);
  if (!fs.existsSync(sourceBefore) || !fs.existsSync(sourceAfter)) {
    throw new Error('Missing featured practice before or after image');
  }

  const metrics = config.featuredPracticeMetrics || [];
  if (
    metrics.length !== 3 ||
    metrics.some((metric) => !metric.value || !metric.label || !metric.detail)
  ) {
    throw new Error('marketing.featuredPracticeMetrics must include three metrics with value, label, and detail');
  }

  const heroDir = path.join(root, 'assets', 'featured-practice');
  fs.mkdirSync(heroDir, { recursive: true });
  const heroTarget = path.join(heroDir, path.basename(sourceHero));
  const previewTarget = path.join(heroDir, path.basename(sourcePreview));
  fs.copyFileSync(sourceHero, heroTarget);
  fs.copyFileSync(sourcePreview, previewTarget);

  let description = config.featuredPracticeDescription || '';
  if (!description) {
    description = textFromFirstH1(caseStudyPath);
  }
  if (!description) {
    description = practiceConfig.seo?.description || '';
  }

  const featured = {
    practiceName: featuredPracticeName(practiceConfig),
    specialty: practiceConfig.practice?.tagline || '',
    heroImage: `./assets/featured-practice/${path.basename(heroTarget)}`,
    previewImage: `./assets/featured-practice/${path.basename(previewTarget)}`,
    beforeImage: `./${path.relative(path.resolve('marketing'), sourceBefore).split(path.sep).join('/')}`,
    afterImage: `./${path.relative(path.resolve('marketing'), sourceAfter).split(path.sep).join('/')}`,
    caseStudyUrl: `./case-studies/${siteId}/`,
    domain: siteUrl,
    metrics,
    description,
    proofSource,
  };

  const replacements = {
    '{{FEATURED_PRACTICE_URL}}': featured.domain,
    '{{FEATURED_PRACTICE_ARIA_LABEL}}': `View ${featured.practiceName} practice website`,
    '{{FEATURED_PRACTICE_CASE_STUDY_URL}}': featured.caseStudyUrl,
    '{{FEATURED_PRACTICE_CASE_STUDY_ARIA_LABEL}}': `Read the ${featured.practiceName} case study`,
    '{{FEATURED_PRACTICE_HERO_IMAGE}}': featured.heroImage,
    '{{FEATURED_PRACTICE_PREVIEW_IMAGE}}': featured.previewImage,
    '{{FEATURED_PRACTICE_METRIC_1_VALUE}}': featured.metrics[0].value,
    '{{FEATURED_PRACTICE_METRIC_1_LABEL}}': featured.metrics[0].label,
    '{{FEATURED_PRACTICE_METRIC_1_DETAIL}}': featured.metrics[0].detail,
    '{{FEATURED_PRACTICE_METRIC_2_VALUE}}': featured.metrics[1].value,
    '{{FEATURED_PRACTICE_METRIC_2_LABEL}}': featured.metrics[1].label,
    '{{FEATURED_PRACTICE_METRIC_2_DETAIL}}': featured.metrics[1].detail,
    '{{FEATURED_PRACTICE_METRIC_3_VALUE}}': featured.metrics[2].value,
    '{{FEATURED_PRACTICE_METRIC_3_LABEL}}': featured.metrics[2].label,
    '{{FEATURED_PRACTICE_METRIC_3_DETAIL}}': featured.metrics[2].detail,
    '{{FEATURED_PRACTICE_BEFORE_IMAGE}}': featured.beforeImage,
    '{{FEATURED_PRACTICE_AFTER_IMAGE}}': featured.afterImage,
    '{{FEATURED_PRACTICE_PROOF_SOURCE}}': featured.proofSource,
    '{{FEATURED_PRACTICE_NAME}}': featured.practiceName,
    '{{FEATURED_PRACTICE_SPECIALTY}}': featured.specialty,
    '{{FEATURED_PRACTICE_DESCRIPTION}}': featured.description,
  };

  const page = path.join(root, 'index.html');
  let htmlText = fs.readFileSync(page, 'utf8');
  for (const [placeholder, value] of Object.entries(replacements)) {
    htmlText = htmlText.replaceAll(placeholder, escapeHtml(value));
  }
  if (htmlText.includes('{{FEATURED_PRACTICE_')) {
    throw new Error('Unresolved featured practice placeholder in marketing homepage');
  }
  htmlText = injectMarketingStructuredData(htmlText, root, config.seo, config.schema);
  fs.writeFileSync(page, htmlText, 'utf8');

  injectSocialMetadataIntoMarketingPages(root, config.seo);
  injectGoogleAdsGlobalTagIntoMarketingPages(root);
}

if (require.main === module) {
  try {
    renderMarketing(process.argv[2] || 'dist');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  renderMarketing,
};
