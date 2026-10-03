#!/usr/bin/env node
/** One orchestration path for manual verification and the staged-file hook. */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { checksFor } from './verification/change-plan.mjs';
import { assertIndexMatches, command, ensureBuild, fingerprint, recordCheck, reusableCheck, timed } from './verification/state.mjs';

export function runChecks(checks, { dryRun = false, staged = false, fresh = false } = {}) {
  if (staged && !dryRun && checks.length) assertIndexMatches();
  for (const check of checks) {
    console.log(`Required check: ${check}`);
    if (dryRun) continue;
    if (!fresh && reusableCheck(check)) {
      if (check.startsWith('site:')) ensureBuild('practice', check.slice(5));
      console.log(`Reusing verified checks: ${check}`);
      continue;
    }
    const input = fingerprint();
    let names = [];
    timed(check, () => {
      if (check === 'contracts:all') {
        command(process.execPath, ['scripts/verification/verify_output_contracts.mjs', '--check', ...(fresh ? ['--fresh'] : [])], { stdio: 'inherit' });
      } else if (check.startsWith('site:')) {
        command(process.execPath, ['scripts/verify_site.mjs', check.slice(5), ...(fresh ? ['--fresh'] : [])], { stdio: 'inherit' });
      } else if (check === 'contracts:marketing') {
        names = [ensureBuild('marketing', '', { fresh }).name];
        command(process.execPath, ['scripts/verification/verify_output_contracts.mjs', '--check', '--scope=marketing'], { stdio: 'inherit' });
      } else {
        const script = { 'places:typecheck': 'typecheck:places-worker', 'places:test': 'test:places-worker', 'places:config': 'test:google-maps-config' }[check];
        if (!script) throw new Error(`Unknown verification check: ${check}`);
        command('npm', ['run', script], { stdio: 'inherit' });
      }
    });
    // Full and site commands record their own complete artifact lists.
    if (!check.startsWith('site:') && check !== 'contracts:all') recordCheck(check, names, input);
    if (fingerprint() !== input) throw new Error('Verification inputs changed during checks; rerun verification.');
  }
  if (staged && !dryRun && checks.length) assertIndexMatches();
}

function browserChecks(suites, { dryRun, fresh }) {
  const tags = { themes: 'theme-polish', providers: 'provider-experience', analytics: 'analytics', visual: 'visual' };
  if (suites.some(suite => !tags[suite])) throw new Error('Supported --browser suites: themes,providers,analytics,visual');
  if (!suites.length) return;
  const check = `browser:${suites.join(',')}:all-targets`;
  console.log(`Required check: ${check}`);
  if (dryRun) return;
  if (!fresh && reusableCheck(check)) {
    console.log(`Reusing verified checks: ${check}`);
    return;
  }
  const input = fingerprint();
  timed('browser checks', () => command(path.resolve('node_modules/.bin/playwright'), [
    'test', '--config=playwright.config.mjs', '--grep', suites.map(suite => `@${tags[suite]}(?: |$)`).join('|'),
  ], { stdio: 'inherit', env: { ...process.env, FRONTDOOR_STAGING: '', FRONTDOOR_TEST_SCOPE: '', FRONTDOOR_TEST_SITE: '', FRONTDOOR_TEST_PREVIEW_SITE: 'ALL' } }));
  recordCheck(check, ['marketing', 'practice-drdronavalli', 'preview-all'], input);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const staged = args.includes('--staged');
    const fresh = args.includes('--fresh');
    const supplied = args.filter(arg => arg.startsWith('--file=')).map(arg => arg.slice(7));
    const files = supplied.length ? supplied : command('git', [
      'diff', ...(staged ? ['--cached'] : ['HEAD']), '--no-renames', '--name-only', '-z', '--diff-filter=ACDMRT',
    ]).split('\0').filter(Boolean);
    if (!staged && !supplied.length) files.push(...command('git', ['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean));
    const checks = args.includes('--all') ? ['contracts:all'] : checksFor(files);
    const suites = [...new Set((args.find(arg => arg.startsWith('--browser='))?.slice(10) || '').split(',').filter(Boolean))].sort();
    if (suites.some(suite => !['themes', 'providers', 'analytics', 'visual'].includes(suite))) {
      throw new Error('Supported --browser suites: themes,providers,analytics,visual');
    }
    timed('verification total', () => {
      runChecks(checks, { dryRun, staged, fresh });
      browserChecks(suites, { dryRun, fresh });
    });
    if (!checks.length && !suites.length) console.log('No build checks required for these files.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
