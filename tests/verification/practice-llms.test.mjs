import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceLlms } from '../../src/lib/practice-production.mjs';

const overview = (llms) => llms.split('\n').find((line) => line.startsWith('- [Practice overview]'));

test('office hours retain configured schedules, timezone and telehealth-only distinctions without guessed values', () => {
  const config = { location: {
    timeZone: 'America/Chicago',
    hours: [['Monday', '9:00 AM – 5:00 PM'], ['Tuesday', '8:00 AM – 3:00 PM'], ['Wednesday', 'Closed'], ['Friday', '8:00 AM – 3:00 PM'], ['Saturday–Sunday', 'Closed']],
    weeklyHours: { Friday: { telehealthOnly: true } },
  } };
  const llms = practiceLlms(config, 'https://example.com');
  assert.match(llms, /- Office hours \(America\/Chicago\):/);
  assert.ok(llms.includes('Monday, 9:00 AM – 5:00 PM'));
  assert.ok(llms.includes('Tuesday, 8:00 AM – 3:00 PM'));
  assert.ok(llms.includes('Wednesday, Closed'));
  assert.ok(llms.includes('Friday, 8:00 AM – 3:00 PM'));
  assert.ok(llms.includes('Saturday–Sunday, Closed'));
  assert.match(llms, /- Telehealth-only days: Friday\./);
  delete config.location.timeZone;
  assert.match(practiceLlms(config, 'https://example.com'), /- Office hours: Monday,/);
  delete config.location.hours;
  assert.doesNotMatch(practiceLlms(config, 'https://example.com'), /- Office hours|- Telehealth-only days:/);
});

test('private-pay guides describe payment and enabled sections without implying insurance participation', () => {
  const config = { financialPolicy: { paymentModel: 'cash_only' }, providers: [{ name: 'Example Provider', slug: 'example' }], conditions: ['Example concern'] };
  const llms = practiceLlms(config, 'https://example.com');
  assert.match(llms, /- Payment: Private pay; the practice does not participate in insurance networks\./);
  assert.match(overview(llms), /private pay/);
  assert.doesNotMatch(overview(llms), /insurance|treatments/);
  assert.equal(overview(practiceLlms({ insurance: { enabled: false } }, 'https://example.com')),
    '- [Practice overview](https://example.com/): appointments and contact.');
});

test('availability and telehealth summaries use explicit practice facts, not provider defaults', () => {
  const config = { practice: {}, providers: [{ slug: 'example', name: 'Example Provider', telehealthOverride: true }] };
  assert.doesNotMatch(practiceLlms(config, 'https://example.com'), /- Accepting new patients:|- Telehealth:/);
  config.practice.acceptsNewPatients = false;
  assert.match(practiceLlms(config, 'https://example.com'), /- Accepting new patients: No/);
  config.practice.acceptsNewPatients = true;
  assert.match(practiceLlms(config, 'https://example.com'), /- Accepting new patients: Yes/);
  config.location = { telehealthNotice: 'Video visits available.' };
  config.appointmentSection = { telehealth: { summary: 'Online follow-up visits.' } };
  assert.match(practiceLlms(config, 'https://example.com'), /- Telehealth: Video visits available\./);
  delete config.location;
  assert.match(practiceLlms(config, 'https://example.com'), /- Telehealth: Online follow-up visits\./);
});

test('larger rosters and treatments are grouped with complete destinations and facts before link sections', () => {
  const config = {
    financialPolicy: { paymentModel: 'cash_only' }, conditions: ['Example concern'], providerDirectory: true,
    providers: ['alpha', 'bravo', 'charlie'].map(slug => ({ slug, name: `Example ${slug}` })),
    treatments: [{ slug: 'example-care', name: 'Example care', seo: { description: 'Example treatment description.' } }],
  };
  const llms = practiceLlms(config, 'https://example.com/');
  assert.ok(llms.indexOf('- Payment:') < llms.indexOf('## Official pages'));
  assert.ok(llms.indexOf('Areas of care:') < llms.indexOf('## Official pages'));
  assert.match(llms, /## Providers\n/);
  assert.match(llms, /## Treatments\n/);
  assert.ok(llms.includes('[Provider directory](https://example.com/providers/)'));
  for (const slug of ['alpha', 'bravo', 'charlie']) assert.ok(llms.includes(`https://example.com/providers/${slug}/`));
  assert.ok(llms.includes('https://example.com/treatment/example-care/'));
  const solo = practiceLlms({ providers: [{ slug: 'solo', name: 'Example Solo' }] }, 'https://example.com');
  assert.doesNotMatch(solo, /## Providers|## Treatments/);
});
