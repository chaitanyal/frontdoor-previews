import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveTheme } from './themes.mjs';

const VALID_SLUG = /^[a-z0-9-]+$/;

function practiceConfigPath(repoRoot, slug) {
  if (!VALID_SLUG.test(slug) || slug === 'template') {
    throw new Error(`Unknown practice slug: ${slug}`);
  }

  const configPath = path.join(repoRoot, 'sites', slug, 'practice.json');
  if (!existsSync(configPath)) {
    throw new Error(`Unknown practice slug: ${slug}`);
  }
  return configPath;
}

function validatePractice(repoRoot, configPath) {
  const result = spawnSync(
    'python3',
    [path.join(repoRoot, 'scripts', 'validate_practice_json.py'), configPath],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  if (result.error) {
    throw new Error(`Unable to validate ${configPath}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `Invalid practice config: ${configPath}`);
  }
}

export async function loadPracticeData(repoRoot, slug) {
  const configPath = practiceConfigPath(repoRoot, slug);
  validatePractice(repoRoot, configPath);

  const [configSource, themesSource] = await Promise.all([
    readFile(configPath, 'utf8'),
    readFile(path.join(repoRoot, 'shared', 'themes.json'), 'utf8'),
  ]);
  const config = JSON.parse(configSource);
  const themes = JSON.parse(themesSource);

  config.practice = {
    ...config.practice,
    slug: config.practice?.slug || slug,
  };

  return {
    config,
    configPath,
    slug,
    theme: resolveTheme(config, themes),
  };
}

export async function listEligiblePreviewSlugs(repoRoot) {
  const entries = await readdir(path.join(repoRoot, 'sites'), { withFileTypes: true });
  const slugs = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name === 'template') continue;
    const { config } = await loadPracticeData(repoRoot, entry.name);
    if (config.seo?.allowIndexing === false) {
      slugs.push(entry.name);
    }
  }

  return slugs;
}
