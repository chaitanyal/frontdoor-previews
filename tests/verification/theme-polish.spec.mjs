import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installDeterministicBrowser, installMockNetwork, waitForImages } from './helpers/static-site.mjs';

const sites = [
  ['drdronavalli', 'practice', 'calm-healthcare'],
  ['centexmh', 'preview/previews/centexmh', 'editorial-healthcare'],
  ['northwestpsychiatry', 'preview/previews/northwestpsychiatry', 'structured-clinical'],
  ['mariposa', 'preview/previews/mariposa', 'editorial-healthcare'],
];

for (const [slug, output, theme] of sites) {
  test(`@theme-polish ${slug}: responsive hierarchy, footer destinations, and retained actions`, async ({ page }) => {
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
        const footerLinks = page.locator('footer nav a');
        for (const link of await footerLinks.all()) {
          const href = await link.getAttribute('href');
          const destination = new URL(href, page.url());
          expect(destination.protocol).toBe('file:');
          const file = fileURLToPath(destination);
          const destinationFile = file.endsWith('/') ? path.join(file, 'index.html') : file;
          expect(existsSync(destinationFile), destinationFile).toBe(true);
          if (destination.hash) expect(readFileSync(destinationFile, 'utf8')).toContain(`id="${destination.hash.slice(1)}"`);
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
