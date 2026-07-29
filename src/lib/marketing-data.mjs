import { readFile } from 'node:fs/promises';
import path from 'node:path';

function featuredPracticeName(practice) {
  const practiceName = practice.practice?.name || '';
  const providers = practice.providers || [];
  if (providers.length !== 1) return practiceName;

  const providerName = providers[0].name || '';
  const suffix = practiceName.includes(',')
    ? practiceName.split(/,(.*)/s)[1].trim()
    : '';
  return providerName && suffix && !providerName.includes(suffix)
    ? `${providerName}, ${suffix}`
    : practiceName;
}

export async function loadMarketingData(repoRoot) {
  const marketingPath = path.join(repoRoot, 'marketing', 'marketing.json');
  const marketing = JSON.parse(await readFile(marketingPath, 'utf8'));
  const practiceId = marketing.featuredPractice;
  if (!practiceId) throw new Error('Missing marketing.featuredPractice');

  const practicePath = path.join(repoRoot, 'sites', practiceId, 'practice.json');
  const practice = JSON.parse(await readFile(practicePath, 'utf8'));
  const siteUrl = String(practice.seo?.siteUrl || '').replace(/\/+$/, '');
  const heroImage = practice.hero?.image;
  const metrics = marketing.featuredPracticeMetrics || [];
  if (!siteUrl || !heroImage) {
    throw new Error(`Featured practice ${practiceId} requires seo.siteUrl and hero.image`);
  }
  if (
    metrics.length !== 3 ||
    metrics.some((metric) => !metric.value || !metric.label || !metric.detail)
  ) {
    throw new Error(
      'marketing.featuredPracticeMetrics must include three complete metrics',
    );
  }

  const featuredName = featuredPracticeName(practice);
  return {
    marketing,
    practice,
    featured: {
      id: practiceId,
      practiceName: featuredName,
      specialty: practice.practice?.tagline || '',
      domain: siteUrl,
      heroImage: `./assets/featured-practice/${path.basename(heroImage)}`,
      previewImage: `./assets/featured-practice/${path.basename(
        marketing.featuredPracticePreviewImage,
      )}`,
      beforeImage: `./assets/featured-practice/${path.basename(
        marketing.featuredPracticeBeforeImage,
      )}`,
      afterImage: `./assets/featured-practice/${path.basename(
        marketing.featuredPracticeAfterImage,
      )}`,
      caseStudyUrl: `./case-studies/${practiceId}/`,
      metrics,
      description:
        marketing.featuredPracticeDescription || practice.seo?.description || '',
      proofSource: marketing.featuredPracticeProofSource || '',
      caseStudyAriaLabel: `Read the ${featuredName} case study`,
    },
  };
}

export function marketingCanonical(marketing, route = '') {
  const siteUrl = String(marketing.seo.siteUrl).replace(/\/+$/, '');
  const cleanRoute = String(route).replace(/^\/+|\/+$/g, '');
  return cleanRoute ? `${siteUrl}/${cleanRoute}/` : `${siteUrl}/`;
}

export function marketingSocialImage(marketing) {
  return new URL(
    String(marketing.seo.ogImage).replace(/^\.\//, ''),
    `${String(marketing.seo.siteUrl).replace(/\/+$/, '')}/`,
  ).toString();
}

export function marketingHomeJsonLd(marketing, description) {
  const siteUrl = `${String(marketing.seo.siteUrl).replace(/\/+$/, '')}/`;
  const organizationId = `${siteUrl}#organization`;
  const logoUrl = new URL(
    String(marketing.schema.logo).replace(/^\.\//, ''),
    siteUrl,
  ).toString();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: marketing.seo.siteName,
        url: siteUrl,
        description,
        logo: {
          '@type': 'ImageObject',
          '@id': `${siteUrl}#logo`,
          url: logoUrl,
          contentUrl: logoUrl,
          caption: marketing.seo.siteName,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: marketing.seo.siteName,
        ...(marketing.schema.alternateSiteName
          ? { alternateName: marketing.schema.alternateSiteName }
          : {}),
        description,
        inLanguage: String(marketing.seo.locale || 'en_US').replace('_', '-'),
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'Service',
        '@id': `${siteUrl}#service`,
        name: marketing.schema.service.name,
        serviceType: marketing.schema.service.serviceType,
        description: marketing.schema.service.description,
        url: siteUrl,
        provider: { '@id': organizationId },
      },
    ],
  };
}
