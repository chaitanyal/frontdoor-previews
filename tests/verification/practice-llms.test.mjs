import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { practiceLlms } from '../../src/lib/practice-production.mjs';

const practice = (slug) => JSON.parse(readFileSync(`sites/${slug}/practice.json`, 'utf8'));
const overview = (llms) => llms.split('\n').find((line) => line.startsWith('- [Practice overview]'));

test('office hours retain configured schedules, timezone and telehealth-only distinctions without guessed values', () => {
  const drd = practice('drdronavalli');
  const llms = practiceLlms(drd, 'https://example.com');
  assert.match(llms, /- Office hours \(America\/Chicago\):/);
  assert.ok(llms.includes('Monday, 9:00 AM – 5:00 PM'));
  assert.ok(llms.includes('Saturday–Sunday, Closed'));
  const northHills = practiceLlms(practice('northhillspsychiatry'), 'https://example.com');
  assert.ok(northHills.includes('Monday, 10:30 AM – 6:00 PM'));
  assert.ok(northHills.includes('Tuesday, 8:00 AM – 3:00 PM'));
  assert.ok(northHills.includes('Wednesday, Closed'));
  const northwest = practiceLlms(practice('northwestpsychiatry'), 'https://example.com');
  assert.ok(northwest.includes('Friday, 8:00 AM – 3:00 PM'));
  assert.match(northwest, /- Telehealth-only days: Friday\./);
  delete drd.location.timeZone;
  assert.match(practiceLlms(drd, 'https://example.com'), /- Office hours: Monday,/);
  delete drd.location.hours;
  assert.doesNotMatch(practiceLlms(drd, 'https://example.com'), /- Office hours|- Telehealth-only days:/);
});

test('private-pay guides describe payment and enabled sections without implying insurance participation', () => {
  for (const slug of ['northhillspsychiatry', 'mariposa']) {
    const config = practice(slug);
    const llms = practiceLlms(config, 'https://example.com');
    assert.match(llms, /- Payment: .*private pay|private-pay|Private pay/);
    assert.match(overview(llms), /private pay/);
    assert.doesNotMatch(overview(llms), /insurance|treatments/);
    const minimal = structuredClone(config);
    minimal.providers = [];
    minimal.conditions = [];
    minimal.faqs = [];
    delete minimal.location;
    delete minimal.patientResources;
    delete minimal.resources;
    delete minimal.financialPolicy;
    minimal.insurance = { enabled: false };
    assert.equal(overview(practiceLlms(minimal, 'https://example.com')),
      '- [Practice overview](https://example.com/): appointments and contact.');
  }
});

test('availability and telehealth summaries use explicit practice facts, not provider defaults', () => {
  const config = practice('drdronavalli');
  delete config.practice.acceptsNewPatients;
  config.providers[0].telehealthOverride = true;
  assert.doesNotMatch(practiceLlms(config, 'https://example.com'), /- Accepting new patients:|- Telehealth:/);
  config.practice.acceptsNewPatients = false;
  assert.match(practiceLlms(config, 'https://example.com'), /- Accepting new patients: No/);
  config.practice.acceptsNewPatients = true;
  assert.match(practiceLlms(config, 'https://example.com'), /- Accepting new patients: Yes/);
  const northHills = practice('northhillspsychiatry');
  assert.ok(practiceLlms(northHills, 'https://example.com').includes(northHills.location.telehealthNotice));
  const centex = practice('centexmh');
  assert.ok(practiceLlms(centex, 'https://example.com').includes(centex.appointmentSection.telehealth.summary));
});

test('larger rosters and treatments are grouped with complete destinations and facts before link sections', () => {
  const config = practice('centexmh');
  const llms = practiceLlms(config, 'https://example.com/');
  assert.ok(llms.indexOf('- Payment:') < llms.indexOf('## Official pages'));
  assert.ok(llms.indexOf('Areas of care:') < llms.indexOf('## Official pages'));
  assert.match(llms, /## Providers\n/);
  assert.match(llms, /## Treatments\n/);
  assert.ok(llms.includes('[Provider directory](https://example.com/providers/)'));
  for (const provider of config.providers) {
    assert.ok(llms.includes(`https://example.com/providers/${provider.slug}/`));
  }
  for (const treatment of config.treatments) {
    assert.ok(llms.includes(`https://example.com/treatment/${treatment.slug}/`));
  }
  const solo = practiceLlms(practice('drdronavalli'), 'https://example.com');
  assert.doesNotMatch(solo, /## Providers|## Treatments/);
});
