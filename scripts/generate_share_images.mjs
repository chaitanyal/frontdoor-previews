// Render clinic-facing Open Graph assets from practice.json; no verification or network requests.
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const slugs = process.argv.slice(2);
if (!slugs.length || slugs.some((slug) => !/^[a-z0-9-]+$/.test(slug) || slug === 'template')) {
  throw new Error('Usage: node scripts/generate_share_images.mjs <practice-slug> [...]');
}
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const localUrl = (value) => pathToFileURL(path.join(root, value)).href;
const browser = await chromium.launch();
try {
  for (const slug of slugs) {
    const site = path.join(root, 'sites', slug);
    const config = JSON.parse(await readFile(path.join(site, 'practice.json'), 'utf8'));
    const scratch = path.join(root, '.tmp/share-images', slug);
    const output = path.join(site, 'images/social');
    await mkdir(scratch, { recursive: true });
    await mkdir(output, { recursive: true });
    const heroUrl = pathToFileURL(path.resolve(site, config.hero.image)).href;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:Inter;src:url('${localUrl('shared/fonts/inter-latin.woff2')}')}
      @font-face{font-family:Newsreader;src:url('${localUrl('shared/fonts/newsreader-latin.woff2')}')}
      *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f6f4ee;color:#18372f;font-family:Inter,sans-serif}
      .copy{position:relative;z-index:1;padding:48px;width:800px;height:630px}
      .name{font-size:39px;font-weight:650;line-height:1.2;letter-spacing:-1px;margin:0}
      .location{font-size:21px;color:#44685b;margin:14px 0 0}
      h1{font-family:Newsreader,serif;font-size:54px;font-weight:550;line-height:1.08;letter-spacing:-1px;margin:36px 0 24px;max-width:690px}
      .tagline{font-size:23px;line-height:1.45;color:#44685b;border-top:1px solid #b8c9bd;padding-top:20px;max-width:690px}
      .footer{position:absolute;bottom:43px;left:48px;font-size:27px;font-weight:550;color:#18372f}
      .landscape{position:absolute;right:0;top:0;width:400px;height:630px;object-fit:cover;object-position:center}
      .edge{position:absolute;right:400px;top:0;width:5px;height:630px;background:#b8c9bd}
    </style></head><body><img class="landscape" src="${heroUrl}" alt=""><div class="edge"></div><div class="copy"><p class="name">${escape(config.practice.name)}</p><p class="location">${escape(config.practice.locationLabel)}</p><h1>${escape(config.hero.title)}</h1><div class="tagline">${escape(config.practice.tagline)}</div><div class="footer">${escape(config.practice.phone)}</div></div></body></html>`;
    const htmlPath = path.join(scratch, 'card.html');
    await writeFile(htmlPath, html);
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.route(/^https?:\/\//, (route) => route.abort());
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() => document.fonts.ready);
    const imagePath = path.join(output, 'practice-share.png');
    await page.screenshot({ path: imagePath });
    await page.close();
    console.log(path.relative(root, imagePath));
  }
} finally {
  await browser.close();
}
