// Render a deterministic share-card asset; this is not a verification script.
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
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await page.route(/^https?:\/\//, (route) => route.abort());
  await page.goto(localUrl('.tmp/astro-dist/preview/previews/centexmh/index.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(scratch, 'mobile.png') });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Inter;src:url('${localUrl('shared/fonts/inter-latin.woff2')}')}
    *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f6f4ee;color:#18372f;font-family:Inter,sans-serif}
    .card{padding:44px 54px}.eyebrow{font-size:19px;font-weight:650;letter-spacing:2px;text-transform:uppercase;color:#44685b;margin:0 0 16px}
    h1{font-size:47px;line-height:1.12;letter-spacing:-1.7px;margin:0;width:1040px}
    .copy{width:690px;margin-top:33px}h2{font-size:28px;line-height:1.35;margin:0 0 23px;font-weight:550;color:#44685b}
    .row{font-size:25px;line-height:1.35;margin:15px 0;display:flex;gap:15px;align-items:center}.check{background:#dce9df;border-radius:50%;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
    .footer{position:absolute;left:54px;bottom:35px;font-size:19px;color:#44685b}
    .phone{position:absolute;right:70px;top:187px;width:280px;height:468px;overflow:hidden;border:8px solid #18372f;border-radius:28px;background:white;box-shadow:0 15px 35px #18372f22}.phone img{width:264px;display:block}
  </style></head><body><div class="card"><p class="eyebrow">Independent website concept · Round Rock, TX</p><h1>${escape(config.practice.name)}</h1><div class="copy"><h2>Loads quickly.<br>Easy to use on phones and desktops.</h2><div class="row"><span class="check">✓</span>Find a provider</div><div class="row"><span class="check">✓</span>Access patient forms</div><div class="row"><span class="check">✓</span>Explore TMS &amp; Spravato</div><div class="row"><span class="check">✓</span>Request an appointment</div></div><div class="footer">Website concept by FrontDoor Health · frontdoor.health</div><div class="phone"><img src="${pathToFileURL(path.join(scratch, 'mobile.png')).href}" alt=""></div></div></body></html>`;
  const htmlPath = path.join(scratch, 'card.html');
  await writeFile(htmlPath, html);
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, 'centexmh-website-concept.png') });
} finally {
  await browser.close();
}
