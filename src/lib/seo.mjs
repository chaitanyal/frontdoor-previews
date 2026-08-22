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

export function providerImageMetadata(provider) {
  const name = provider.name || 'Provider';
  return {
    image: provider.seo?.ogImage || provider.image || '',
    imageAlt:
      provider.seo?.ogImageAlt ||
      provider.imageAlt ||
      `Portrait of ${name}`,
  };
}

export function homepageImageMetadata(config) {
  const providers = config.providers || [];
  const configuredImage = config.seo?.ogImage;
  if (configuredImage) {
    const matchingProvider = providers.find(
      (provider) =>
        provider.image === configuredImage ||
        provider.seo?.ogImage === configuredImage,
    );
    return {
      image: configuredImage,
      imageAlt:
        config.seo?.ogImageAlt ||
        (matchingProvider
          ? providerImageMetadata(matchingProvider).imageAlt
          : config.hero?.imageAlt) ||
        config.seo?.title ||
        '',
    };
  }

  if (providers.length === 1) {
    return providerImageMetadata(providers[0]);
  }

  return {
    image: config.hero?.image || '',
    imageAlt:
      config.hero?.imageAlt || config.seo?.ogImageAlt || config.seo?.title || '',
  };
}

export function socialMetadata(config, options = {}) {
  const title = options.title || config.seo?.title || '';
  const description = options.description || config.seo?.description || '';
  const homepageImage = homepageImageMetadata(config);
  const imageValue = options.image || homepageImage.image;

  return {
    canonical: canonicalUrl(config, options.pagePath),
    description,
    image: absoluteUrl(config, imageValue),
    imageAlt: options.imageAlt || homepageImage.imageAlt || title,
    locale: config.seo?.locale || 'en_US',
    siteName: config.practice?.name || title,
    title,
    type: options.type || 'website',
  };
}

export function webPageSchema(social, mainEntityId = '') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    ...(social.canonical
      ? { '@id': `${social.canonical}#webpage`, url: social.canonical }
      : {}),
    name: social.title,
    description: social.description,
    ...(social.image ? { primaryImageOfPage: social.image } : {}),
    ...(mainEntityId ? { mainEntity: { '@id': mainEntityId } } : {}),
  };
}

export function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
