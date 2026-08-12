import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { intents } from '../src/data/intents.js';
import { labelQuestions } from '../src/data/label-questions.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const datasetDirectory = resolve(projectRoot, 'training/routing-dataset');

function readJsonLines(filename) {
  return readFileSync(resolve(datasetDirectory, filename), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

function normalizeText(text) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const all = readJsonLines('all.jsonl');

test('routing dataset has the intended first-version scale', () => {
  const inScope = all.filter(({ gate_label: gateLabel }) => gateLabel === 'in_scope');
  const rejected = all.filter(({ gate_label: gateLabel }) => gateLabel === 'reject');
  const knownLabels = Object.keys(labelQuestions).filter((label) => label !== 'unknown');

  assert.equal(all.length, 11640);
  assert.equal(inScope.length, 3640);
  assert.equal(rejected.length, 8000);
  for (const label of knownLabels) {
    assert.equal(inScope.filter(({ route_label: routeLabel }) => routeLabel === label).length, 280);
  }
});

test('dataset records obey the two-stage label schema', () => {
  const answerIdByLabel = new Map(intents.map(({ id, answerId }) => [id, answerId]));

  for (const record of all) {
    assert.ok(record.id);
    assert.ok(record.text.trim());
    assert.ok(['en', 'zh', 'und'].includes(record.language));
    assert.ok(['train', 'validation', 'test'].includes(record.split));
    assert.ok(record.semantic_group);

    if (record.gate_label === 'in_scope') {
      assert.ok(record.route_label);
      assert.equal(record.answer_id, answerIdByLabel.get(record.route_label));
      assert.equal(record.oos_category, null);
    } else {
      assert.equal(record.gate_label, 'reject');
      assert.equal(record.route_label, null);
      assert.equal(record.answer_id, 'unknown');
      assert.ok(record.oos_category);
    }
  }
});

test('general Yes/No routing follows each label boundary', () => {
  const routed = [
    ['Do you have any technical skills?', 'skills'],
    ['Have you published any papers?', 'papers'],
    ['Do you have any internship experience?', 'internship'],
    ['Do you have any hobbies?', 'hobbies'],
  ];

  for (const [text, expectedLabel] of routed) {
    const matches = all.filter((record) => normalizeText(record.text).includes(normalizeText(text)));
    assert.ok(matches.length > 0, text);
    assert.ok(matches.every((record) => record.gate_label === 'in_scope'), text);
    assert.ok(matches.every((record) => record.route_label === expectedLabel), text);
  }

  const identityFact = all.filter((record) => (
    normalizeText(record.text).includes(normalizeText('Are you a member of the LAMDA Group?'))
  ));
  assert.ok(identityFact.length > 0);
  assert.ok(identityFact.every((record) => record.gate_label === 'reject'));
});

test('normalized questions are unique and semantic groups never cross splits', () => {
  const normalized = all.map(({ text }) => normalizeText(text));
  const groupSplits = new Map();

  assert.equal(new Set(normalized).size, normalized.length);
  for (const { semantic_group: semanticGroup, split } of all) {
    const previous = groupSplits.get(semanticGroup);
    if (previous) assert.equal(previous, split, semanticGroup);
    else groupSplits.set(semanticGroup, split);
  }
});

test('split files exactly match the combined dataset', () => {
  for (const [split, expectedCount] of [
    ['train', 9390],
    ['validation', 1125],
    ['test', 1125],
  ]) {
    const records = readJsonLines(`${split}.jsonl`);
    assert.equal(records.length, expectedCount);
    assert.ok(records.every((record) => record.split === split));
    assert.deepEqual(
      records.map(({ id }) => id),
      all.filter((record) => record.split === split).map(({ id }) => id),
    );
  }
});
