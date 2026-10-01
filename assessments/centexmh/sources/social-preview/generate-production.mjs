// Render a clinic-facing share image, separate from the FrontDoor concept card.
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const scratch = path.join(root, '.tmp/centexmh-share-card');
const output = path.join(root, 'sites/centexmh/images/social');
await mkdir(scratch, { recursive: true });
await mkdir(output, { recursive: true });
const config = JSON.parse(await readFile(path.join(root, 'sites/centexmh/practice.json'), 'utf8'));
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const localUrl = (value) => pathToFileURL(path.join(root, value)).href;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:Inter;src:url('${localUrl('shared/fonts/inter-latin.woff2')}')}
  @font-face{font-family:Newsreader;src:url('${localUrl('shared/fonts/newsreader-latin.woff2')}')}
  *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f6f4ee;color:#18372f;font-family:Inter,sans-serif}
  .copy{position:relative;z-index:1;padding:48px 48px 40px;width:790px;height:630px}
  .brand{display:flex;align-items:center;gap:20px}.logo{width:86px;height:86px;object-fit:contain;border-radius:50%;background:white}
  .name{font-size:32px;font-weight:650;line-height:1.2;letter-spacing:-.7px;max-width:530px}
  h1{font-family:Newsreader,serif;font-size:64px;font-weight:550;line-height:1.04;letter-spacing:-1.5px;margin:40px 0 26px}
  .rule{height:1px;background:#b8c9bd;width:650px;margin-bottom:25px}.services{font-size:24px;line-height:1.65;color:#44685b}
  .footer{position:absolute;bottom:43px;left:48px;font-size:24px;font-weight:550;line-height:1.5}
  .region{font-size:16px;font-weight:500;color:#44685b;letter-spacing:.3px}
  .landscape{position:absolute;right:0;top:0;width:410px;height:630px;object-fit:cover;object-position:55% center}
  .edge{position:absolute;right:410px;top:0;width:5px;height:630px;background:#b8c9bd}
</style></head><body>
  <img class="landscape" src="${localUrl('sites/centexmh/images/hero/centexmh-limestone-creek-v2.webp')}" alt="">
  <div class="edge"></div><div class="copy">
    <div class="brand"><img class="logo" src="${localUrl('assessments/centexmh/images/central_texas_mental_health_logo.jpeg')}" alt=""><div class="name">${escape(config.practice.name)}</div></div>
    <h1>Adult psychiatric care<br>in Round Rock.</h1>
    <div class="rule"></div><div class="services">Medication management<br>NeuroStar TMS Therapy · Spravato</div>
    <div class="footer">centexmh.com · ${escape(config.practice.phone)}<br><span class="region">Round Rock · Georgetown · Cedar Park · Wells Branch</span></div>
  </div>
</body></html>`;
const htmlPath = path.join(scratch, 'production-card.html');
await writeFile(htmlPath, html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.route(/^https?:\/\//, (route) => route.abort());
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, 'centexmh-production-share.png') });
} finally {
  await browser.close();
}
