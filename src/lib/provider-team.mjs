/** Directory enablement and explicit homepage selections share one roster. */
export function hasProviderDirectory(config) {
  return config.providerDirectory ?? (config.providers?.length || 0) >= 5;
}

export function homepageProviders(config) {
  const providers = config.providers || [];
  const selected = config.home?.featuredProviderSlugs;
  if (!selected?.length) return providers;
  return selected.map((slug) => providers.find((provider) => provider.slug === slug));
}
