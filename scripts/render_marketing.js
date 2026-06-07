#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

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

  const heroDir = path.join(root, 'assets', 'featured-practice');
  fs.mkdirSync(heroDir, { recursive: true });
  const heroTarget = path.join(heroDir, path.basename(sourceHero));
  fs.copyFileSync(sourceHero, heroTarget);

  let description = config.featuredPracticeDescription || '';
  if (!description) {
    description = textFromFirstH1(path.join('marketing', 'case-studies', siteId, 'index.html'));
  }
  if (!description) {
    description = practiceConfig.seo?.description || '';
  }

  const featured = {
    practiceName: featuredPracticeName(practiceConfig),
    specialty: practiceConfig.practice?.tagline || '',
    heroImage: `./assets/featured-practice/${path.basename(heroTarget)}`,
    domain: siteUrl,
    description,
  };

  const replacements = {
    '{{FEATURED_PRACTICE_URL}}': featured.domain,
    '{{FEATURED_PRACTICE_ARIA_LABEL}}': `View ${featured.practiceName} practice website`,
    '{{FEATURED_PRACTICE_HERO_IMAGE}}': featured.heroImage,
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
  fs.writeFileSync(page, htmlText, 'utf8');
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
