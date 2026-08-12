import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answers, intents } from '../src/data/intents.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filename) {
  return JSON.parse(readFileSync(resolve(projectRoot, filename), 'utf8'));
}

function normalizeText(text) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const boundaries = readJson('training/label-boundaries.json');
const questionBank = readJson('training/question-bank.json');
const answersById = new Map(answers.map((answer) => [answer.id, answer]));
const allowedQuestionStyles = new Set([
  'direct',
  'imperative',
  'polite_request',
  'conversational',
  'contextual',
  'short_fragment',
  'colloquial',
]);
const expectedQuestionCounts = new Map([
  ['identity_general', 46],
  ['portrait', 47],
  ['identity_contact', 50],
  ['education', 49],
  ['research', 42],
  ['learnware', 42],
  ['model_capability_mining', 42],
  ['papers', 42],
  ['skills', 42],
  ['hobbies', 42],
  ['services', 42],
  ['internship', 42],
  ['correspondence', 42],
]);

test('label boundaries cover every known label exactly once', () => {
  const expected = intents.filter(({ id }) => id !== 'unknown').map(({ id }) => id).sort();
  const actual = boundaries.labels.map(({ labelId }) => labelId).sort();
  const answerIdByLabel = new Map(intents.map(({ id, answerId }) => [id, answerId]));

  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual).size, actual.length);
  for (const boundary of boundaries.labels) {
    assert.equal(boundary.answerId, answerIdByLabel.get(boundary.labelId));
    assert.ok(boundary.representativeQuestion);
    assert.ok(boundary.description);
    assert.ok(boundary.include.length > 0);
    assert.ok(boundary.exclude.length > 0);
  }
});

test('internship boundary and runtime answer both use tracked NULL', () => {
  const boundary = boundaries.labels.find(({ labelId }) => labelId === 'internship');
  const answer = answersById.get('internship');

  assert.deepEqual(boundary.response, { mode: 'tracked', text: 'NULL' });
  assert.equal(answer.repeatMode, 'tracked');
  assert.deepEqual(answer.variants.map(({ text }) => text), ['NULL']);
});

test('question bank covers all labels with unique, style-diverse English questions', () => {
  const boundaryIds = boundaries.labels.map(({ labelId }) => labelId).sort();
  const bankIds = questionBank.labels.map(({ labelId }) => labelId).sort();
  const allQuestionIds = [];
  const allQuestionTexts = [];

  assert.deepEqual(bankIds, boundaryIds);
  assert.equal(new Set(bankIds).size, bankIds.length);
  assert.deepEqual(bankIds, [...expectedQuestionCounts.keys()].sort());

  for (const { labelId, questions } of questionBank.labels) {
    assert.equal(questions.length, expectedQuestionCounts.get(labelId), `${labelId} question count`);
    assert.ok(questions.every(({ language }) => language === 'en'), `${labelId} must be English-only`);
    assert.ok(
      questions.every(({ style }) => allowedQuestionStyles.has(style)),
      `${labelId} contains an unsupported style`,
    );
    assert.deepEqual(
      new Set(questions.map(({ style }) => style)),
      allowedQuestionStyles,
      `${labelId} must cover every supported style`,
    );

    allQuestionIds.push(...questions.map(({ id }) => id));
    allQuestionTexts.push(...questions.map(({ text }) => normalizeText(text)));
  }

  assert.equal(allQuestionIds.length, 570);
  assert.equal(new Set(allQuestionIds).size, allQuestionIds.length, 'question IDs must be globally unique');
  assert.equal(
    new Set(allQuestionTexts).size,
    allQuestionTexts.length,
    'normalized question texts must be globally unique',
  );
});
