import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filename) {
  return JSON.parse(readFileSync(resolve(projectRoot, filename), 'utf8'));
}

function readJsonLines(filename) {
  return readFileSync(resolve(projectRoot, filename), 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
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

const boundaries = readJson('content/router/label-boundaries.json');
const questionBank = readJson('content/router/question-bank.json');
const source = readJson('content/router/routing-evaluation-source.json');
const records = readJsonLines('training/routing-evaluation/all.jsonl');
const calibrationRecords = readJsonLines('training/routing-evaluation/calibration.jsonl');
const testRecords = readJsonLines('training/routing-evaluation/test.jsonl');
const stats = readJson('training/routing-evaluation/stats.json');
const trainingRecords = readJsonLines('training/routing-dataset/all.jsonl');
const knownLabels = boundaries.labels.map(({ labelId }) => labelId).sort();

test('evaluation source covers every label and the intended OOS categories', () => {
  assert.deepEqual(Object.keys(source.positive).sort(), knownLabels);
  assert.deepEqual(Object.keys(source.hardNegative).sort(), knownLabels);
  assert.ok(knownLabels.every((labelId) => source.positive[labelId].length === 16));
  assert.ok(knownLabels.every((labelId) => source.hardNegative[labelId].length === 10));
  assert.equal(source.broadUnknown.length, 62);
});

test('evaluation dataset contains 800 records across 400 paired semantic groups', () => {
  assert.equal(records.length, 800);
  assert.equal(stats.totalRecords, 800);
  assert.equal(stats.semanticGroups, 400);
  assert.equal(stats.variantsPerGroup, 2);
  assert.deepEqual(stats.categoryCounts, {
    positive: 416,
    hard_negative: 260,
    broad_unknown: 124,
  });
  assert.deepEqual(stats.splitCounts, { calibration: 400, test: 400 });

  const grouped = Map.groupBy(records, ({ semantic_group: semanticGroup }) => semanticGroup);
  assert.equal(grouped.size, 400);
  for (const groupRecords of grouped.values()) {
    assert.equal(groupRecords.length, 2);
    assert.deepEqual(new Set(groupRecords.map(({ variant }) => variant)), new Set(['clean', 'conversational']));
    assert.equal(new Set(groupRecords.map(({ expected_label: label }) => label)).size, 1);
    assert.equal(new Set(groupRecords.map(({ category }) => category)).size, 1);
    assert.equal(new Set(groupRecords.map(({ boundary_label: label }) => label)).size, 1);
    assert.equal(new Set(groupRecords.map(({ split }) => split)).size, 1);
  }
});

test('calibration and test files are disjoint, group-safe views of all records', () => {
  assert.equal(calibrationRecords.length, 400);
  assert.equal(testRecords.length, 400);

  const calibrationIds = new Set(calibrationRecords.map(({ id }) => id));
  const testIds = new Set(testRecords.map(({ id }) => id));
  const allIds = new Set(records.map(({ id }) => id));
  const calibrationGroups = new Set(calibrationRecords.map(({ semantic_group: group }) => group));
  const testGroups = new Set(testRecords.map(({ semantic_group: group }) => group));

  assert.equal(calibrationIds.intersection(testIds).size, 0);
  assert.equal(calibrationGroups.intersection(testGroups).size, 0);
  assert.deepEqual(calibrationIds.union(testIds), allIds);
  assert.ok(calibrationRecords.every(({ split }) => split === 'calibration'));
  assert.ok(testRecords.every(({ split }) => split === 'test'));
});

test('evaluation records obey final-label and boundary semantics', () => {
  const allowedLabels = new Set([...knownLabels, 'unknown']);
  const allowedCategories = new Set(['positive', 'hard_negative', 'broad_unknown']);

  for (const record of records) {
    assert.equal(record.language, 'en');
    assert.equal(record.source, 'assistant_authored');
    assert.ok(record.split === 'calibration' || record.split === 'test');
    assert.ok(allowedLabels.has(record.expected_label));
    assert.ok(allowedCategories.has(record.category));

    const inScope = record.expected_label !== 'unknown';
    assert.equal(record.expected_gate_label, inScope ? 'in_scope' : 'reject');
    assert.equal(record.expected_route_label, inScope ? record.expected_label : null);
    assert.equal(record.expected_answer_id, record.expected_label);

    if (record.category === 'positive') {
      assert.equal(record.expected_label, record.boundary_label);
    } else if (record.category === 'hard_negative') {
      assert.ok(knownLabels.includes(record.boundary_label));
      assert.notEqual(record.expected_label, record.boundary_label);
    } else {
      assert.equal(record.expected_label, 'unknown');
      assert.equal(record.boundary_label, null);
    }
  }
});

test('evaluation IDs and normalized texts are globally unique', () => {
  const ids = records.map(({ id }) => id);
  const texts = records.map(({ text }) => normalizeText(text));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(texts).size, texts.length);
});

test('evaluation text has no exact normalized leakage from prototypes or training data', () => {
  const evaluationTexts = new Set(records.map(({ text }) => normalizeText(text)));
  const prototypeTexts = new Set(
    questionBank.labels.flatMap(({ questions }) => questions.map(({ text }) => normalizeText(text))),
  );
  const trainingTexts = new Set(trainingRecords.map(({ text }) => normalizeText(text)));

  assert.equal(evaluationTexts.intersection(prototypeTexts).size, 0);
  assert.equal(evaluationTexts.intersection(trainingTexts).size, 0);
});

test('stored evaluation statistics match the generated records', () => {
  const labelCounts = Object.fromEntries(
    [...knownLabels, 'unknown'].map((labelId) => [
      labelId,
      records.filter(({ expected_label: expectedLabel }) => expectedLabel === labelId).length,
    ]),
  );
  const categoryCounts = Object.fromEntries(
    ['positive', 'hard_negative', 'broad_unknown'].map((category) => [
      category,
      records.filter(({ category: recordCategory }) => recordCategory === category).length,
    ]),
  );

  assert.deepEqual(stats.labelCounts, labelCounts);
  assert.deepEqual(stats.categoryCounts, categoryCounts);
});
