import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { loadPracticeData } from '../../src/lib/practice-data.mjs';
import { practiceLlms } from '../../src/lib/practice-production.mjs';
import { previewTreatmentPaths } from '../../src/lib/preview-paths.mjs';

test('treatment validation rejects unsafe routes, collisions, missing content and unsafe links', () => {
  const valid = {
    slug: 'sleep-apnea', name: 'Sleep apnea', title: 'Sleep apnea care',
    summary: 'Evaluation and care options.',
    seo: { title: 'Sleep apnea care', description: 'Evaluation and care options.' },
    cta: { heading: 'Discuss care', summary: 'Contact the office.', label: 'Call Office' },
    sections: [{ heading: 'Evaluation', paragraphs: ['Discuss your symptoms.'] }],
  };
  const python = [
    'import json, sys',
    'from scripts.validate_practice_json import validate_treatments',
    'validate_treatments(json.load(sys.stdin))',
  ].join('\n');
  const cases = [
    [{}, null],
    [{ treatments: [] }, null],
    [{ treatments: [valid] }, null],
    [{ treatments: [{ ...valid, slug: '../privacy' }] }, '.slug must be'],
    [{ treatments: [valid, valid] }, 'duplicates another treatment'],
    [{ treatments: [{ ...valid, sections: [] }] }, 'at least one section'],
    [{ treatments: [{ ...valid, sections: [{ heading: 'Empty' }] }] }, 'paragraphs or bullets'],
    [{ treatments: [{ ...valid, resources: [{ title: 'Bad link', url: 'javascript:alert(1)' }] }] }, 'must be an HTTPS URL'],
    [{ treatments: [{ ...valid, resources: [{ title: 'Local guide', url: './assets/guide.pdf' }] }] }, null],
  ];
  for (const [config, error] of cases) {
    const result = spawnSync('python3', ['-c', python], {
      cwd: process.cwd(), encoding: 'utf8', input: JSON.stringify(config),
    });
    if (error) {
      assert.notEqual(result.status, 0);
      assert.ok(result.stderr.includes(error), result.stderr);
    } else {
      assert.equal(result.status, 0, result.stderr);
    }
  }
});

test('preview routes and llms.txt include configured treatments and omit clinics without them', async () => {
  const previous = process.env.FRONTDOOR_ASTRO_PRACTICE_IDS;
  process.env.FRONTDOOR_ASTRO_PRACTICE_IDS = JSON.stringify(['centexmh', 'northhillspsychiatry']);
  try {
    const paths = await previewTreatmentPaths(process.cwd());
    assert.deepEqual(paths.map((item) => item.params), [
      { practice: 'centexmh', treatment: 'tms' },
      { practice: 'centexmh', treatment: 'spravato' },
    ]);
    const { config } = await loadPracticeData(process.cwd(), 'centexmh');
    const llms = practiceLlms(config, 'https://example.com');
    assert.ok(llms.includes('https://example.com/treatment/tms/'));
    assert.ok(llms.includes('https://example.com/treatment/spravato/'));
    const { config: noTreatments } = await loadPracticeData(process.cwd(), 'northhillspsychiatry');
    assert.equal(practiceLlms(noTreatments, 'https://example.com').includes('/treatment/'), false);
  } finally {
    if (previous === undefined) delete process.env.FRONTDOOR_ASTRO_PRACTICE_IDS;
    else process.env.FRONTDOOR_ASTRO_PRACTICE_IDS = previous;
  }
});
