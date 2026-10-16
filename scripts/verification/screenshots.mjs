import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const SCREENSHOT_MANIFEST = path.resolve('.tmp/visual-review/manifest.json');

function readManifest() {
  try { return JSON.parse(readFileSync(SCREENSHOT_MANIFEST, 'utf8')); }
  catch { return null; }
}

export function prepareScreenshotManifest(input) {
  if (readManifest()?.input === input) return;
  mkdirSync(path.dirname(SCREENSHOT_MANIFEST), { recursive: true });
  writeFileSync(SCREENSHOT_MANIFEST, JSON.stringify({ input, screenshots: [] }, null, 2) + '\n');
}

export function hasScreenshotArtifacts(suite, input) {
  const manifest = readManifest();
  if (manifest?.input !== input) return false;
  const entries = manifest.screenshots?.filter(entry => entry.suite === suite);
  return Boolean(entries?.length && entries.every(entry => existsSync(path.resolve(entry.file))));
}

/** Capture a stable review image and register its page, viewport, and optional section. */
export async function captureScreenshot(page, file, { selector, suite = 'themes' } = {}) {
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = 'eager';
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  await page.mouse.move(0, 0);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  mkdirSync(path.dirname(file), { recursive: true });
  const target = selector ? page.locator(selector) : page;
  await target.screenshot({ path: file, ...(!selector && { fullPage: true }), animations: 'disabled' });
  const manifest = readManifest();
  if (!manifest) throw new Error('Screenshot manifest missing; enable FRONTDOOR_CAPTURE_SCREENSHOTS in the verification runner.');
  const entry = { file: path.relative(process.cwd(), file), suite, page: page.url(), viewport: page.viewportSize(), selector: selector || null };
  manifest.screenshots = manifest.screenshots.filter(item => item.file !== entry.file);
  manifest.screenshots.push(entry);
  manifest.screenshots.sort((left, right) => left.file.localeCompare(right.file));
  writeFileSync(SCREENSHOT_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}
