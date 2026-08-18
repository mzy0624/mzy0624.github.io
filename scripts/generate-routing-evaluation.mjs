import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectRoot, 'content/router/routing-evaluation-source.json');
const boundaryPath = resolve(projectRoot, 'content/router/label-boundaries.json');
const questionBankPath = resolve(projectRoot, 'content/router/question-bank.json');
const routingDatasetPath = resolve(projectRoot, 'training/routing-dataset/all.jsonl');
const outputDirectory = resolve(projectRoot, 'training/routing-evaluation');
const outputPath = resolve(outputDirectory, 'all.jsonl');
const calibrationPath = resolve(outputDirectory, 'calibration.jsonl');
const testPath = resolve(outputDirectory, 'test.jsonl');
const statsPath = resolve(outputDirectory, 'stats.json');

function normalizeText(text) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function stripTerminalPunctuation(text) {
  return text.trim().replace(/[.!?]+$/u, '');
}

function lowerFirst(text) {
  if (/^I(?:['’\s]|$)/u.test(text)) return text;
  return text ? `${text[0].toLocaleLowerCase('en-US')}${text.slice(1)}` : text;
}

function conversationalVariant(text, index) {
  const embedded = lowerFirst(text.trim());
  const withoutTerminal = stripTerminalPunctuation(text);
  const variants = [
    `Hey, ${embedded}`,
    `Quick one: ${embedded}`,
    `Just wondering: ${embedded}`,
    `Could you help with this: ${embedded}`,
    `For this profile, ${embedded}`,
    `I was curious about this: ${embedded}`,
    `${withoutTerminal} — a brief answer is fine.`,
    `One thing I want to know: ${embedded}`,
  ];
  return variants[index % variants.length];
}

function pad(value) {
  return String(value).padStart(3, '0');
}

function evaluationSplit(itemIndex, labelIndex = 0) {
  return (itemIndex + labelIndex) % 2 === 0 ? 'calibration' : 'test';
}

function readJsonLines(contents) {
  return contents.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sourceText(item) {
  return typeof item === 'string' ? item : item.text;
}

function sourceExpectedLabel(item) {
  return typeof item === 'string' ? 'unknown' : item.expectedLabel;
}

function createRecord({ id, text, expectedLabel, category, boundaryLabel, variant, semanticGroup, split }) {
  const inScope = expectedLabel !== 'unknown';
  return {
    id,
    text,
    language: 'en',
    expected_label: expectedLabel,
    expected_gate_label: inScope ? 'in_scope' : 'reject',
    expected_route_label: inScope ? expectedLabel : null,
    expected_answer_id: expectedLabel,
    category,
    boundary_label: boundaryLabel,
    variant,
    semantic_group: semanticGroup,
    split,
    source: 'assistant_authored',
  };
}

const [source, boundaries, questionBank, routingDatasetContents] = await Promise.all([
  readFile(sourcePath, 'utf8').then(JSON.parse),
  readFile(boundaryPath, 'utf8').then(JSON.parse),
  readFile(questionBankPath, 'utf8').then(JSON.parse),
  readFile(routingDatasetPath, 'utf8'),
]);

const knownLabels = boundaries.labels.map(({ labelId }) => labelId).sort();
assert(JSON.stringify(Object.keys(source.positive).sort()) === JSON.stringify(knownLabels), 'Positive source labels must match all known labels.');
assert(JSON.stringify(Object.keys(source.hardNegative).sort()) === JSON.stringify(knownLabels), 'Hard-negative source labels must match all known labels.');
assert(knownLabels.every((labelId) => source.positive[labelId].length === 16), 'Each label must have 16 positive semantic groups.');
assert(knownLabels.every((labelId) => source.hardNegative[labelId].length === 10), 'Each label must have 10 hard-negative semantic groups.');
assert(source.broadUnknown.length === 62, 'The evaluation source must have 62 broad unknown semantic groups.');

const prototypeTexts = new Set(
  questionBank.labels.flatMap(({ questions }) => questions.map(({ text }) => normalizeText(text))),
);
const trainingTexts = new Set(readJsonLines(routingDatasetContents).map(({ text }) => normalizeText(text)));
const sourceTexts = [
  ...Object.values(source.positive).flat(),
  ...Object.values(source.hardNegative).flat(),
  ...source.broadUnknown,
];
const normalizedSourceTexts = sourceTexts.map(sourceText).map(normalizeText);

assert(new Set(normalizedSourceTexts).size === normalizedSourceTexts.length, 'Evaluation semantic-group texts must be unique.');
for (const text of normalizedSourceTexts) {
  assert(!prototypeTexts.has(text), `Evaluation source leaks a question-bank prototype: ${text}`);
  assert(!trainingTexts.has(text), `Evaluation source leaks a routing-dataset example: ${text}`);
}

const records = [];
let globalVariantIndex = 0;

knownLabels.forEach((labelId, labelIndex) => {
  source.positive[labelId].forEach((text, index) => {
    const semanticGroup = `positive/${labelId}/${pad(index + 1)}`;
    const split = evaluationSplit(index, labelIndex);
    records.push(createRecord({
      id: `eval-${semanticGroup.replaceAll('/', '-')}-clean`,
      text,
      expectedLabel: labelId,
      category: 'positive',
      boundaryLabel: labelId,
      variant: 'clean',
      semanticGroup,
      split,
    }));
    records.push(createRecord({
      id: `eval-${semanticGroup.replaceAll('/', '-')}-conversational`,
      text: conversationalVariant(text, globalVariantIndex),
      expectedLabel: labelId,
      category: 'positive',
      boundaryLabel: labelId,
      variant: 'conversational',
      semanticGroup,
      split,
    }));
    globalVariantIndex += 1;
  });

  source.hardNegative[labelId].forEach((item, index) => {
    const text = sourceText(item);
    const expectedLabel = sourceExpectedLabel(item);
    assert(expectedLabel === 'unknown' || knownLabels.includes(expectedLabel), `Unknown cross-label target: ${expectedLabel}`);
    assert(expectedLabel !== labelId, `A hard negative cannot route back to its boundary label: ${labelId}`);
    const semanticGroup = `hard-negative/${labelId}/${pad(index + 1)}`;
    const split = evaluationSplit(index, labelIndex);
    records.push(createRecord({
      id: `eval-${semanticGroup.replaceAll('/', '-')}-clean`,
      text,
      expectedLabel,
      category: 'hard_negative',
      boundaryLabel: labelId,
      variant: 'clean',
      semanticGroup,
      split,
    }));
    records.push(createRecord({
      id: `eval-${semanticGroup.replaceAll('/', '-')}-conversational`,
      text: conversationalVariant(text, globalVariantIndex),
      expectedLabel,
      category: 'hard_negative',
      boundaryLabel: labelId,
      variant: 'conversational',
      semanticGroup,
      split,
    }));
    globalVariantIndex += 1;
  });
});

source.broadUnknown.forEach((text, index) => {
  const semanticGroup = `broad-unknown/${pad(index + 1)}`;
  const split = evaluationSplit(index);
  records.push(createRecord({
    id: `eval-${semanticGroup.replaceAll('/', '-')}-clean`,
    text,
    expectedLabel: 'unknown',
    category: 'broad_unknown',
    boundaryLabel: null,
    variant: 'clean',
    semanticGroup,
    split,
  }));
  records.push(createRecord({
    id: `eval-${semanticGroup.replaceAll('/', '-')}-conversational`,
    text: conversationalVariant(text, globalVariantIndex),
    expectedLabel: 'unknown',
    category: 'broad_unknown',
    boundaryLabel: null,
    variant: 'conversational',
    semanticGroup,
    split,
  }));
  globalVariantIndex += 1;
});

const normalizedRecordTexts = records.map(({ text }) => normalizeText(text));
assert(records.length === 800, `Expected 800 records, received ${records.length}.`);
assert(new Set(records.map(({ id }) => id)).size === records.length, 'Evaluation record IDs must be unique.');
assert(new Set(normalizedRecordTexts).size === records.length, 'Evaluation record texts must be unique after normalization.');
for (const text of normalizedRecordTexts) {
  assert(!prototypeTexts.has(text), `Generated evaluation record leaks a question-bank prototype: ${text}`);
  assert(!trainingTexts.has(text), `Generated evaluation record leaks a routing-dataset example: ${text}`);
}

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
const stats = {
  schemaVersion: 1,
  generatedFrom: 'content/router/routing-evaluation-source.json',
  totalRecords: records.length,
  semanticGroups: new Set(records.map(({ semantic_group: semanticGroup }) => semanticGroup)).size,
  variantsPerGroup: 2,
  labelCounts,
  categoryCounts,
  splitCounts: Object.fromEntries(
    ['calibration', 'test'].map((split) => [
      split,
      records.filter(({ split: recordSplit }) => recordSplit === split).length,
    ]),
  ),
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(outputPath, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`, 'utf8'),
  writeFile(
    calibrationPath,
    `${records.filter(({ split }) => split === 'calibration').map((record) => JSON.stringify(record)).join('\n')}\n`,
    'utf8',
  ),
  writeFile(
    testPath,
    `${records.filter(({ split }) => split === 'test').map((record) => JSON.stringify(record)).join('\n')}\n`,
    'utf8',
  ),
  writeFile(statsPath, `${JSON.stringify(stats, null, 2)}\n`, 'utf8'),
]);

console.log(`Generated ${records.length} routing evaluation records across ${stats.semanticGroups} semantic groups.`);
