import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EmbeddingIntentModel } from '../src/models/embedding-intent-model.js';
import { scorePrototypeLabels } from '../src/models/embedding-similarity.js';
import { PrototypeStore } from '../src/models/prototype-store.js';
import { intents } from '../src/data/intents.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filename) {
  return JSON.parse(readFileSync(resolve(projectRoot, filename), 'utf8'));
}

test('scores normalized prototype embeddings with max and top-k mean aggregation', () => {
  const query = Float32Array.from([1, 0]);
  const prototypes = Float32Array.from([
    1, 0,
    0.8, 0.6,
    0, 1,
    0.6, 0.8,
  ]);
  const labels = [
    { labelId: 'first', start: 0, count: 2 },
    { labelId: 'second', start: 2, count: 2 },
  ];

  assert.deepEqual(
    scorePrototypeLabels(query, prototypes, labels, { aggregation: 'max', topK: 1 }),
    [{ labelId: 'first', score: 1 }, { labelId: 'second', score: 0.6000000238418579 }],
  );
  const topMean = scorePrototypeLabels(
    query,
    prototypes,
    labels,
    { aggregation: 'top_k_mean', topK: 2 },
  );
  assert.equal(topMean[0].labelId, 'first');
  assert.ok(Math.abs(topMean[0].score - 0.9) < 1e-6);
});

test('prototype store loads and validates a binary Float32 matrix once', async () => {
  const manifest = {
    totalPrototypes: 2,
    dimensions: 2,
    labels: [{ labelId: 'identity_general', start: 0, count: 2 }],
  };
  const binary = Float32Array.from([1, 0, 0.5, 0.5]).buffer;
  let fetchCalls = 0;
  const fakeFetch = async (url) => {
    fetchCalls += 1;
    return url.endsWith('.json')
      ? { ok: true, json: async () => manifest }
      : { ok: true, arrayBuffer: async () => binary };
  };
  const store = new PrototypeStore({
    manifestUrl: 'https://example.test/prototypes.json',
    embeddingsUrl: 'https://example.test/prototypes.bin',
    fetchImplementation: fakeFetch,
  });

  const first = await store.load();
  const second = await store.load();
  assert.strictEqual(first, second);
  assert.equal(fetchCalls, 2);
  assert.deepEqual([...first.embeddings], [1, 0, 0.5, 0.5]);
});

test('embedding model routes above threshold and rejects below threshold', async () => {
  const vectors = new Map([
    ['known', Float32Array.from([1, 0])],
    ['uncertain', Float32Array.from([0.4, 0.4])],
  ]);
  const embedder = { embed: async ([text]) => [vectors.get(text)] };
  const prototypeStore = {
    load: async () => ({
      manifest: {
        modelId: 'test-model',
        labels: [
          { labelId: 'identity_general', start: 0, count: 1 },
          { labelId: 'portrait', start: 1, count: 1 },
        ],
      },
      embeddings: Float32Array.from([1, 0, 0, 1]),
    }),
  };
  const model = new EmbeddingIntentModel({
    intents,
    embedder,
    prototypeStore,
    configLoader: async () => ({
      modelId: 'test-model',
      threshold: 0.6,
      scoring: { aggregation: 'max', topK: 1 },
    }),
  });

  const known = await model.predict('known');
  const unknown = await model.predict('uncertain');
  assert.equal(known.intentId, 'identity_general');
  assert.equal(known.source, 'embedding-question-bank');
  assert.equal(unknown.intentId, 'unknown');
  assert.equal(unknown.source, 'embedding-threshold');
});

test('embedding model routes explicit short aliases without loading the embedding model', async () => {
  let embeddingCalls = 0;
  let storeCalls = 0;
  const model = new EmbeddingIntentModel({
    intents,
    embedder: {
      embed: async () => {
        embeddingCalls += 1;
        throw new Error('The embedder should not run for an explicit alias.');
      },
    },
    prototypeStore: {
      load: async () => {
        storeCalls += 1;
        throw new Error('The prototype store should not load for an explicit alias.');
      },
    },
    configLoader: async () => {
      throw new Error('The router config should not load for an explicit alias.');
    },
  });

  for (const prompt of ['contact', 'How can I contact?', 'email', '联系', '邮箱']) {
    const result = await model.predict(prompt);
    assert.equal(result.intentId, 'identity_contact', prompt);
    assert.equal(result.source, 'explicit-routing-alias', prompt);
  }
  assert.equal(embeddingCalls, 0);
  assert.equal(storeCalls, 0);
});

test('embedding model uses deterministic fallback when browser inference fails', async () => {
  let fallbackCalls = 0;
  const fallbackModel = {
    predict: async () => {
      fallbackCalls += 1;
      return { intentId: 'papers', answerId: 'papers', intent: { id: 'papers' } };
    },
  };
  const model = new EmbeddingIntentModel({
    intents,
    embedder: { embed: async () => { throw new Error('offline'); } },
    prototypeStore: { load: async () => ({}) },
    configLoader: async () => ({}),
    fallbackModel,
  });

  const result = await model.predict('How about your publications?');
  assert.equal(result.intentId, 'papers');
  assert.equal(fallbackCalls, 1);
});

test('generated embedding artifacts and calibrated reports remain consistent', () => {
  const manifest = readJson('public/data/question-bank-embeddings.json');
  const config = readJson('public/data/embedding-router-config.json');
  const calibration = readJson('training/routing-evaluation/embedding-calibration-report.json');
  const heldOutTest = readJson('training/routing-evaluation/embedding-test-report.json');
  const binary = readFileSync(resolve(projectRoot, 'public/data/question-bank-embeddings.bin'));

  assert.equal(manifest.modelId, 'Xenova/all-MiniLM-L6-v2');
  assert.equal(manifest.dtype, 'q8');
  assert.equal(manifest.dimensions, 384);
  assert.equal(manifest.totalPrototypes, 570);
  assert.equal(binary.byteLength, 570 * 384 * Float32Array.BYTES_PER_ELEMENT);
  assert.equal(createHash('sha256').update(binary).digest('hex'), manifest.embeddingsSha256);
  assert.deepEqual(config, calibration.selected.config);
  assert.deepEqual(config, heldOutTest.config);
  assert.equal(config.threshold, 0.544);
  assert.deepEqual(config.scoring, { aggregation: 'top_k_mean', topK: 5 });
  assert.ok(heldOutTest.metrics.macroF1 > 0.87);
  assert.ok(heldOutTest.metrics.unknown.recall > 0.73);
});
