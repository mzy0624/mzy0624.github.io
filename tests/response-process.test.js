import test from 'node:test';
import assert from 'node:assert/strict';
import {
  responseLoadingDurationMs,
  responseProcessProbabilities,
  sampleResponseProcess,
} from '../src/api/response-process.js';
import { thinkingDetails } from '../src/data/thinking-details.js';

test('selects immediate, loading, and thinking at the configured probability boundaries', () => {
  assert.equal(sampleResponseProcess(() => 0).mode, 'immediate');
  assert.equal(sampleResponseProcess(() => 0.399999).mode, 'immediate');
  assert.deepEqual(sampleResponseProcess(() => 0.4), {
    mode: 'loading',
    durationMs: responseLoadingDurationMs,
  });
  assert.equal(sampleResponseProcess(() => 0.699999).mode, 'loading');

  const minimumSamples = [0.7, 0, 0];
  const maximumSamples = [0.999999, 0.999999, 0.999999];
  assert.equal(sampleResponseProcess(() => minimumSamples.shift()).durationSeconds, 2);
  assert.equal(sampleResponseProcess(() => maximumSamples.shift()).durationSeconds, 5);

  const fractionalSamples = [0.7, 0.5, 0];
  assert.deepEqual(sampleResponseProcess(() => fractionalSamples.shift()), {
    mode: 'thinking',
    durationMs: 3500,
    durationSeconds: 3.5,
    detail: thinkingDetails[0],
  });
});

test('samples whimsical thinking details across the full collection', () => {
  const firstSamples = [0.7, 0.5, 0];
  const lastSamples = [0.7, 0.5, 0.999999];

  assert.equal(
    sampleResponseProcess(() => firstSamples.shift()).detail,
    thinkingDetails[0],
  );
  assert.equal(
    sampleResponseProcess(() => lastSamples.shift()).detail,
    thinkingDetails.at(-1),
  );
  assert.ok(thinkingDetails.length >= 20);
  assert.equal(new Set(thinkingDetails).size, thinkingDetails.length);
});

test('response-process probabilities total one', () => {
  assert.equal(
    Object.values(responseProcessProbabilities).reduce((total, value) => total + value, 0),
    1,
  );
});

test('rejects an invalid response-process random source', () => {
  assert.throws(() => sampleResponseProcess(null), TypeError);
  assert.throws(() => sampleResponseProcess(() => Number.NaN), TypeError);
});
