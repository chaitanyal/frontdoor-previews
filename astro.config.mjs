import { defineConfig } from 'astro/config';

const target = process.env.FRONTDOOR_TARGET;
const site = process.env.FRONTDOOR_ASTRO_SITE;
const outDir = process.env.FRONTDOOR_ASTRO_OUT_DIR;
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

if (!outDir) {
  throw new Error(
    'FRONTDOOR_ASTRO_OUT_DIR is required. Run Astro through scripts/build_astro.mjs.',
  );
}

export default defineConfig({
  output: 'static',
  site,
  trailingSlash: 'always',
  srcDir: `./src/entries/${target}`,
  publicDir: `./.tmp/astro-public/${target}`,
  outDir,
  build: {
    format: 'directory',
  },
});
