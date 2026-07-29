import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FIXTURE_ROOT = path.join(ROOT, '.tmp', 'migration-contracts', 'legacy');
const MARKETING_ROOT = path.join(FIXTURE_ROOT, 'marketing');
const PRACTICE_ROOT = path.join(FIXTURE_ROOT, 'practice-drdronavalli');
const MARKETING_CSS = path.join(ROOT, '.tmp', 'migration-contracts', 'marketing.css');
const ANALYTICS_URL = 'https://analytics.frontdoor.health/event';
const FIXED_TIME = '2026-07-29T15:00:00.000Z';

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const LUCIDE_STUB = `
window.lucide = {
  createIcons() {
    document.querySelectorAll('[data-lucide]').forEach((element) => {
      if (element.tagName.toLowerCase() === 'svg') return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('class', element.getAttribute('class') || 'h-4 w-4');
      svg.innerHTML = '<circle cx="12" cy="12" r="8"></circle><path d="M8 12h8"></path>';
      element.replaceWith(svg);
    });
  }
};`;

const TURNSTILE_STUB = `
window.turnstile = window.turnstile || {
  getResponse() { return 'migration-turnstile-token'; },
  reset() { window.__turnstileResetCount = (window.__turnstileResetCount || 0) + 1; }
};
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.cf-turnstile').forEach((element) => {
    element.innerHTML = '<div style="height:65px;width:300px;max-width:100%;border:1px solid #d1d5db;border-radius:4px;background:#f8fafc;display:flex;align-items:center;padding:12px;color:#475569;font:14px sans-serif">Verification test fixture</div>';
  });
});`;

function responseContentType(filePath) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function safeStaticPath(root, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relative = decoded.replace(/^\/+/, '');
  const candidates = [];
  if (!relative || decoded.endsWith('/')) {
    candidates.push(path.join(root, relative, 'index.html'));
  } else {
    candidates.push(path.join(root, relative));
    if (!path.extname(relative)) candidates.push(path.join(root, relative, 'index.html'));
  }

  const resolvedRoot = path.resolve(root);
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) continue;
    if (existsSync(resolved) && statSync(resolved).isFile()) return resolved;
  }
  return null;
}

function withMarketingTestCss(html) {
  if (html.includes('/__migration/marketing.css')) return html;
  return html.replace(
    '</head>',
    '  <link rel="stylesheet" href="/__migration/marketing.css" data-migration-test-only />\n</head>',
  );
}

function fullRequest(request) {
  let payload = null;
  try {
    payload = request.postDataJSON();
  } catch {
    payload = request.postData();
  }
  return {
    url: request.url(),
    method: request.method(),
    headers: request.headers(),
    payload,
  };
}

export async function installDeterministicBrowser(page, { preventExternalNavigation = true } = {}) {
  await page.clock.setFixedTime(new Date(FIXED_TIME));
  await page.addInitScript(({ preventNavigation }) => {
    window.__clipboardWrites = [];
    window.__promptCalls = [];
    window.__turnstileResetCount = 0;
    window.__googleConversionCalls = [];

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        async writeText(value) {
          window.__clipboardWrites.push(String(value));
        },
      },
    });

    window.prompt = (...args) => {
      window.__promptCalls.push(args);
      return null;
    };

    window.turnstile = {
      getResponse() {
        return 'migration-turnstile-token';
      },
      reset() {
        window.__turnstileResetCount += 1;
      },
    };

    if (preventNavigation) {
      document.addEventListener('click', (event) => {
        const anchor = event.target.closest?.('a');
        if (!anchor) return;
        const href = anchor.getAttribute('href') || '';
        if (/^(?:https?:|tel:|mailto:)/i.test(href) || anchor.target === '_blank') {
          event.preventDefault();
        }
      }, true);
    }
  }, { preventNavigation: preventExternalNavigation });
}

export async function installMockNetwork(page, options = {}) {
  const analyticsRequests = [];
  const apiRequests = [];
  const unexpectedRequests = [];
  let previewRequestResponse = options.previewRequestResponse || { status: 200, json: { ok: true, accepted: true } };

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.protocol === 'file:') {
      await route.continue();
      return;
    }

    if (request.url() === ANALYTICS_URL) {
      analyticsRequests.push(fullRequest(request));
      await route.fulfill({ status: 200, json: { ok: true } });
      return;
    }

    if (
      url.hostname === 'frontdoor.health' &&
      url.pathname === '/api/preview-request'
    ) {
      apiRequests.push(fullRequest(request));
      const response = typeof previewRequestResponse === 'function'
        ? await previewRequestResponse(request)
        : previewRequestResponse;
      await route.fulfill({
        status: response.status ?? 200,
        json: response.json ?? { ok: true },
      });
      return;
    }

    if (url.hostname === 'cdn.tailwindcss.com') {
      await route.fulfill({
        contentType: 'text/javascript; charset=utf-8',
        body: 'window.tailwind = window.tailwind || { config: {} };',
      });
      return;
    }

    if (url.hostname === 'unpkg.com' && url.pathname.startsWith('/lucide')) {
      await route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: LUCIDE_STUB });
      return;
    }

    if (url.hostname === 'challenges.cloudflare.com') {
      await route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: TURNSTILE_STUB });
      return;
    }

    if (url.hostname === 'www.googletagmanager.com') {
      await route.fulfill({
        contentType: 'text/javascript; charset=utf-8',
        body: 'window.dataLayer = window.dataLayer || [];',
      });
      return;
    }

    if (
      url.hostname.endsWith('google-analytics.com') ||
      url.hostname.endsWith('googleadservices.com') ||
      url.hostname.endsWith('doubleclick.net')
    ) {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    let staticRoot = null;
    if (['frontdoor.health', 'www.frontdoor.health'].includes(url.hostname)) {
      staticRoot = MARKETING_ROOT;
    } else if (['drdronavalli.com', 'www.drdronavalli.com'].includes(url.hostname)) {
      staticRoot = PRACTICE_ROOT;
    }

    if (staticRoot && url.pathname === '/__migration/marketing.css') {
      await route.fulfill({ path: MARKETING_CSS, contentType: 'text/css; charset=utf-8' });
      return;
    }

    if (staticRoot) {
      const filePath = safeStaticPath(staticRoot, url.pathname);
      if (!filePath) {
        await route.fulfill({ status: 404, body: 'Not found' });
        return;
      }

      const isMarketingHtml =
        staticRoot === MARKETING_ROOT &&
        !url.pathname.startsWith('/previews/') &&
        path.extname(filePath) === '.html';
      if (isMarketingHtml) {
        const html = withMarketingTestCss(readFileSync(filePath, 'utf8'));
        await route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
      } else {
        await route.fulfill({ path: filePath, contentType: responseContentType(filePath) });
      }
      return;
    }

    if (['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) {
      if (url.pathname === '/shared/analytics.js') {
        await route.fulfill({
          path: path.join(ROOT, 'shared', 'analytics.js'),
          contentType: 'text/javascript; charset=utf-8',
        });
        return;
      }
      if (url.pathname === '/shared/attribution.js') {
        await route.fulfill({
          path: path.join(ROOT, 'shared', 'attribution.js'),
          contentType: 'text/javascript; charset=utf-8',
        });
        return;
      }
      await route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><title>Local analytics fixture</title>
          <script>window.FRONTDOOR_PRACTICE_SLUG = 'local-fixture';</script>
          <script src="/shared/attribution.js"></script>
          <script src="/shared/analytics.js"></script>
          <button data-frontdoor-cta="phone" data-frontdoor-destination="tel:+15125550100">Call</button>`,
      });
      return;
    }

    unexpectedRequests.push(request.url());
    await route.abort('blockedbyclient');
  });

  return {
    analyticsRequests,
    apiRequests,
    unexpectedRequests,
    setPreviewRequestResponse(response) {
      previewRequestResponse = response;
    },
  };
}

export function fixedTimestamp() {
  return FIXED_TIME;
}

export function fixturePath(...parts) {
  return path.join(FIXTURE_ROOT, ...parts);
}

export async function waitForStablePage(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = 'eager';
    await document.fonts?.ready;
    await Promise.race([
      Promise.all([...document.images].map((image) => image.decode?.().catch(() => {}))),
      new Promise((resolve) => window.setTimeout(resolve, 3_000)),
    ]);
  });
}
