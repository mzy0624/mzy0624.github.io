import { thinkingMoments } from '../data/thinking-details.js';

export const responseProcessProbabilities = Object.freeze({
  immediate: 0.4,
  loading: 0.3,
  thinking: 0.2,
  longThinking: 0.1,
});

export const responseLoadingDurationMs = 1000;
export const thinkingDurationSeconds = Object.freeze([2, 5]);
export const longThinkingDurationSeconds = Object.freeze([5, 10]);
export const organizingAnswerStatus = 'Organizing the answer';

function sampleUnitInterval(random) {
  const sample = Number(random());
  if (!Number.isFinite(sample)) throw new TypeError('Response processing requires a finite random value.');
  return Math.min(Math.max(sample, 0), 1 - Number.EPSILON);
}

function sampleThinkingProcess(random, longThinking) {
  const [minimum, maximum] = longThinking
    ? longThinkingDurationSeconds
    : thinkingDurationSeconds;
  const durationSeconds = Number(
    (minimum + sampleUnitInterval(random) * (maximum - minimum)).toFixed(1),
  );
  const momentIndex = Math.floor(sampleUnitInterval(random) * thinkingMoments.length);
  const moment = thinkingMoments[momentIndex];
  const stageMessages = longThinking
    ? ['Thinking', moment.status, organizingAnswerStatus]
    : ['Thinking', moment.status];

  return Object.freeze({
    mode: longThinking ? 'long-thinking' : 'thinking',
    durationMs: durationSeconds * 1000,
    durationSeconds,
    detail: moment.detail,
    status: moment.status,
    stageMessages: Object.freeze(stageMessages),
  });
}

export function sampleResponseProcess(
  random = Math.random,
  { allowThinking = true, allowLongThinking = true } = {},
) {
  if (typeof random !== 'function') throw new TypeError('Response processing requires a random function.');
  if (typeof allowThinking !== 'boolean') {
    throw new TypeError('allowThinking must be a boolean.');
  }
  if (typeof allowLongThinking !== 'boolean') {
    throw new TypeError('allowLongThinking must be a boolean.');
  }

  const modeSample = sampleUnitInterval(random);
  if (modeSample < responseProcessProbabilities.immediate) {
    return Object.freeze({ mode: 'immediate', durationMs: 0 });
  }
  if (modeSample < responseProcessProbabilities.immediate + responseProcessProbabilities.loading) {
    return Object.freeze({ mode: 'loading', durationMs: responseLoadingDurationMs });
  }
  if (
    modeSample
    < responseProcessProbabilities.immediate
      + responseProcessProbabilities.loading
      + responseProcessProbabilities.thinking
  ) {
    if (!allowThinking) return Object.freeze({ mode: 'immediate', durationMs: 0 });
    return sampleThinkingProcess(random, false);
  }

  if (!allowThinking) return Object.freeze({ mode: 'immediate', durationMs: 0 });
  if (!allowLongThinking) return Object.freeze({ mode: 'immediate', durationMs: 0 });
  return sampleThinkingProcess(random, true);
}
