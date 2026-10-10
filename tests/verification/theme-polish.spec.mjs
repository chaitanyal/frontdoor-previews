import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installDeterministicBrowser, installMockNetwork, waitForImages } from './helpers/static-site.mjs';

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
        }
        for (const link of await page.locator('footer nav a').all()) {
          const box = await link.boundingBox();
          expect(box.height).toBeGreaterThanOrEqual(44);
        }

        if (!route) {
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
            await section.screenshot({ path: path.join(screenshots, `${width}-${selector.slice(1)}.png`) });
          }
        }
        if (capture && width !== 768) await page.screenshot({ path: path.join(screenshots, `${width}-${route ? route.startsWith('providers') ? 'profile' : 'privacy' : 'home'}.png`), fullPage: true });
      }
    }
  });
}


test('@theme-polish fictional psychology concept discloses its identity and accepts no patient inquiries', async ({ page }) => {
  await installDeterministicBrowser(page);
  await installMockNetwork(page);
  const root = path.resolve('.tmp/astro-dist/preview-all/previews/mayabennett');
  const screenshots = path.resolve('.tmp/theme-polish/mayabennett');
  const capture = process.env.FRONTDOOR_CAPTURE_SCREENSHOTS === '1';
  if (capture) mkdirSync(screenshots, { recursive: true });
  for (const width of [390, 2048]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['', 'providers/maya-bennett/', 'privacy/', 'terms/', 'accessibility/']) {
      await page.goto(pathToFileURL(path.join(root, route, 'index.html')).href);
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}.fade-in-up{opacity:1!important;transform:none!important}' });
      await page.evaluate(() => document.fonts.ready);
      await waitForImages(page.locator('img'));
      await expect(page.locator('.concept-notice')).toContainText('A fictional practice.');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      await expect(page.locator('body')).not.toContainText(/Alba Lara|Mariposa|Columbia University/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const destinations = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')));
      expect(destinations.some(href => /^(tel:|mailto:)|forms\.gle|docs\.google\.com\/forms/.test(href))).toBe(false);
      expect(await page.locator('form').count()).toBe(0);
      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(schemas.join(' ')).not.toMatch(/"@type"\s*:\s*"(?:MedicalClinic|Physician|Person)"/);
      if (!route || route.startsWith('providers/')) {
        await expect(page.locator('.concept-appointment')).toHaveCSS('background-image', 'none');
        await expect(page.locator('.concept-appointment [aria-disabled="true"]')).toBeVisible();
        await expect(page.locator('.concept-appointment [aria-disabled="true"]')).toHaveText('Request a consultation');
      }
      if (capture && (!route || route.startsWith('providers/'))) {
        await page.screenshot({ path: path.join(screenshots, `${width}-${route ? 'profile' : 'home'}.png`), fullPage: true });
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
  for (const [slug, cardCount] of [['centexmh', 3], ['northhillspsychiatry', 2]]) {
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
  const root = path.resolve('.tmp/astro-dist/preview-all/previews/northwestpsychiatry');
  for (const width of [360, 390, 768, 1024, 1440, 2048]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.addStyleTag({ content: '.fade-in-up{opacity:1!important;transform:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const cards = page.locator('.home-provider-card');
    await expect(cards).toHaveCount(3);
    const boxes = await Promise.all([0, 1, 2].map((i) => cards.nth(i).boundingBox()));
    if (width >= 1280) {
      expect(Math.abs(boxes[0].y - boxes[2].y)).toBeLessThan(2);
    } else if (width >= 768) {
      expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(2);
      expect(boxes[2].y).toBeGreaterThan(boxes[0].y);
    }
    if (width < 768) {
      expect((await page.locator('.home-hero').boundingBox()).height).toBeLessThan(760);
      await page.locator('.home-hero-actions').scrollIntoViewIfNeeded();
      await expect(page.locator('.practice-mobile-actions')).toBeHidden();
      await page.locator('.home-location').scrollIntoViewIfNeeded();
      await expect(page.locator('.practice-mobile-actions')).toBeVisible();
      await page.goto(pathToFileURL(path.join(root, 'providers/kathleen-nguyen/index.html')).href);
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
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // The existing mock serves the same marketing artifact over HTTPS with its test CSS.
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
  }
});
