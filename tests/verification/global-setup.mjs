import { ensureBuild, fingerprint } from '../../scripts/verification/state.mjs';
import { prepareScreenshotManifest } from '../../scripts/verification/screenshots.mjs';

function runAstroBuild(script, siteId) {
  ensureBuild(script.slice('build:astro:'.length), siteId || '');
}

export default function globalSetup() {
  if (process.env.FRONTDOOR_STAGING === '1') return;
  if (process.env.FRONTDOOR_CAPTURE_SCREENSHOTS === '1') prepareScreenshotManifest(fingerprint());
  const scope = process.env.FRONTDOOR_TEST_SCOPE;
  if (!scope || scope === 'marketing') {
    runAstroBuild('build:astro:marketing');
  }
  if (scope === 'marketing') return;
  runAstroBuild(
    'build:astro:practice',
    process.env.FRONTDOOR_TEST_SITE || 'drdronavalli',
  );
  if (scope === 'practice') return;
  runAstroBuild('build:astro:preview', process.env.FRONTDOOR_TEST_PREVIEW_SITE || 'northhillspsychiatry');
}
