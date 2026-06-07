#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function escapeAttr(value) {
  return String(value ?? '').replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[char]));
}

function normalizedSiteUrl(config) {
  return String(config.seo?.siteUrl || '').replace(/\/+$/, '');
}

function canonicalUrl(config, pagePath = '') {
  const siteUrl = normalizedSiteUrl(config);
  if (!siteUrl) return '';
  const normalizedPath = String(pagePath || '').replace(/^\/+|\/+$/g, '');
  return normalizedPath ? `${siteUrl}/${normalizedPath}/` : `${siteUrl}/`;
}

function robotsMeta(config) {
  return config.seo?.allowIndexing === true ? '' : '  <meta name="robots" content="noindex, nofollow">\n';
}

const themes = JSON.parse(fs.readFileSync(path.join('shared', 'themes.json'), 'utf8'));

function resolveTheme(config) {
  const theme = themes[config.theme];
  if (!theme) throw new Error(`Unknown theme '${config.theme}'`);
  return theme;
}

const OFFICE_STATUS_SCRIPT = `<script>
(() => {
  function statusFor(timeZone, weeklyHours) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const value = (type) => parts.find(part => part.type === type)?.value;
    const today = weeklyHours?.[value('weekday')];
    if (!today) return { label: 'Call for Hours', className: 'bg-slate-100 text-slate-600' };
    if (today.closed) return { label: 'Closed Today', className: 'bg-slate-100 text-slate-600' };
    if (today.telehealthOnly) return { label: 'Telehealth Today', className: 'bg-sage-50 text-brand-accent' };
    if (!today.open || !today.close) return { label: 'Call for Hours', className: 'bg-slate-100 text-slate-600' };
    const nowMinutes = Number(value('hour')) * 60 + Number(value('minute'));
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    return nowMinutes >= toMinutes(today.open) && nowMinutes < toMinutes(today.close)
      ? { label: 'Open Now', className: 'bg-sage-50 text-brand-accent' }
      : { label: 'Closed Now', className: 'bg-slate-100 text-slate-600' };
  }

  const element = document.querySelector('[data-office-status]');
  if (!element) return;
  try {
    const status = statusFor(element.dataset.timeZone, JSON.parse(element.dataset.weeklyHours || '{}'));
    element.textContent = status.label;
    element.className = 'rounded-full px-3 py-1 text-sm font-medium ' + status.className;
  } catch (error) {
    console.warn('Unable to update office status', error);
  }
})();
</script>`;

const PROVIDER_CARD_SCRIPT = `<script>
(() => {
  document.querySelectorAll('[data-card-href]').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = card.getAttribute('data-card-href');
    });
    card.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      window.location.href = card.getAttribute('data-card-href');
    });
  });
})();
</script>`;

const COPY_EMAIL_SCRIPT = `<script>
(() => {
  async function copyText(value) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }

  function showCopyToast() {
    const toast = document.querySelector('[data-copy-toast]');
    if (!toast) return;
    toast.classList.remove('hidden');
    window.clearTimeout(showCopyToast.timeoutId);
    showCopyToast.timeoutId = window.setTimeout(() => toast.classList.add('hidden'), 2500);
  }

  document.querySelectorAll('[data-copy-email]').forEach(button => {
    button.addEventListener('click', async () => {
      const email = button.getAttribute('data-copy-email') || '';
      try {
        if (!await copyText(email)) throw new Error('Copy command failed');
        showCopyToast();
      } catch (_error) {
        window.prompt('Copy email address:', email);
      }
    });
  });
})();
</script>`;

function prerenderPractice(practiceDir, rendererSource) {
  const configPath = path.join(practiceDir, 'practice.json');
  if (!fs.existsSync(configPath)) return;

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.practice.slug = config.practice.slug || path.basename(practiceDir);
  config.themeTokens = resolveTheme(config);
  const app = { innerHTML: '' };
  const cssVars = new Map();
  const descriptionMeta = {
    content: config.seo?.description || '',
    setAttribute(name, value) {
      if (name === 'content') this.content = value;
    },
  };
  const document = {
    title: config.seo?.title || 'FrontDoor Health Preview',
    documentElement: {
      style: {
        setProperty(name, value) {
          cssVars.set(name, value);
        },
      },
    },
    querySelector(selector) {
      if (selector === 'meta[name="description"]') return descriptionMeta;
      return null;
    },
    getElementById(id) {
      if (id === 'app') return app;
      return null;
    },
  };

  const context = {
    window: {},
    document,
    lucide: { createIcons() {} },
    Intl,
    Date,
    Number,
    String,
    JSON,
    console,
  };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(rendererSource, context, { filename: 'shared/home-page.js' });
  context.window.FrontdoorHome.render(config, { staticOfficeStatus: true });

  const cssText = [...cssVars.entries()].map(([name, value]) => `${name}:${value};`).join('');
  const canonical = canonicalUrl(config);
  const canonicalLink = canonical ? `  <link rel="canonical" href="${escapeAttr(canonical)}" />\n` : '';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeAttr(document.title)}</title>
  <meta name="description" content="${escapeAttr(descriptionMeta.content)}" />
${robotsMeta(config)}${canonicalLink}  <link rel="stylesheet" href="./assets/styles.css" />
  <script>window.FRONTDOOR_PRACTICE_SLUG = ${JSON.stringify(config.practice.slug)};</script>
  <script src="/shared/analytics.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>:root{${cssText}}</style>
</head>
<body class="bg-surface pb-24 font-sans text-slate-950 antialiased md:pb-0">
  ${app.innerHTML.trim()}
  ${OFFICE_STATUS_SCRIPT}
  ${PROVIDER_CARD_SCRIPT}
  ${COPY_EMAIL_SCRIPT}
  <script>lucide.createIcons();</script>
</body>
</html>
`;

  fs.writeFileSync(path.join(practiceDir, 'index.html'), html);
}

function renderPracticeHomePages(dist = 'dist') {
  const rendererPath = path.join('shared', 'home-page.js');
  const rendererSource = fs.readFileSync(rendererPath, 'utf8');

  function visit(directory) {
    if (fs.existsSync(path.join(directory, 'practice.json'))) {
      prerenderPractice(directory, rendererSource);
      return;
    }
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      visit(path.join(directory, entry.name));
    }
  }

  visit(dist);
}

if (require.main === module) {
  renderPracticeHomePages(process.argv[2] || 'dist');
}

module.exports = {
  renderPracticeHomePages,
};
