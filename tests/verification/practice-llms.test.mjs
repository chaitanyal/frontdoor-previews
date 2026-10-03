import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { practiceLlms } from '../../src/lib/practice-production.mjs';

const practice = (slug) => JSON.parse(readFileSync(`sites/${slug}/practice.json`, 'utf8'));
const overview = (llms) => llms.split('\n').find((line) => line.startsWith('- [Practice overview]'));

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
