/** Explicit behavior routing; unknown or mixed website impact retains full coverage. */
import { relevantInput } from './state.mjs';

export function checksFor(files) {
  const relevant = files.filter(relevantInput);
  const checks = [];
  const places = relevant.filter(file => file.startsWith('places-worker/'));
  if (places.length) {
    checks.push('places:typecheck', 'places:test');
    if (places.includes('places-worker/wrangler.toml')) checks.push('places:config');
  }
  const website = relevant.filter(file => !file.startsWith('places-worker/'));
  if (!website.length) return checks;
  const siteFor = file => file.match(/^sites\/([^/]+)\//)?.[1];
  const contractFor = file => file.match(/^tests\/verification\/contracts\/practice-([a-z0-9-]+)\.json$/)?.[1];
  const sites = new Set(website.map(siteFor).filter(Boolean));
  const styling = file => file === 'shared/styles/frontdoor.css';
  const providers = file => /^src\/components\/practice\/Provider[^/]+\.astro$/.test(file) || file === 'src/lib/provider-team.mjs';
  const navigation = file => [
    'src/components/practice/PracticeHeader.astro', 'src/components/practice/PracticeFooter.astro',
    'src/components/marketing/HomeHeader.astro', 'src/components/marketing/MarketingFooter.astro',
    'src/lib/home-sections.mjs',
  ].includes(file);
  const analytics = file => /^(?:analytics-worker\/|functions\/|shared\/(?:analytics|attribution|google-ads)\.js$)/.test(file) || file === 'src/components/practice/CopyEmailScript.astro' || file === 'src/components/marketing/PreviewRequestForm.astro';
  const infrastructure = file => /^(?:scripts\/|src\/(?:entries|layouts)\/)/.test(file) || /^(?:package(?:-lock)?\.json|astro\.config\.mjs|tailwind\.config\.js|shared\/themes\.json)$/.test(file) || /^src\/lib\/(?:practice-data|preview-paths|seo|sitemap)\.mjs$/.test(file);
  if (sites.size && !sites.has('template') && website.every(file => siteFor(file) || sites.has(contractFor(file)))) {
    checks.push(...[...sites].sort().map(site => `site:${site}`));
  } else if (website.every(file => file.startsWith('marketing/') || file.startsWith('src/entries/marketing/') || file.startsWith('src/components/marketing/')) && !website.some(analytics)) {
    checks.push('contracts:marketing');
  } else if (website.every(styling)) {
    // Preview ALL contains editorial, structured and reflective representatives.
    checks.push('contracts:representatives', 'browser:themes', 'screenshots');
  } else if (website.every(providers)) {
    checks.push('contracts:all', 'browser:providers', 'browser:analytics');
  } else if (website.every(analytics)) {
    checks.push('contracts:all', 'browser:analytics');
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
  return [...new Set(checks)];
}

// Include the previous eligibility when a practice stops being published as a preview.
export function affectsMarketing(site, config, featuredPractice, previous = {}) {
  return featuredPractice === site || config.seo?.allowIndexing === false || previous.seo?.allowIndexing === false;
}
