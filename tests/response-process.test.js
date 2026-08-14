import test from 'node:test';
import assert from 'node:assert/strict';
import {
  longThinkingDurationSeconds,
  organizingAnswerStatus,
  responseLoadingDurationMs,
  responseProcessProbabilities,
  sampleResponseProcess,
  thinkingDurationSeconds,
} from '../src/api/response-process.js';
import { thinkingDetails, thinkingMoments } from '../src/data/thinking-details.js';

test('selects immediate, loading, ordinary thinking, and long thinking at the configured boundaries', () => {
  assert.equal(sampleResponseProcess(() => 0).mode, 'immediate');
  assert.equal(sampleResponseProcess(() => 0.399999).mode, 'immediate');
  assert.deepEqual(sampleResponseProcess(() => 0.4), {
    mode: 'loading',
    durationMs: responseLoadingDurationMs,
  });
  assert.equal(sampleResponseProcess(() => 0.699999).mode, 'loading');

  const ordinaryMinimum = [0.7, 0, 0];
  const ordinaryMaximum = [0.899999, 0.999999, 0.999999];
  assert.equal(sampleResponseProcess(() => ordinaryMinimum.shift()).durationSeconds, 2);
  assert.equal(sampleResponseProcess(() => ordinaryMaximum.shift()).durationSeconds, 5);

  const longMinimum = [0.9, 0, 0];
  const longMaximum = [0.999999, 0.999999, 0.999999];
  assert.equal(sampleResponseProcess(() => longMinimum.shift()).durationSeconds, 5);
  assert.equal(sampleResponseProcess(() => longMaximum.shift()).durationSeconds, 10);

  assert.deepEqual(thinkingDurationSeconds, [2, 5]);
  assert.deepEqual(longThinkingDurationSeconds, [5, 10]);
});

test('ordinary thinking has two equal-time status stages', () => {
  const samples = [0.8, 0.5, 0];
  assert.deepEqual(sampleResponseProcess(() => samples.shift()), {
    mode: 'thinking',
    durationMs: 3500,
    durationSeconds: 3.5,
    detail: thinkingMoments[0].detail,
    status: thinkingMoments[0].status,
    stageMessages: ['Thinking', thinkingMoments[0].status],
  });
});

test('long thinking has three equal-time status stages', () => {
  const samples = [0.9, 0.5, 0];
  assert.deepEqual(sampleResponseProcess(() => samples.shift()), {
    mode: 'long-thinking',
    durationMs: 7500,
    durationSeconds: 7.5,
    detail: thinkingMoments[0].detail,
    status: thinkingMoments[0].status,
    stageMessages: ['Thinking', thinkingMoments[0].status, organizingAnswerStatus],
  });
});

test('disallowed long thinking falls back to an immediate answer', () => {
  const samples = [0.9];
  const process = sampleResponseProcess(
    () => samples.shift(),
    { allowLongThinking: false },
  );

  assert.deepEqual(process, { mode: 'immediate', durationMs: 0 });
});

test('disallowed thinking skips both ordinary and long-thinking branches', () => {
  for (const modeSample of [0.8, 0.95]) {
    const samples = [modeSample];
    const process = sampleResponseProcess(
      () => samples.shift(),
      { allowThinking: false },
    );

    assert.deepEqual(process, { mode: 'immediate', durationMs: 0 });
    assert.equal(samples.length, 0);
  }
});

test('samples whimsical thinking moments across the full collection', () => {
  const firstSamples = [0.8, 0.5, 0];
  const lastSamples = [0.8, 0.5, 0.999999];

  assert.equal(
    sampleResponseProcess(() => firstSamples.shift()).detail,
    thinkingDetails[0],
  );
  assert.equal(
    sampleResponseProcess(() => lastSamples.shift()).detail,
    thinkingDetails.at(-1),
  );
  assert.equal(thinkingMoments.length, 30);
  assert.equal(new Set(thinkingDetails).size, thinkingDetails.length);
  assert.equal(
    new Set(thinkingMoments.map(({ status }) => status)).size,
    thinkingMoments.length,
  );
});

test('response-process probabilities total one', () => {
  const total = Object.values(responseProcessProbabilities)
    .reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 1) < Number.EPSILON);
});

test('rejects invalid response-process inputs', () => {
  assert.throws(() => sampleResponseProcess(null), TypeError);
  assert.throws(() => sampleResponseProcess(() => Number.NaN), TypeError);
  assert.throws(
    () => sampleResponseProcess(() => 0.9, { allowLongThinking: 'yes' }),
    TypeError,
  );
  assert.throws(
    () => sampleResponseProcess(() => 0.8, { allowThinking: 'yes' }),
    TypeError,
  );
});
