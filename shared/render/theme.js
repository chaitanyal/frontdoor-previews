const fs = require('fs');
const path = require('path');

const themes = JSON.parse(fs.readFileSync(path.join('shared', 'themes.json'), 'utf8'));

function resolveTheme(config) {
  const theme = themes[config.theme];
  if (!theme) throw new Error(`Unknown theme '${config.theme}'`);
  return theme;
}

function themeCss(theme) {
  return [
    `--color-primary:${theme.primary};`,
    `--color-primary-hover:${theme.primaryHover};`,
    `--color-sage:${theme.secondarySage};`,
    `--color-surface:${theme.surfaceWarm};`,
    `--color-card:${theme.cardBackground};`,
    `--color-text-primary:${theme.textPrimary};`,
    `--color-text-secondary:${theme.textSecondary};`,
    `--color-border:${theme.border};`,
    `--color-success:${theme.success};`,
    `--brand-primary:${theme.primary};`,
    `--brand-accent:${theme.success};`,
    `--brand-800:${theme.primaryHover};`,
    `--brand-900:${theme.textPrimary};`,
    `--surface:${theme.surfaceWarm};`,
    `--font-heading:${theme.fontHeading};`,
    `--font-body:${theme.fontBody};`,
  ].join('');
}

module.exports = {
  resolveTheme,
  themeCss,
};
