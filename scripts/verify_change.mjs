#!/usr/bin/env node
/** One orchestration path for manual verification and the staged-file hook. */
import path from 'node:path';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { checksFor } from './verification/change-plan.mjs';
import { hasScreenshotArtifacts, SCREENSHOT_MANIFEST } from './verification/screenshots.mjs';
import { assertIndexMatches, command, ensureBuild, fingerprint, recordCheck, reusableCheck, timed, verificationTools } from './verification/state.mjs';

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
      if (['contracts:representatives', 'contracts:all'].includes(check) || check.startsWith('contracts:targets:')) {
        names = check === 'contracts:representatives' ? ['marketing', 'practice-drdronavalli', 'preview-all'] : check.startsWith('contracts:targets:') ? check.slice(18).split(',') : [];
        command(process.execPath, ['scripts/verification/verify_output_contracts.mjs', '--check', ...(names.length ? [`--targets=${names.join(',')}`] : []), ...(fresh ? ['--fresh'] : [])], { stdio: 'inherit' });
      } else if (check === 'tooling') {
        for (const file of verificationTools.filter(file => file.endsWith('.mjs') && existsSync(file))) command(process.execPath, ['--check', file]);
        command(process.execPath, ['--test', 'tests/verification/verification-state.test.mjs'], { stdio: 'inherit' });
      } else if (check.startsWith('test:')) {
        const file = check.slice(5);
        const files = existsSync(file) ? [file] : readdirSync('tests/verification').filter(name => name.endsWith('.test.mjs')).map(name => `tests/verification/${name}`);
        command(process.execPath, ['--test', ...files], { stdio: 'inherit' });
      } else if (check.startsWith('spec:')) {
        const file = check.slice(5);
        command(path.resolve('node_modules/.bin/playwright'), ['test', '--config=playwright.config.mjs', ...(existsSync(file) ? [file] : [])], {
          stdio: 'inherit', env: { ...process.env, FRONTDOOR_CAPTURE_SCREENSHOTS: '', FRONTDOOR_STAGING: '', FRONTDOOR_TEST_SCOPE: '', FRONTDOOR_TEST_SITE: '', FRONTDOOR_TEST_PREVIEW_SITE: 'ALL' },
        });
        names = ['marketing', 'practice-drdronavalli', 'preview-all'];
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
    if (!check.startsWith('site:') && !check.startsWith('contracts:targets:') && check !== 'contracts:all') recordCheck(check, names, input);
    if (fingerprint() !== input) throw new Error('Verification inputs changed during checks; rerun verification.');
  }
  if (staged && !dryRun && checks.length) assertIndexMatches();
}

export function passedBrowserSuites(report, suites, screenshots = false) {
  const specs = [];
  const visit = group => {
    specs.push(...(group.specs || []));
    for (const child of group.suites || []) visit(child);
  };
  visit(report);
  const tags = { themes: 'theme-polish', providers: 'provider-experience', analytics: 'analytics', visual: 'visual' };
  return suites.filter(suite => {
    const pattern = new RegExp(`@${tags[suite]}(?: |$)${screenshots && suite === 'providers' ? '|@provider-screenshots(?: |$)' : ''}${screenshots && suite === 'themes' ? '|@review-screenshots(?: |$)' : ''}`);
    const matching = specs.filter(spec => pattern.test(spec.title));
    const passed = test => test.results?.at(-1)?.status === 'passed';
    // Visual's extra local-asset check intentionally runs only with --scope=practice.
    const expectedVisualSkip = test => suite === 'visual' && test.expectedStatus === 'skipped' && test.results?.at(-1)?.status === 'skipped';
    return !report.errors?.length && matching.some(spec => spec.tests?.some(passed)) &&
      matching.every(spec => spec.tests?.length && spec.tests.every(test => passed(test) || expectedVisualSkip(test)));
  });
}

export function reusableBrowserCheck(suite, screenshots = false) {
  const prefix = `browser:${suite}:all-targets:`;
  if (!screenshots) return reusableCheck(`${prefix}assertions`) || reusableCheck(`${prefix}screenshots`);
  return reusableCheck(`${prefix}screenshots`) &&
    (!['themes', 'providers'].includes(suite) || hasScreenshotArtifacts(suite, fingerprint()));
}

function browserChecks(suites, { dryRun, fresh, screenshots = false }) {
  const tags = { themes: 'theme-polish', providers: 'provider-experience', analytics: 'analytics', visual: 'visual' };
  const receipt = suite => `browser:${suite}:all-targets:${screenshots ? 'screenshots' : 'assertions'}`;
  const pending = suites.filter(suite => {
    console.log(`Required check: ${receipt(suite)}`);
    if (!dryRun && !fresh && reusableBrowserCheck(suite, screenshots)) {
      console.log(`Reusing verified checks: ${receipt(suite)}`);
      return false;
    }
    return true;
  });
  if (dryRun || !pending.length) return;
  const input = fingerprint();
  const reportPath = path.resolve('.tmp/verification-browser-results.json');
  rmSync(reportPath, { force: true });
  let failure;
  try {
    timed('browser checks', () => command(path.resolve('node_modules/.bin/playwright'), [
      'test', '--config=playwright.config.mjs', '--reporter=line,json', '--grep', pending.map(suite => `@${tags[suite]}(?: |$)`).concat(screenshots && pending.includes('providers') ? ['@provider-screenshots(?: |$)'] : [], screenshots && pending.includes('themes') ? ['@review-screenshots(?: |$)'] : []).join('|'),
    ], { stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath, FRONTDOOR_CAPTURE_SCREENSHOTS: screenshots ? '1' : '', FRONTDOOR_STAGING: '', FRONTDOOR_TEST_SCOPE: '', FRONTDOOR_TEST_SITE: '', FRONTDOOR_TEST_PREVIEW_SITE: 'ALL' } }));
  } catch (error) { failure = error; }
  const passed = existsSync(reportPath) ? passedBrowserSuites(JSON.parse(readFileSync(reportPath, 'utf8')), pending, screenshots) : [];
  for (const suite of passed) recordCheck(receipt(suite), ['marketing', 'practice-drdronavalli', 'preview-all'], input);
  if (failure) throw failure;
  if (passed.length !== pending.length) throw new Error('Browser report did not confirm all required suites passed.');
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
    const plan = args.includes('--all') ? ['contracts:all', 'browser:themes', 'browser:providers', 'browser:analytics'] : checksFor(files);
    let checks = plan.filter(check => !check.startsWith('browser:') && check !== 'screenshots');
    if (checks.some(check => check.startsWith('site:') && !existsSync(path.join('sites', check.slice(5), 'practice.json')))) {
      checks = [...checks.filter(check => !check.startsWith('site:')), 'contracts:all'];
    }
    const screenshots = args.includes('--screenshots') || plan.includes('screenshots');
    const suites = [...new Set((args.find(arg => arg.startsWith('--browser='))?.slice(10) || '').split(',').filter(Boolean).concat(plan.filter(check => check.startsWith('browser:')).map(check => check.slice(8))))].sort();
    if (screenshots && !suites.some(suite => ['themes', 'providers'].includes(suite))) {
      throw new Error('Screenshot capture requires a selected themes or providers suite. Add --browser=themes or --browser=providers; pixel comparisons use --browser=visual separately.');
    }
    if (suites.some(suite => !['themes', 'providers', 'analytics', 'visual'].includes(suite))) {
      throw new Error('Supported --browser suites: themes,providers,analytics,visual');
    }
    timed('verification total', () => {
      runChecks(checks, { dryRun, staged, fresh });
      browserChecks(suites, { dryRun, fresh, screenshots });
      if (screenshots && !dryRun) console.log(`Screenshot manifest: ${SCREENSHOT_MANIFEST}. Open and visually inspect affected captures before reporting completion.`);
      if (staged && !dryRun && suites.length) assertIndexMatches();
    });
    if (!checks.length && !suites.length) console.log('No build checks required for these files.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
