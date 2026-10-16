import { test, expect } from '@playwright/test';
import { captureScreenshot } from '../../scripts/verification/screenshots.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { installDeterministicBrowser, installMockNetwork, waitForImages } from './helpers/static-site.mjs';

const centexUrl = 'https://frontdoor.health/previews/centexmh/';

test('@provider-experience Westlake fictional pages retain disclosures, disabled actions and responsive layouts', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  const root = path.resolve('.tmp/astro-dist/preview/previews/westlakepsychiatry');
  const config = JSON.parse(readFileSync('sites/westlakepsychiatry/practice.json', 'utf8'));
  const routes = ['', 'privacy/', 'accessibility/', 'terms/',
    ...config.providers.map(provider => `providers/${provider.slug}/`),
    ...config.treatments.map(treatment => `treatment/${treatment.slug}/`)];
  const capture = process.env.FRONTDOOR_CAPTURE_SCREENSHOTS === '1';
  const screenshots = path.resolve('.tmp/provider-experience/westlakepsychiatry');
  if (capture) mkdirSync(screenshots, { recursive: true });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(pathToFileURL(path.join(root, route, 'index.html')).href);
      await page.addStyleTag({ content: '.fade-in-up{opacity:1!important;transform:none!important}' });
      await page.evaluate(() => document.fonts.ready);
      await waitForImages(page.locator('img'));
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      await expect(page.getByRole('complementary', { name: 'Website concept disclosure' })).toContainText('A fictional practice.');
      const schemaTypes = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts => scripts.map(script => JSON.parse(script.textContent)['@type']));
      expect(schemaTypes.every(type => type === 'WebPage')).toBe(true);
      await expect(page.locator('a[href^="tel:"], a[href^="mailto:"], [data-copy-email], [data-frontdoor-cta="phone"], [data-frontdoor-cta="newPatient"], [data-frontdoor-cta="existingPatient"]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (!route) {
        await expect(page.locator('#care-options')).toContainText('Psychiatry, therapy, or both.');
        await expect(page.locator('.home-financial [aria-disabled="true"]')).toHaveCount(2);
        await expect(page.locator('.home-appointment [aria-disabled="true"]')).toHaveCount(3);
        const surfaces = await page.locator('.home-financial, .home-appointment, .home-location').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor));
        expect(surfaces[0]).not.toBe(surfaces[1]);
        expect(surfaces[1]).not.toBe(surfaces[2]);
      }
      if (capture && width !== 768 && !['privacy/', 'accessibility/', 'terms/'].includes(route)) {
        await captureScreenshot(page, path.join(screenshots, `${width}-${route.replaceAll('/', '-') || 'home'}.png`), { suite: 'providers' });
      }
    }
  }
});

test('@provider-experience featured team, directory and profiles work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    const network = await installMockNetwork(page);
    await page.goto(centexUrl);
    await expect(page.locator('.home-providers .provider-card')).toHaveCount(3);
    expect(await page.locator('.home-providers .provider-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')))).toEqual([
      './providers/michael-musgrove/', './providers/julie-williams/', './providers/emily-morris/',
    ]);
    await page.getByRole('link', { name: 'View all 7 providers' }).click();
    await expect(page).toHaveURL(`${centexUrl}providers/`);
    await expect(page.locator('.provider-card')).toHaveCount(7);
    await expect(page.locator('.provider-card').filter({ hasText: 'Julie Williams' }).locator('.provider-card-credentials')).toHaveText('Certified Physician Assistant');
    const team = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts => scripts.map(script => JSON.parse(script.textContent)).find(schema => schema['@type'] === 'ItemList'));
    expect(team.numberOfItems).toBe(7);
    await page.locator('.provider-card').filter({ hasText: 'Julie Williams' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`${centexUrl}providers/julie-williams/`);
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Providers' }).click();
    await expect(page).toHaveURL(`${centexUrl}providers/`);
    expect(network.unexpectedRequests).toEqual([]);
  } finally { await context.close(); }
});

test('@provider-experience profiles preserve biographies and lead with mobile identity across themes', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  for (const slug of ['drdronavalli', 'centexmh', 'mariposa', 'mayabennett', 'northwestpsychiatry', 'northhillspsychiatry']) {
    const config = JSON.parse(readFileSync(`sites/${slug}/practice.json`, 'utf8'));
    const base = slug === 'drdronavalli' ? 'https://drdronavalli.com/' : `https://frontdoor.health/previews/${slug}/`;
    for (const provider of config.providers) {
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`${base}providers/${provider.slug}/`);
        await expect(page.locator('h1')).toHaveText(provider.name);
        if (/\bPA-C\b/.test(provider.credentials || '')) {
          await expect(page.locator('.provider-credentials')).toHaveText('Certified Physician Assistant');
          await expect(page.locator('.provider-hero-title')).toHaveCount(0);
        }
        if (slug === 'mayabennett') {
          await expect(page.locator('.provider-credentials')).toHaveText('PhD · Clinical psychologist');
          await expect(page.locator('.provider-hero-title')).toHaveCount(0);
        }
        await expect(page.locator('.provider-body-copy > p')).toHaveCount(provider.bioParagraphs?.length || 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (width < 1024) {
          const name = await page.locator('h1').boundingBox();
          const portrait = await page.locator('.provider-portrait').boundingBox();
          expect(name.y + name.height).toBeLessThan(portrait.y);
          expect(portrait.width).toBeLessThanOrEqual(224);
        }
      }
    }
  }
});

test('@provider-experience directory scales to long names and 25 cards without overflow', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  for (const theme of ['calm-healthcare', 'editorial-healthcare', 'structured-clinical']) {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${centexUrl}providers/`);
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        const grid = document.querySelector('.provider-card-grid');
        const template = grid.firstElementChild.cloneNode(true);
        grid.replaceChildren();
        for (let index = 0; index < 25; index++) {
          const card = template.cloneNode(true);
          card.querySelector('.provider-card-name').textContent = 'Long Provider Name for Layout Verification';
          const identity = card.querySelector('.provider-card-identity');
          const credentials = document.createElement('p');
          credentials.className = 'provider-card-credentials';
          credentials.textContent = 'Long credentials for layout verification';
          identity.append(credentials);
          grid.append(card);
        }
      }, theme);
      await expect(page.locator('.provider-card')).toHaveCount(25);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('.provider-card-grid').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length)).toBe(width < 768 ? 1 : width < 1280 ? 2 : 3);
    }
  }
});

test('@provider-screenshots captures local homepage, directory and profile layouts', async ({ page }) => {
  test.skip(process.env.FRONTDOOR_CAPTURE_SCREENSHOTS !== '1', 'Opt-in screenshot capture');
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  const output = path.resolve('.tmp/provider-experience');
  mkdirSync(output, { recursive: true });
  const pages = [
    ['centex-home', 'preview/previews/centexmh/index.html', '.home-providers'],
    ['centex-directory', 'preview/previews/centexmh/providers/index.html', '.provider-directory'],
    ['centex-profile', 'preview/previews/centexmh/providers/michael-musgrove/index.html', '.provider-hero'],
    ['centex-pa-profile', 'preview/previews/centexmh/providers/julie-williams/index.html', '.provider-hero'],
    ['drdronavalli-home', 'practice/index.html', '.home-providers'],
    ['drdronavalli-profile', 'practice/providers/goutham-dronavalli/index.html', '.provider-hero'],
    ['northwest-profile', 'preview/previews/northwestpsychiatry/providers/kathleen-nguyen/index.html', '.provider-hero'],
    ['mariposa-profile', 'preview/previews/mariposa/providers/alba-lara/index.html', '.provider-hero'],
  ];
  for (const [name, file, selector] of pages) {
    for (const [label, width] of [['mobile', 390], ['desktop', 1440]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(pathToFileURL(path.resolve('.tmp/astro-dist', file)).href);
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}.fade-in-up{opacity:1!important;transform:none!important}' });
      const section = page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      await waitForImages(section.locator('img'));
      await page.evaluate(() => document.fonts.ready);
      await captureScreenshot(page, path.join(output, `${name}-${label}.png`), { selector, suite: 'providers' });
    }
  }
});
