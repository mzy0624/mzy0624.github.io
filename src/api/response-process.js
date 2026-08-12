import { thinkingDetails } from '../data/thinking-details.js';

export const responseProcessProbabilities = Object.freeze({
  immediate: 0.4,
  loading: 0.3,
  thinking: 0.3,
});

export const responseLoadingDurationMs = 1000;
export const thinkingDurationSeconds = Object.freeze([2, 5]);

function sampleUnitInterval(random) {
  const sample = Number(random());
  if (!Number.isFinite(sample)) throw new TypeError('Response processing requires a finite random value.');
  return Math.min(Math.max(sample, 0), 1 - Number.EPSILON);
}

export function sampleResponseProcess(random = Math.random) {
  if (typeof random !== 'function') throw new TypeError('Response processing requires a random function.');

  const modeSample = sampleUnitInterval(random);
  if (modeSample < responseProcessProbabilities.immediate) {
    return Object.freeze({ mode: 'immediate', durationMs: 0 });
  }
  if (modeSample < responseProcessProbabilities.immediate + responseProcessProbabilities.loading) {
    return Object.freeze({ mode: 'loading', durationMs: responseLoadingDurationMs });
  }

  const [minimum, maximum] = thinkingDurationSeconds;
  const durationSeconds = Number(
    (minimum + sampleUnitInterval(random) * (maximum - minimum)).toFixed(1),
  );
  const detailIndex = Math.floor(sampleUnitInterval(random) * thinkingDetails.length);
  return Object.freeze({
    mode: 'thinking',
    durationMs: durationSeconds * 1000,
    durationSeconds,
    detail: thinkingDetails[detailIndex],
  });
}
