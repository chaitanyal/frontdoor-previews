/** Explicit behavior routing; unknown or mixed website impact retains full coverage. */
import { relevantInput, verificationTools } from './state.mjs';

export function checksFor(files) {
  const relevant = files.filter(relevantInput);
  const checks = [];
  const places = relevant.filter(file => file.startsWith('places-worker/'));
  if (places.length) {
    checks.push('places:typecheck', 'places:test');
    if (places.includes('places-worker/wrangler.toml')) checks.push('places:config');
  }
  const tooling = relevant.filter(file => verificationTools.includes(file) || file === 'tests/verification/verification-state.test.mjs');
  if (tooling.length) checks.push('tooling');
  const tests = relevant.filter(file => /^tests\/verification\/[^/]+\.test\.mjs$/.test(file) && !tooling.includes(file));
  checks.push(...tests.map(file => `test:${file}`));
  const specs = relevant.filter(file => /^tests\/verification\/[^/]+\.spec\.mjs$/.test(file));
  const browserSpecs = { 'theme-polish': 'themes', 'provider-experience': 'providers', analytics: 'analytics', visual: 'visual' };
  checks.push(...specs.map(file => browserSpecs[file.split('/').at(-1).slice(0, -9)] ? `browser:${browserSpecs[file.split('/').at(-1).slice(0, -9)]}` : `spec:${file}`));
  const baselines = relevant.filter(file => file.startsWith('tests/verification/visual-baselines/'));
  if (baselines.length) checks.push('browser:visual');
  const contracts = relevant.filter(file => /^tests\/verification\/contracts\/[^/]+\.json$/.test(file));
  if (contracts.length) checks.push(`contracts:targets:${contracts.map(file => file.split('/').at(-1).slice(0, -5)).sort().join(',')}`);
  const website = relevant.filter(file => !file.startsWith('places-worker/') &&
    ![...tooling, ...tests, ...specs, ...baselines, ...contracts].includes(file));
  if (!website.length) return [...new Set(checks)];
  const siteFor = file => file.match(/^sites\/([^/]+)\//)?.[1];
  const sites = new Set(website.map(siteFor).filter(Boolean));
  const styling = file => file === 'shared/styles/frontdoor.css';
  const providers = file => /^src\/components\/practice\/Provider[^/]+\.astro$/.test(file) || file === 'src/lib/provider-team.mjs';
  const navigation = file => [
    'src/components/practice/PracticeHeader.astro', 'src/components/practice/PracticeFooter.astro',
    'src/components/marketing/HomeHeader.astro', 'src/components/marketing/MarketingFooter.astro',
    'src/lib/home-sections.mjs',
  ].includes(file);
  const analytics = file => /^(?:analytics-worker\/|functions\/|shared\/(?:analytics|attribution|google-ads)\.js$)/.test(file) || file === 'src/components/practice/CopyEmailScript.astro' || file === 'src/components/marketing/PreviewRequestForm.astro';
  const infrastructure = file => /^(?:scripts\/|tests\/|src\/(?:entries|layouts)\/)/.test(file) || /^(?:package(?:-lock)?\.json|astro\.config\.mjs|tailwind\.config\.js|shared\/themes\.json)$/.test(file) || /^src\/lib\/(?:practice-data|preview-paths|seo|sitemap)\.mjs$/.test(file);
  if (sites.size && !sites.has('template') && website.every(siteFor)) {
    checks.push(...[...sites].sort().map(site => `site:${site}`));
  } else if (website.every(file => file.startsWith('marketing/') || file.startsWith('src/entries/marketing/') || file.startsWith('src/components/marketing/')) && !website.some(analytics)) {
    checks.push('contracts:marketing');
  } else if (website.every(styling)) {
    // Preview ALL contains editorial, structured and reflective representatives.
    checks.push('contracts:representatives', 'browser:themes', 'screenshots');
  } else if (website.every(providers)) {
    checks.push('contracts:representatives', 'browser:providers', 'browser:analytics');
  } else if (website.every(analytics)) {
    checks.push(website.every(file => file.startsWith('src/components/marketing/') || file.startsWith('functions/')) ? 'contracts:marketing' : 'contracts:representatives', 'browser:analytics');
  } else {
    checks.push('contracts:all');
    if (website.some(infrastructure)) checks.push('browser:themes', 'browser:providers', 'browser:analytics');
    else {
      if (website.some(styling)) checks.push('browser:themes', 'screenshots');
      if (website.some(providers)) checks.push('browser:providers', 'browser:analytics');
      if (website.some(analytics)) checks.push('browser:analytics');
    }
  }
  // Apply after target routing so marketing-only and mixed edits retain their gates.
  if (website.some(navigation)) checks.push('browser:themes');
  return [...new Set(checks)].filter(check => !check.startsWith('contracts:targets:') || !checks.includes('contracts:all'));
}

// Include the previous eligibility when a practice stops being published as a preview.
export function affectsMarketing(site, config, featuredPractice, previous = {}) {
  return featuredPractice === site || config.seo?.allowIndexing === false || previous.seo?.allowIndexing === false;
}
