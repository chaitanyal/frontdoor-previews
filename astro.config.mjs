import { defineConfig } from 'astro/config';

const target = process.env.FRONTDOOR_TARGET;
const site = process.env.FRONTDOOR_ASTRO_SITE;
const validTargets = new Set(['marketing', 'practice', 'preview']);

if (!validTargets.has(target)) {
  throw new Error(
    'FRONTDOOR_TARGET must be marketing, practice, or preview. Run Astro through scripts/build_astro.mjs.',
  );
}

if (!site) {
  throw new Error(
    'FRONTDOOR_ASTRO_SITE is required. Run Astro through scripts/build_astro.mjs.',
  );
}

export default defineConfig({
  output: 'static',
  site,
  trailingSlash: 'always',
  srcDir: `./src/entries/${target}`,
  publicDir: `./.tmp/astro-public/${target}`,
  outDir: `./.tmp/astro-dist/${target}`,
  build: {
    format: 'directory',
  },
});
