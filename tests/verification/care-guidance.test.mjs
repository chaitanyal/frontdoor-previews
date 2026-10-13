import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { careGuidanceContent } from '../../src/lib/care-guidance.mjs';
import { homeSectionNavigation } from '../../src/lib/home-sections.mjs';
import { practiceLlms } from '../../src/lib/practice-production.mjs';

const help = { heading: 'Care here', summary: 'Confirmed practice services.' };
const single = { contentKeys: ['psychotherapy'], practiceHelp: help };

test('care guidance rejects unknown selections, incomplete hybrids, and invented treatment links', () => {
  const python = [
    'import json, sys',
    'from scripts.validate_practice_json import validate_care_guidance',
    'validate_care_guidance(json.load(sys.stdin))',
  ].join('\n');
  const cases = [
    [{}, null],
    [{ careGuidance: single }, null],
    [{ careGuidance: { contentKeys: ['psychotherapy'] } }, null],
    [{ careGuidance: { ...single, contentKeys: ['unknown'] } }, 'existing content keys'],
    [{ careGuidance: { ...single, contentKeys: ['psychotherapy', 'psychotherapy'] } }, 'unique existing'],
    [{ careGuidance: { ...single, contentKeys: ['psychiatry', 'psychotherapy'] } }, 'heading is required'],
    [{ careGuidance: { ...single, concernIds: ['worry', 'relationships', 'loss', 'unknown'] } }, 'unique concerns'],
    [{ careGuidance: { ...single, replaceConditions: 'yes' } }, 'must be a boolean'],
    [{ careGuidance: { ...single, practiceHelp: { ...help, treatmentSlugs: ['tms'] } } }, 'existing treatments'],
    [{ careGuidance: { ...single, contentKey: 'psychotherapy' } }, 'unsupported fields'],
    [{ careGuidance: { ...single, practiceHelp: {} } }, 'heading is required'],
    [{ careGuidance: { ...single, contentKeys: ['psychiatry', 'psychotherapy'], heading: 'Care options', introduction: 'Explore care.', concernIds: ['worry', 'mood', 'relationships', 'loss'] } }, null],
  ];
  for (const [config, error] of cases) {
    const result = spawnSync('python3', ['-c', python], {
      cwd: process.cwd(), encoding: 'utf8', input: JSON.stringify(config),
    });
    if (error) {
      assert.notEqual(result.status, 0);
      assert.ok(result.stderr.includes(error), result.stderr);
    } else assert.equal(result.status, 0, result.stderr);
  }
});

test('hybrid selection produces one ordered concern list without duplicate concerns', () => {
  const resolved = careGuidanceContent({ careGuidance: {
    contentKeys: ['psychiatry', 'psychotherapy'],
    heading: 'Explore care options', introduction: 'Care can take different forms.',
    concernIds: ['relationships', 'worry', 'mood', 'loss'], practiceHelp: help,
  } });
  assert.deepEqual(resolved.concerns.map((item) => item.id), ['relationships', 'worry', 'mood', 'loss']);
  assert.equal(resolved.concerns.filter((item) => item.id === 'worry').length, 1);
  assert.equal(resolved.heading, 'Explore care options');
  assert.equal(resolved.practiceHelp, help);
  assert.equal(careGuidanceContent({}), null);
  assert.throws(() => careGuidanceContent({ careGuidance: { ...single, contentKeys: ['unknown'] } }), /Unknown care guidance/);
});

test('Maya replaces concerns at the existing anchor; Centex retains conditions and treatments', () => {
  const maya = JSON.parse(readFileSync('sites/mayabennett/practice.json', 'utf8'));
  const centex = JSON.parse(readFileSync('sites/centexmh/practice.json', 'utf8'));
  const original = JSON.parse(readFileSync('sites/drdronavalli/practice.json', 'utf8'));
  const mayaSections = homeSectionNavigation(maya);
  assert.equal(mayaSections.find((item) => item.key === 'careGuidance').id, 'conditions');
  assert.equal(mayaSections.some((item) => item.key === 'conditions'), false);
  const centexSections = homeSectionNavigation(centex).map((item) => item.key);
  assert.ok(centexSections.indexOf('careGuidance') < centexSections.indexOf('conditions'));
  assert.ok(centexSections.includes('treatments'));
  assert.equal(homeSectionNavigation(original).some((item) => item.key === 'careGuidance'), false);
  assert.ok(practiceLlms(centex, 'https://example.com').includes('when to seek care'));
  assert.equal(careGuidanceContent(maya).concerns.length, 6);
  const centexConcerns = careGuidanceContent(centex).concerns.map((item) => item.id);
  assert.ok(centexConcerns.includes('intrusive-thoughts'));
  assert.ok(centexConcerns.includes('unusual-experiences'));
  const defaults = careGuidanceContent({ careGuidance: { contentKeys: ['psychiatry'] } });
  assert.equal(defaults.concerns.length, 6);
  assert.ok(defaults.concerns.some((item) => item.id === 'sleep'));
  assert.equal(defaults.concerns.some((item) => item.id === 'unusual-experiences'), false);
});
