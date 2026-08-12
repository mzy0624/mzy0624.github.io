import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scorePrototypeLabels } from '../src/models/embedding-similarity.js';
import { MODEL_ID, embedTexts } from './lib/local-embedding-runtime.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evaluationDirectory = resolve(projectRoot, 'training/routing-evaluation');
const publicDataDirectory = resolve(projectRoot, 'public/data');

function readJsonLines(contents) {
  return contents.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

async function loadPrototypeStore() {
  const [manifestContents, binary] = await Promise.all([
    readFile(resolve(publicDataDirectory, 'question-bank-embeddings.json'), 'utf8'),
    readFile(resolve(publicDataDirectory, 'question-bank-embeddings.bin')),
  ]);
  const manifest = JSON.parse(manifestContents);
  const copied = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
  return { manifest, embeddings: new Float32Array(copied) };
}

function classMetrics(expected, predicted, label) {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] === label && predicted[index] === label) truePositive += 1;
    if (expected[index] !== label && predicted[index] === label) falsePositive += 1;
    if (expected[index] === label && predicted[index] !== label) falseNegative += 1;
  }
  const precision = truePositive / (truePositive + falsePositive || 1);
  const recall = truePositive / (truePositive + falseNegative || 1);
  const f1 = 2 * precision * recall / (precision + recall || 1);
  return { precision, recall, f1, support: truePositive + falseNegative };
}

function evaluate(scoredRecords, threshold, knownLabels) {
  const expected = scoredRecords.map(({ record }) => record.expected_label);
  const predicted = scoredRecords.map(({ best }) => (
    best.score >= threshold ? best.labelId : 'unknown'
  ));
  const labels = [...knownLabels, 'unknown'];
  const perLabel = Object.fromEntries(labels.map((label) => [
    label,
    classMetrics(expected, predicted, label),
  ]));
  const accuracy = predicted.filter((label, index) => label === expected[index]).length / expected.length;
  const macroF1 = labels.reduce((total, label) => total + perLabel[label].f1, 0) / labels.length;
  const knownMacroF1 = knownLabels.reduce(
    (total, label) => total + perLabel[label].f1,
    0,
  ) / knownLabels.length;
  const hardNegativeIndices = scoredRecords
    .map(({ record }, index) => (record.category === 'hard_negative' ? index : -1))
    .filter((index) => index >= 0);
  const crossLabelIndices = hardNegativeIndices.filter((index) => expected[index] !== 'unknown');
  const subsetAccuracy = (indices) => indices.filter(
    (index) => predicted[index] === expected[index],
  ).length / (indices.length || 1);

  return {
    threshold,
    accuracy,
    macroF1,
    knownMacroF1,
    unknown: perLabel.unknown,
    hardNegativeAccuracy: subsetAccuracy(hardNegativeIndices),
    crossLabelHardNegativeAccuracy: subsetAccuracy(crossLabelIndices),
    crossLabelHardNegativeCount: crossLabelIndices.length,
    perLabel,
  };
}

async function scoreRecords(records, scoring, store) {
  const vectors = await embedTexts(records.map(({ text }) => text), { projectRoot });
  return records.map((record, index) => ({
    record,
    best: scorePrototypeLabels(
      vectors[index],
      store.embeddings,
      store.manifest.labels,
      scoring,
    )[0],
  }));
}

function chooseThreshold(scoredRecords, knownLabels, minimumUnknownRecall = 0.75) {
  const eligible = [];
  for (let step = 0; step <= 1000; step += 1) {
    const metrics = evaluate(scoredRecords, step / 1000, knownLabels);
    if (metrics.unknown.recall >= minimumUnknownRecall) eligible.push(metrics);
  }
  const pool = eligible.length > 0
    ? eligible
    : Array.from({ length: 1001 }, (_, step) => (
      evaluate(scoredRecords, step / 1000, knownLabels)
    ));
  let best = null;
  for (const metrics of pool) {
    if (
      !best
      || metrics.macroF1 > best.macroF1
      || (metrics.macroF1 === best.macroF1 && metrics.accuracy > best.accuracy)
      || (
        metrics.macroF1 === best.macroF1
        && metrics.accuracy === best.accuracy
        && metrics.unknown.f1 > best.unknown.f1
      )
    ) {
      best = metrics;
    }
  }
  return best;
}

const [calibrationContents, testContents, store] = await Promise.all([
  readFile(resolve(evaluationDirectory, 'calibration.jsonl'), 'utf8'),
  readFile(resolve(evaluationDirectory, 'test.jsonl'), 'utf8'),
  loadPrototypeStore(),
]);
const calibrationRecords = readJsonLines(calibrationContents);
const testRecords = readJsonLines(testContents);
const knownLabels = store.manifest.labels.map(({ labelId }) => labelId);
const scoringCandidates = [
  { aggregation: 'max', topK: 1 },
  { aggregation: 'top_k_mean', topK: 2 },
  { aggregation: 'top_k_mean', topK: 3 },
  { aggregation: 'top_k_mean', topK: 5 },
];
const candidates = [];

for (const scoring of scoringCandidates) {
  const scoredRecords = await scoreRecords(calibrationRecords, scoring, store);
  candidates.push({ scoring, metrics: chooseThreshold(scoredRecords, knownLabels) });
}

candidates.sort((left, right) => (
  right.metrics.macroF1 - left.metrics.macroF1
  || right.metrics.accuracy - left.metrics.accuracy
  || right.metrics.unknown.f1 - left.metrics.unknown.f1
));
const selected = candidates[0];
const scoredTestRecords = await scoreRecords(testRecords, selected.scoring, store);
const testMetrics = evaluate(scoredTestRecords, selected.metrics.threshold, knownLabels);
const runtimeConfig = {
  schemaVersion: 1,
  modelId: MODEL_ID,
  threshold: selected.metrics.threshold,
  scoring: selected.scoring,
  calibratedOn: 'training/routing-evaluation/calibration.jsonl',
  prototypeManifest: 'data/question-bank-embeddings.json',
};
const calibrationReport = {
  schemaVersion: 1,
  selectionMetric: 'maximum macroF1 subject to unknown recall >= 0.75',
  selected: {
    config: runtimeConfig,
    metrics: selected.metrics,
  },
  candidates,
};
const testReport = {
  schemaVersion: 1,
  config: runtimeConfig,
  metrics: testMetrics,
};

await Promise.all([
  writeFile(
    resolve(publicDataDirectory, 'embedding-router-config.json'),
    `${JSON.stringify(runtimeConfig, null, 2)}\n`,
    'utf8',
  ),
  writeFile(
    resolve(evaluationDirectory, 'embedding-calibration-report.json'),
    `${JSON.stringify(calibrationReport, null, 2)}\n`,
    'utf8',
  ),
  writeFile(
    resolve(evaluationDirectory, 'embedding-test-report.json'),
    `${JSON.stringify(testReport, null, 2)}\n`,
    'utf8',
  ),
]);

console.log(JSON.stringify({
  selected: runtimeConfig,
  calibration: selected.metrics,
  test: testMetrics,
}, null, 2));
