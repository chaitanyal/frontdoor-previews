/** Preserve existing staged-file coverage; finer behavioral selection is deferred. */
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
  if (sites.size && !sites.has('template') && website.every(file => siteFor(file) || sites.has(contractFor(file)))) {
    checks.push(...[...sites].sort().map(site => `site:${site}`));
  } else if (website.every(file => file.startsWith('marketing/') || file.startsWith('src/entries/marketing/'))) {
    checks.push('contracts:marketing');
  } else checks.push('contracts:all');
  return checks;
}
