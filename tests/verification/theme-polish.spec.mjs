import { test, expect } from '@playwright/test';
import { captureScreenshot } from '../../scripts/verification/screenshots.mjs';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installDeterministicBrowser, installMockNetwork, waitForImages } from './helpers/static-site.mjs';

const guidanceCatalog = JSON.parse(readFileSync('shared/content/care-guidance.json', 'utf8'));

function concernCount(config) {
  const entries = config.careGuidance.contentKeys.map(key => guidanceCatalog[key]);
  return (config.careGuidance.concernIds || entries[0].defaultConcernIds ||
    [...new Set(entries.flatMap(entry => entry.concerns.map(concern => concern.id)))]).length;
}

async function verifyNavigationDestinations(page, selector) {
  const links = page.locator(selector);
  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    const destination = new URL(await link.getAttribute('href'), page.url());
    if (['tel:', 'mailto:'].includes(destination.protocol)) continue;
    expect(destination.protocol).toBe('file:');
    const file = fileURLToPath(destination);
    const destinationFile = file.endsWith('/') ? path.join(file, 'index.html') : file;
    expect(existsSync(destinationFile), destinationFile).toBe(true);
    if (destination.hash) expect(readFileSync(destinationFile, 'utf8')).toContain(`id="${destination.hash.slice(1)}"`);
    if (await link.isVisible()) {
      expect(Number(await link.getAttribute('tabindex') ?? 0)).toBeGreaterThanOrEqual(0);
      await link.focus();
      await expect(link).toBeFocused();
    }
  }
}

const sites = [
  ['drdronavalli', 'practice', 'calm-healthcare'],
  ['centexmh', 'preview/previews/centexmh', 'editorial-healthcare'],
  ['northwestpsychiatry', 'preview/previews/northwestpsychiatry', 'structured-clinical'],
  ['mariposa', 'preview/previews/mariposa', 'editorial-healthcare'],
];

for (const [slug, output, theme] of sites) {
  test(`@theme-polish ${slug}: responsive hierarchy, header/footer destinations, and retained actions`, async ({ page }) => {
    await installDeterministicBrowser(page);
    await installMockNetwork(page);
    const config = JSON.parse(readFileSync(`sites/${slug}/practice.json`, 'utf8'));
    const root = path.resolve('.tmp/astro-dist', output);
    const screenshots = path.resolve('.tmp/theme-polish', slug);
    const capture = process.env.FRONTDOOR_CAPTURE_SCREENSHOTS === '1';
    if (capture) mkdirSync(screenshots, { recursive: true });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['', `providers/${config.providers[0].slug}/`, 'privacy/']) {
        await page.goto(pathToFileURL(path.join(root, route, 'index.html')).href);
        await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}.fade-in-up{opacity:1!important;transform:none!important}' });
        await page.evaluate(() => document.fonts.ready);
        await waitForImages(page.locator('img'));
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await verifyNavigationDestinations(page, 'footer nav a');
        if (!route || route.startsWith('providers/')) {
          await verifyNavigationDestinations(page, 'header a');
          if (slug === 'drdronavalli') {
            const appointmentLinks = page.locator(`a[href="${config.practice.defaultAppointmentUrl}"]`);
            expect(await appointmentLinks.count()).toBeGreaterThan(0);
            for (const link of await appointmentLinks.all()) await expect(link).toHaveAccessibleName(/\S/);
          }
        }
        for (const link of await page.locator('footer nav a').all()) {
          const box = await link.boundingBox();
          expect(box.height).toBeGreaterThanOrEqual(44);
        }

        if (!route) {
          const headerHeight = (await page.locator('header').boundingBox()).height;
          for (const section of await page.locator('main section[id]').all()) {
            expect(await section.evaluate(el => parseFloat(getComputedStyle(el).scrollMarginTop))).toBeGreaterThanOrEqual(headerHeight);
          }
          if (config.careGuidance) {
            const guidance = page.locator('.home-care-guidance');
            await expect(guidance).toHaveAttribute('id', config.careGuidance.replaceConditions ? 'conditions' : 'care-guidance');
            await expect(guidance.locator('.care-concerns > li')).toHaveCount(concernCount(config));
            await expect(guidance.locator('.care-guidance-explanation')).toHaveCount(0);
            const order = await page.locator('.home-care-guidance, .home-providers, .home-conditions').evaluateAll(items => items.map(item => item.id));
            expect(order).toEqual([config.careGuidance.replaceConditions ? 'conditions' : 'care-guidance', 'providers', ...(config.conditions?.length && !config.careGuidance.replaceConditions ? ['conditions'] : [])]);
            await expect(page.locator('.home-conditions')).toHaveCount(config.conditions?.length && !config.careGuidance.replaceConditions ? 1 : 0);
            if (!config.careGuidance.replaceConditions) for (const condition of config.conditions || []) await expect(page.locator('.home-conditions')).toContainText(condition);
            if (capture) await captureScreenshot(page, path.join(screenshots, `${width}-care-guidance.png`), { selector: '.home-care-guidance' });
          }
          if (theme === 'structured-clinical' && await page.locator('.home-resources').count()) {
            const resources = page.locator('.home-resources .patient-resource-list');
            await expect(resources).toHaveCSS('border-top-width', '0px');
            await expect(resources).toHaveCSS('border-top-left-radius', '0px');
          }
          const contrast = await page.locator('.section-copy, .eyebrow, footer nav a').evaluateAll(elements => {
            const rgb = value => value.match(/[\d.]+/g).map(Number);
            const luminance = color => color.slice(0, 3).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
            return elements.map(el => {
              let parent = el;
              let background = [255, 255, 255, 1];
              while (parent) {
                const candidate = rgb(getComputedStyle(parent).backgroundColor);
                if ((candidate[3] ?? 1) === 1) { background = candidate; break; }
                parent = parent.parentElement;
              }
              const foreground = rgb(getComputedStyle(el).color);
              const alpha = foreground[3] ?? 1;
              const effective = foreground.slice(0, 3).map((v, i) => alpha * v + (1 - alpha) * background[i]);
              const light = luminance(effective), dark = luminance(background);
              return { text: el.textContent.trim(), ratio: (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05) };
            });
          });
          for (const item of contrast) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
          if (width === 390) {
            if (await page.locator('.home-conditions').count()) expect(await page.locator('.home-conditions').evaluate(el => parseFloat(getComputedStyle(el).paddingTop))).toBeLessThanOrEqual(56);
          }
          if (config.faqs?.length) {
          await expect(page.locator('.home-faq-list summary').first()).toBeVisible();
          const summary = page.locator('.home-faq-list summary').first();
          await summary.focus();
          await page.keyboard.press('Enter');
          await expect(summary.locator('..')).not.toHaveAttribute('open', '');
          }
          for (const selector of ['.home-financial', '.home-location', '.home-faq', '.home-resources', '.practice-footer']) {
            const section = page.locator(selector);
            if (!capture || !(await section.count())) continue;
            await section.scrollIntoViewIfNeeded();
            await captureScreenshot(page, path.join(screenshots, `${width}-${selector.slice(1)}.png`), { selector });
          }
        }
        if (capture && width !== 768) await captureScreenshot(page, path.join(screenshots, `${width}-${route ? route.startsWith('providers') ? 'profile' : 'privacy' : 'home'}.png`));
      }
    }
  });
}


test('@theme-polish care guidance replaces Maya concerns and preserves Centex conditions and treatments', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  for (const slug of ['mayabennett', 'centexmh']) {
    const config = JSON.parse(readFileSync(`sites/${slug}/practice.json`, 'utf8'));
    const root = path.resolve('.tmp/astro-dist/preview-all/previews', slug);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
      await page.evaluate(() => document.fonts.ready);
      const guidance = page.locator('.home-care-guidance');
      await expect(guidance).toHaveCount(1);
      await expect(guidance.locator('.care-concerns > li')).toHaveCount(concernCount(config));
      await expect(guidance.locator('.care-guidance-explanation')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await verifyNavigationDestinations(page, 'header a, footer nav a, .home-care-guidance a');
      if (config.careGuidance.replaceConditions) {
        await expect(guidance).toHaveAttribute('id', 'conditions');
        await expect(page.locator('.home-conditions')).toHaveCount(0);
        await expect(page.locator('[id="conditions"]')).toHaveCount(1);
        const order = await page.locator('.home-care-guidance, .home-providers').evaluateAll(items => items.map(item => item.id));
        expect(order).toEqual(['conditions', 'providers']);
      } else {
        await expect(guidance).toHaveAttribute('id', config.careGuidance.replaceConditions ? 'conditions' : 'care-guidance');
        await expect(page.locator('.home-conditions')).toHaveCount(config.conditions?.length ? 1 : 0);
        const order = await page.locator('.home-care-guidance, .home-providers, .home-conditions, .home-treatments').evaluateAll(items => items.map(item => item.id));
        expect(order).toEqual(['care-guidance', 'providers', ...(config.conditions?.length ? ['conditions'] : []), ...(config.treatments?.length ? ['treatments'] : [])]);
        for (const treatment of config.treatments || []) await expect(page.locator(`.home-treatments a[href="./treatment/${treatment.slug}/"]`)).toHaveCount(1);
      }
      if (process.env.FRONTDOOR_CAPTURE_SCREENSHOTS === '1') {
        const screenshots = path.resolve('.tmp/theme-polish', slug);
        mkdirSync(screenshots, { recursive: true });
        await captureScreenshot(page, path.join(screenshots, `${width}-care-guidance.png`), { selector: '.home-care-guidance' });
      }
    }
  }
  const root = path.resolve('.tmp/astro-dist/preview-all/previews/northhillspsychiatry');
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  const original = JSON.parse(readFileSync('sites/northhillspsychiatry/practice.json', 'utf8'));
  await expect(page.locator('.home-care-guidance')).toHaveCount(original.careGuidance ? 1 : 0);
  await expect(page.locator('.home-conditions')).toHaveCount(original.conditions?.length && !original.careGuidance?.replaceConditions ? 1 : 0);
});

test('@theme-polish fictional psychology concept discloses its identity and accepts no patient inquiries', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  const config = JSON.parse(readFileSync('sites/mayabennett/practice.json', 'utf8'));
  expect(config.fictionalDemo, 'The psychology pilot must remain a fictional demo').toBe(true);
  const root = path.resolve('.tmp/astro-dist/preview-all/previews/mayabennett');
  const screenshots = path.resolve('.tmp/theme-polish/mayabennett');
  const capture = process.env.FRONTDOOR_CAPTURE_SCREENSHOTS === '1';
  if (capture) mkdirSync(screenshots, { recursive: true });
  for (const width of [390, 1440, 2048]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['', ...config.providers.map(provider => `providers/${provider.slug}/`), 'privacy/', 'terms/', 'accessibility/']) {
      await page.goto(pathToFileURL(path.join(root, route, 'index.html')).href);
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}.fade-in-up{opacity:1!important;transform:none!important}' });
      await page.evaluate(() => document.fonts.ready);
      await waitForImages(page.locator('img'));
      await expect(page.locator('.concept-notice')).toContainText('A fictional practice.');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      if (!route) await expect(page.locator('h1')).toHaveText(config.hero.title);
      if (route.startsWith('providers/')) await expect(page.locator('h1')).toHaveText(config.providers.find(provider => route === `providers/${provider.slug}/`).name);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const destinations = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')));
      expect(destinations.some(href => /^(tel:|mailto:)|forms\.gle|docs\.google\.com\/forms/.test(href))).toBe(false);
      expect(await page.locator('form').count()).toBe(0);
      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(schemas.join(' ')).not.toMatch(/"@type"\s*:\s*"(?:MedicalClinic|Physician|Person)"/);
      if (!route || route.startsWith('providers/')) {
        await expect(page.locator('.concept-appointment')).toHaveCSS('background-image', 'none');
        await expect(page.locator('.concept-appointment [aria-disabled="true"]')).toBeVisible();
        await expect(page.locator('.concept-appointment [aria-disabled="true"]')).toHaveText(config.hero.primaryCta);
      }
      if (capture && (!route || route.startsWith('providers/'))) {
        await captureScreenshot(page, path.join(screenshots, `${width}-${route ? 'profile' : 'home'}.png`));
      }
    }
  }
});

test('@theme-polish reflective composition separates mobile imagery and keeps consultation actions available', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  for (const slug of ['mariposa', 'mayabennett']) {
    const root = path.resolve('.tmp/astro-dist/preview-all/previews', slug);
    for (const width of [360, 390, 768, 1024, 1440, 2048]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
      await page.addStyleTag({ content: '.fade-in-up{opacity:1!important;transform:none!important}' });
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const image = await page.locator('.home-hero > img').boundingBox();
      const title = await page.locator('.home-hero-title').boundingBox();
      if (width < 1024) {
        expect(image.y + image.height).toBeLessThanOrEqual(title.y);
        expect(image.height).toBeLessThanOrEqual(352);
      }
      if (width >= 1024) {
        const intro = await page.locator('.home-provider-solo > div').first().boundingBox();
        const card = await page.locator('.home-provider-grid').boundingBox();
        expect(intro.x + intro.width).toBeLessThanOrEqual(card.x);
      }
      if (width < 768) {
        await page.locator('.home-hero-actions').scrollIntoViewIfNeeded();
        await expect(page.locator('.practice-mobile-actions')).toBeHidden();
        await page.locator('.home-location').scrollIntoViewIfNeeded();
        await expect(page.locator('.practice-mobile-actions')).toBeVisible();
      }
    }
  }
});

test('@theme-polish base editorial practices keep team layouts and avoid duplicate mobile appointment controls', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  for (const slug of ['centexmh', 'northhillspsychiatry']) {
    const config = JSON.parse(readFileSync(`sites/${slug}/practice.json`, 'utf8'));
    const cardCount = config.home?.featuredProviderSlugs?.length || config.providers.length;
    const root = path.resolve('.tmp/astro-dist/preview-all/previews', slug);
    for (const width of [360, 390, 768, 1440, 2048]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
      await page.addStyleTag({ content: '.fade-in-up{opacity:1!important;transform:none!important}' });
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('.home-providers a[href*="providers/"]').filter({ has: page.locator('img') })).toHaveCount(cardCount);
      if (width < 768) {
        expect((await page.locator('.home-hero').boundingBox()).height).toBeLessThan(740);
        await page.locator('.home-hero-actions').scrollIntoViewIfNeeded();
        await expect(page.locator('.practice-mobile-actions')).toBeHidden();
        await page.locator('.home-location').scrollIntoViewIfNeeded();
        await expect(page.locator('.practice-mobile-actions')).toBeVisible();
      }
    }
  }
});

test('@theme-polish structured clinical team and mobile appointment controls adapt to available space', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  const config = JSON.parse(readFileSync('sites/northwestpsychiatry/practice.json', 'utf8'));
  const cardCount = config.home?.featuredProviderSlugs?.length || config.providers.length;
  const root = path.resolve('.tmp/astro-dist/preview-all/previews/northwestpsychiatry');
  for (const width of [360, 390, 768, 1024, 1440, 2048]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.addStyleTag({ content: '.fade-in-up{opacity:1!important;transform:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const cards = page.locator('.home-provider-card');
    await expect(cards).toHaveCount(cardCount);
    const boxes = await cards.evaluateAll(cards => cards.map(card => card.getBoundingClientRect().toJSON()));
    const columns = width >= 1280 ? 3 : width >= 768 ? 2 : 1;
    for (let index = 0; index < boxes.length; index++) {
      expect(Math.abs(boxes[index].y - boxes[Math.floor(index / columns) * columns].y)).toBeLessThan(2);
      if (index >= columns) expect(boxes[index].y).toBeGreaterThan(boxes[index - columns].y);
    }
    if (width < 768) {
      expect((await page.locator('.home-hero').boundingBox()).height).toBeLessThan(760);
      await page.locator('.home-hero-actions').scrollIntoViewIfNeeded();
      await expect(page.locator('.practice-mobile-actions')).toBeHidden();
      await page.locator('.home-location').scrollIntoViewIfNeeded();
      await expect(page.locator('.practice-mobile-actions')).toBeVisible();
      await page.goto(pathToFileURL(path.join(root, `providers/${config.providers[0].slug}/index.html`)).href);
      await page.locator('.provider-actions').scrollIntoViewIfNeeded();
      await expect(page.locator('.practice-mobile-actions')).toBeHidden();
      await page.locator('.provider-page-section').first().evaluate((section) => section.scrollIntoView({ block: 'start' }));
      await expect(page.locator('.practice-mobile-actions')).toBeVisible();
    }
  }
});

test('@theme-polish marketing header/footer navigation preserves local destinations and responsive layout', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('https://frontdoor.health/');
    await page.evaluate(() => document.fonts.ready);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    const contrast = await page.locator('#results .text-sage-700').first().evaluate(el => {
      const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => v / 255)
        .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const foreground = luminance(getComputedStyle(el).color);
      const background = luminance(getComputedStyle(el.closest('#results')).backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // The mock serves the unchanged marketing HTML and production stylesheet over HTTPS.
    // Resolve link destinations against the corresponding local file for asset/anchor checks.
    const current = await page.locator('header a, footer a').evaluateAll(links => links.map(link => ({ href: link.getAttribute('href'), visible: Boolean(link.getClientRects().length), tabIndex: link.tabIndex })));
    expect(current.length).toBeGreaterThan(0);
    const root = path.resolve('.tmp/astro-dist/marketing');
    for (const link of current) {
      const destination = new URL(link.href, pathToFileURL(path.join(root, 'index.html')));
      expect(destination.protocol).toBe('file:');
      const file = fileURLToPath(destination);
      const destinationFile = file.endsWith('/') ? path.join(file, 'index.html') : file;
      expect(existsSync(destinationFile), destinationFile).toBe(true);
      if (destination.hash) expect(readFileSync(destinationFile, 'utf8')).toContain(`id="${destination.hash.slice(1)}"`);
      if (link.visible) expect(link.tabIndex).toBeGreaterThanOrEqual(0);
    }
    const contact = page.locator('header a[href="#contact"]:visible').first();
    await contact.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('https://frontdoor.health/#contact');
    const header = await page.locator('header').boundingBox();
    const heading = await page.locator('#contact h2').boundingBox();
    expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height);
  }
});

test('@theme-polish marketing pages use production CSS without JavaScript', async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  try {
    const network = await installMockNetwork(page);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['', 'about/', 'privacy/', 'case-studies/', 'case-studies/drdronavalli/', 'transformations/', '404.html']) {
        await page.goto(`https://frontdoor.health/${route}`);
        await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
        const href = await page.locator('link[rel="stylesheet"]').getAttribute('href');
        expect(new URL(href, page.url()).pathname).toBe('/assets/marketing.css');
        await expect(page.locator('body')).toHaveCSS('font-family', 'Inter, sans-serif');
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 248, 245)');
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('script[src*="tailwind"], [data-verification-test-only]')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
    expect(network.unexpectedRequests).toEqual([]);
  } finally {
    await page.close();
  }
});

test('@theme-polish marketing reduced motion and skip destinations cover secondary pages', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['', 'about/', 'privacy/', 'case-studies/', 'case-studies/drdronavalli/', 'transformations/', '404.html']) {
    await page.goto(`https://frontdoor.health/${route}`);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  }
  await page.goto('https://frontdoor.health/');
  const heroAction = page.locator('a[href="#contact"]').filter({ hasText: 'Request Your Free Preview' });
  await heroAction.hover();
  await expect(heroAction).toHaveCSS('transform', 'none');
  await expect(heroAction).toHaveCSS('transition-duration', '0s');
});

test('@review-screenshots marketing pages and form states use local review captures', async ({ page }) => {
  test.skip(process.env.FRONTDOOR_CAPTURE_SCREENSHOTS !== '1', 'Opt-in screenshot capture');
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  const root = path.resolve('.tmp/astro-dist/marketing');
  const output = path.resolve('.tmp/theme-polish/marketing');
  const routes = [
    ['home', 'index.html'], ['case-study', 'case-studies/drdronavalli/index.html'],
    ['about', 'about/index.html'], ['privacy', 'privacy/index.html'],
    ['case-studies', 'case-studies/index.html'], ['transformations', 'transformations/index.html'],
    ['404', '404.html'],
  ];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, route] of routes) {
      // The 404 response needs HTTP to resolve root-relative assets at arbitrary paths.
      await page.goto(name === '404' ? 'https://frontdoor.health/404.html' : pathToFileURL(path.join(root, route)).href);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await captureScreenshot(page, path.join(output, `${width}-${name}.png`));
      if (name !== 'home') continue;
      for (const [section, selector] of [['hero', 'main > section:first-child'], ['results', '#results'], ['contact', '#contact']]) {
        await captureScreenshot(page, path.join(output, `${width}-${section}.png`), { selector });
      }
      await page.locator('#name').fill('Verification Tester');
      await page.locator('#practiceName').fill('Review Clinic');
      await page.locator('#specialty').selectOption('Psychiatry');
      await page.locator('#email').fill('verification@example.com');
      await page.locator('#website').fill('not a valid website');
      await page.locator('#preview-request-submit').click();
      await expect(page.locator('#website-error')).toBeVisible();
      await captureScreenshot(page, path.join(output, `${width}-form-error.png`), { selector: '#preview-request-form' });
      await page.locator('#website').fill('review.example');
      // Hold this local submission in the loading state without sending a request.
      await page.evaluate(() => {
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, options) => input === '/api/preview-request' ? new Promise(() => {}) : originalFetch(input, options);
      });
      await page.locator('#preview-request-submit').click();
      await expect(page.locator('#preview-request-submit')).toHaveAttribute('aria-busy', 'true');
      await captureScreenshot(page, path.join(output, `${width}-form-loading.png`), { selector: '#preview-request-form' });
    }
  }
});
