export function practiceAssetUrl(value, levelsToPracticeRoot = 0) {
  if (!value) return '';

  const asset = String(value);
  if (/^(?:[a-z]+:|#)/i.test(asset)) return asset;
  if (asset.startsWith('/')) {
    throw new Error(`Practice asset paths must be relative: ${asset}`);
  }

  const normalized = asset.replace(/^\.\//, '');
  const prefix = levelsToPracticeRoot > 0 ? '../'.repeat(levelsToPracticeRoot) : './';
  return `${prefix}${normalized}`;
}
