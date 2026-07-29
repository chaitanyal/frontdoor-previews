export function resolveTheme(config, themes) {
  const themeName = config.theme;
  const theme = themes[themeName];
  if (!theme) {
    throw new Error(`Unknown theme '${themeName}'`);
  }
  return theme;
}

export function themeCssProperties(theme) {
  return [
    `--color-primary:${theme.primary}`,
    `--color-primary-hover:${theme.primaryHover}`,
    `--color-sage:${theme.secondarySage}`,
    `--color-surface:${theme.surfaceWarm}`,
    `--color-card:${theme.cardBackground}`,
    `--color-text-primary:${theme.textPrimary}`,
    `--color-text-secondary:${theme.textSecondary}`,
    `--color-border:${theme.border}`,
    `--color-success:${theme.success}`,
    `--brand-primary:${theme.primary}`,
    `--brand-accent:${theme.success}`,
    `--brand-800:${theme.primaryHover}`,
    `--brand-900:${theme.textPrimary}`,
    `--surface:${theme.surfaceWarm}`,
    `--font-heading:${theme.fontHeading}`,
    `--font-body:${theme.fontBody}`,
  ].join(';');
}
