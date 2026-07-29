import { pathToFileURL } from 'node:url';
import { test, expect } from '@playwright/test';
import {
  fixedTimestamp,
  fixturePath,
  installDeterministicBrowser,
  installMockNetwork,
} from './helpers/static-site.mjs';

const FIXED_SESSION_ID = 'migration-session-id';
const FIXED_VISITOR_ID = 'migration-visitor-id';
const UTM_CAMPAIGN = 'migration-contract-campaign';
const UTM_EXPIRY_MS = 60 * 24 * 60 * 60 * 1_000;

async function installKnownStorage(page, { campaign = UTM_CAMPAIGN } = {}) {
  await page.addInitScript(({ sessionId, visitorId, utmCampaign, expiresAt }) => {
    if (!/^https?:$/.test(window.location.protocol)) return;
    sessionStorage.setItem('fdh_session_id', sessionId);
    localStorage.setItem('fdh_visitor_id', visitorId);
    if (utmCampaign) {
      localStorage.setItem('fdh_utm_campaign', utmCampaign);
      localStorage.setItem('fdh_utm_campaign_expires_at', String(expiresAt));
    }
  }, {
    sessionId: FIXED_SESSION_ID,
    visitorId: FIXED_VISITOR_ID,
    utmCampaign: campaign,
    expiresAt: new Date(fixedTimestamp()).getTime() + UTM_EXPIRY_MS,
  });
}

async function openMarketingForm(page, network, response) {
  network.setPreviewRequestResponse(response);
  await page.goto(`https://frontdoor.health/?utm_campaign=${UTM_CAMPAIGN}`);
  await page.evaluate(() => {
    const originalGtag = window.gtag;
    window.gtag = (...args) => {
      window.__googleConversionCalls.push(args);
      return originalGtag?.(...args);
    };
  });
}

async function fillMarketingForm(page, overrides = {}) {
  const values = {
    name: 'Migration Tester',
    practiceName: 'Contract Test Clinic',
    specialty: 'Psychiatry',
    email: 'migration@example.com',
    websiteUrl: 'contract-test.example',
    companyWebsite: '',
    ...overrides,
  };
  await page.locator('#name').fill(values.name);
  await page.locator('#practiceName').fill(values.practiceName);
  await page.locator('#specialty').selectOption(values.specialty);
  await page.locator('#email').fill(values.email);
  await page.locator('#website').fill(values.websiteUrl);
  if (values.companyWebsite) {
    await page.locator('#companyWebsite').evaluate((element, value) => {
      element.value = value;
    }, values.companyWebsite);
  }
  await page.locator('#preview-request-submit').click();
}

test.beforeEach(async ({ page }) => {
  await installDeterministicBrowser(page);
});

test('@analytics sends the complete preview page-view payload', async ({ page }) => {
  const network = await installMockNetwork(page);
  await installKnownStorage(page);

  await page.goto('https://frontdoor.health/previews/northhillspsychiatry/');
  await expect.poll(() => network.analyticsRequests.length).toBe(1);

  expect(network.analyticsRequests[0]).toEqual({
    url: 'https://analytics.frontdoor.health/event',
    method: 'POST',
    headers: expect.objectContaining({
      'content-type': 'application/json',
    }),
    payload: {
      event: 'page_view',
      path: '/previews/northhillspsychiatry/',
      practice_slug: 'northhillspsychiatry',
      referrer: null,
      title: 'North Hills Psychiatry | Compassionate Psychiatric Care in Austin',
      session_id: FIXED_SESSION_ID,
      visitor_id: FIXED_VISITOR_ID,
      timestamp: fixedTimestamp(),
      utm_campaign: UTM_CAMPAIGN,
    },
  });
  expect(network.unexpectedRequests).toEqual([]);
});

test('@analytics preserves every CTA mapping, destination, context, and ID reuse', async ({ page }) => {
  const network = await installMockNetwork(page);
  await installKnownStorage(page);
  await page.goto('https://drdronavalli.com/');

  const cases = [
    ['email', 'email_click'],
    ['phone', 'phone_click'],
    ['newPatient', 'new_patient_click'],
    ['existingPatient', 'existing_patient_click'],
    ['directions', 'directions_click'],
    ['resource', 'resource_download'],
  ];

  for (const [index, [ctaType, eventType]] of cases.entries()) {
    const cta = page.locator(`[data-frontdoor-cta="${ctaType}"]`).first();
    const destination = await cta.evaluate((element) => {
      if (element.dataset.frontdoorDestination) return element.dataset.frontdoorDestination;
      if (element.href) return element.href;
      if (element.dataset.copyEmail) return `mailto:${element.dataset.copyEmail}`;
      return '';
    });

    await cta.click();
    await expect.poll(() => network.analyticsRequests.length).toBe(index + 1);

    expect(network.analyticsRequests.at(-1)).toEqual({
      url: 'https://analytics.frontdoor.health/event',
      method: 'POST',
      headers: expect.objectContaining({
        'content-type': 'application/json',
      }),
      payload: {
        practice_slug: 'drdronavalli',
        event_type: eventType,
        page_path: '/',
        destination_url: destination,
        referrer: null,
        title: 'Dr. Goutham Dronavalli, MD | Pulmonologist in Sugar Land, TX',
        session_id: FIXED_SESSION_ID,
        visitor_id: FIXED_VISITOR_ID,
        timestamp: fixedTimestamp(),
        utm_campaign: UTM_CAMPAIGN,
      },
    });
  }

  expect(network.analyticsRequests).toHaveLength(cases.length);
  expect(network.unexpectedRequests).toEqual([]);
});

test('@analytics copy-email tracking does not break clipboard and toast behavior', async ({ page }) => {
  const network = await installMockNetwork(page);
  await installKnownStorage(page);
  await page.goto('https://drdronavalli.com/');

  const emailButton = page.locator('[data-frontdoor-cta="email"]').first();
  const email = await emailButton.getAttribute('data-copy-email');
  await emailButton.click();

  await expect.poll(() => network.analyticsRequests.length).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__clipboardWrites)).toEqual([email]);
  await expect(page.locator('[data-copy-toast]')).toBeVisible();
  expect(await page.evaluate(() => window.__promptCalls)).toEqual([]);
});

test('@analytics creates and reuses pseudonymous session and visitor IDs', async ({ page }) => {
  const network = await installMockNetwork(page);
  await page.goto('https://drdronavalli.com/');

  await page.locator('[data-frontdoor-cta="phone"]').first().click();
  await page.locator('[data-frontdoor-cta="email"]').first().click();
  await expect.poll(() => network.analyticsRequests.length).toBe(2);

  const firstPayload = network.analyticsRequests[0].payload;
  const secondPayload = network.analyticsRequests[1].payload;
  const storedIds = await page.evaluate(() => ({
    sessionId: sessionStorage.getItem('fdh_session_id'),
    visitorId: localStorage.getItem('fdh_visitor_id'),
  }));

  expect(firstPayload.session_id).toMatch(/^(?:[0-9a-f-]{36}|id-[a-z0-9-]+)$/);
  expect(firstPayload.visitor_id).toMatch(/^(?:[0-9a-f-]{36}|id-[a-z0-9-]+)$/);
  expect(secondPayload.session_id).toBe(firstPayload.session_id);
  expect(secondPayload.visitor_id).toBe(firstPayload.visitor_id);
  expect(storedIds).toEqual({
    sessionId: firstPayload.session_id,
    visitorId: firstPayload.visitor_id,
  });
});

test('@analytics captures, persists, retrieves, and expires UTM attribution', async ({ page }) => {
  const network = await installMockNetwork(page);
  await page.goto(`https://frontdoor.health/?utm_campaign=${UTM_CAMPAIGN}`);

  const stored = await page.evaluate(() => ({
    campaign: localStorage.getItem('fdh_utm_campaign'),
    expiresAt: localStorage.getItem('fdh_utm_campaign_expires_at'),
    apiValue: window.FrontdoorAttribution.getUtmCampaign(),
  }));
  expect(stored).toEqual({
    campaign: UTM_CAMPAIGN,
    expiresAt: String(new Date(fixedTimestamp()).getTime() + UTM_EXPIRY_MS),
    apiValue: UTM_CAMPAIGN,
  });

  await page.goto('https://frontdoor.health/about/');
  expect(await page.evaluate(() => window.FrontdoorAttribution.getUtmCampaign())).toBe(UTM_CAMPAIGN);

  const expired = await page.evaluate(() => {
    localStorage.setItem('fdh_utm_campaign_expires_at', String(Date.now() - 1));
    return {
      value: window.FrontdoorAttribution.getUtmCampaign(),
      campaign: localStorage.getItem('fdh_utm_campaign'),
      expiresAt: localStorage.getItem('fdh_utm_campaign_expires_at'),
    };
  });
  expect(expired).toEqual({ value: null, campaign: null, expiresAt: null });
  expect(network.analyticsRequests).toEqual([]);
  expect(network.unexpectedRequests).toEqual([]);
});

for (const [label, url] of [
  ['file', pathToFileURL(fixturePath('..', '..', '..', 'tests', 'migration', 'fixtures', 'local-analytics.html')).href],
  ['localhost', 'http://localhost/local-analytics'],
  ['IPv4 loopback', 'http://127.0.0.1/local-analytics'],
  ['IPv6 loopback', 'http://[::1]/local-analytics'],
]) {
  test(`@analytics emits no events on ${label}`, async ({ page }) => {
    const network = await installMockNetwork(page);
    await page.goto(url);
    await page.locator('[data-frontdoor-cta="phone"]').click();
    await page.waitForTimeout(50);
    expect(network.analyticsRequests).toEqual([]);
    expect(network.unexpectedRequests).toEqual([]);
  });
}

test('@analytics provider cards support mouse and keyboard navigation', async ({ page }) => {
  const freshPage = await page.context().newPage();
  await installDeterministicBrowser(freshPage, { preventExternalNavigation: false });
  const network = await installMockNetwork(freshPage);

  const previewUrl = 'https://frontdoor.health/previews/northhillspsychiatry/';
  await freshPage.goto(previewUrl);
  const firstCard = freshPage.locator('[data-card-href]').first();
  const providerPath = await firstCard.getAttribute('data-card-href');
  const providerUrl = new URL(providerPath, previewUrl).href;
  await firstCard.click();
  await expect(freshPage).toHaveURL(providerUrl);

  await freshPage.goto(previewUrl);
  await freshPage.locator('[data-card-href]').first().focus();
  await freshPage.keyboard.press('Enter');
  await expect(freshPage).toHaveURL(providerUrl);
  expect(network.unexpectedRequests).toEqual([]);
  await freshPage.close();
});

test('@analytics accepted preview requests emit one non-PHI event and one conversion', async ({ page }) => {
  const network = await installMockNetwork(page);
  await openMarketingForm(page, network, { status: 200, json: { ok: true, accepted: true } });
  await fillMarketingForm(page);

  await expect(page.locator('#preview-request-status')).toHaveText(
    'Thanks. I will review your practice website and follow up.',
  );
  await expect.poll(() => network.analyticsRequests.length).toBe(1);

  expect(network.apiRequests).toHaveLength(1);
  expect(network.apiRequests[0].payload).toEqual({
    name: 'Migration Tester',
    practiceName: 'Contract Test Clinic',
    specialty: 'Psychiatry',
    email: 'migration@example.com',
    websiteUrl: 'https://contract-test.example/',
    companyWebsite: '',
    utm_campaign: UTM_CAMPAIGN,
    turnstileToken: 'migration-turnstile-token',
  });

  expect(network.analyticsRequests[0].payload).toEqual({
    event_type: 'preview_requested',
    utm_campaign: UTM_CAMPAIGN,
    page_path: '/',
    referrer: '',
    title: 'FrontDoor Health | Modern websites for independent healthcare practices',
    timestamp: fixedTimestamp(),
    practice_name: 'Contract Test Clinic',
    specialty: 'Psychiatry',
    has_website: true,
  });
  for (const forbidden of ['name', 'email', 'websiteUrl', 'turnstileToken', 'companyWebsite']) {
    expect(network.analyticsRequests[0].payload).not.toHaveProperty(forbidden);
  }

  expect(await page.evaluate(() => window.__googleConversionCalls)).toEqual([
    ['event', 'conversion', { send_to: 'AW-18297020270/AokmCOPin8ocEO6-2ZRE' }],
  ]);
  expect(network.unexpectedRequests).toEqual([]);
});

test('@analytics honeypot accepted-false responses emit no event or conversion', async ({ page }) => {
  const network = await installMockNetwork(page);
  await openMarketingForm(page, network, { status: 200, json: { ok: true, accepted: false } });
  await fillMarketingForm(page, { companyWebsite: 'bot.example' });

  await expect(page.locator('#preview-request-status')).toHaveText(
    'Thanks. I will review your practice website and follow up.',
  );
  expect(network.apiRequests).toHaveLength(1);
  expect(network.analyticsRequests).toEqual([]);
  expect(await page.evaluate(() => window.__googleConversionCalls)).toEqual([]);
});

test('@analytics client validation failures emit no API call, event, or conversion', async ({ page }) => {
  const network = await installMockNetwork(page);
  await openMarketingForm(page, network, { status: 200, json: { ok: true, accepted: true } });
  await fillMarketingForm(page, { websiteUrl: 'not a valid website' });

  await expect(page.locator('#preview-request-status')).toHaveText('Please enter a valid website URL.');
  expect(network.apiRequests).toEqual([]);
  expect(network.analyticsRequests).toEqual([]);
  expect(await page.evaluate(() => window.__googleConversionCalls)).toEqual([]);
});

test('@analytics API failures emit no event or conversion and remain retryable', async ({ page }) => {
  const network = await installMockNetwork(page);
  await openMarketingForm(page, network, {
    status: 500,
    json: { ok: false, error: 'Migration test failure.' },
  });
  await fillMarketingForm(page);

  await expect(page.locator('#preview-request-status')).toHaveText('Migration test failure.');
  await expect(page.locator('#preview-request-submit')).toBeEnabled();
  await expect(page.locator('#preview-request-submit')).toHaveText('Request a Free Preview');
  expect(network.apiRequests).toHaveLength(1);
  expect(network.analyticsRequests).toEqual([]);
  expect(await page.evaluate(() => window.__googleConversionCalls)).toEqual([]);
});
