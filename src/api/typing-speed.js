const MINIMUM_TARGET_DURATION = 600;
const MAXIMUM_TARGET_DURATION = 3200;
const BASE_TARGET_DURATION = 450;
const DURATION_PER_CHARACTER = 1.8;
const MINIMUM_TOKEN_DELAY = 2;

export function getTypingDelay(characterCount, maximumDelay = 8) {
  if (!Number.isFinite(characterCount) || characterCount < 0) {
    throw new RangeError('Character count must be a non-negative finite number.');
  }
  if (!Number.isFinite(maximumDelay) || maximumDelay < 0) {
    throw new RangeError('Maximum typing delay must be a non-negative finite number.');
  }
  if (characterCount === 0 || maximumDelay === 0) return 0;

  const targetDuration = Math.min(
    MAXIMUM_TARGET_DURATION,
    Math.max(
      MINIMUM_TARGET_DURATION,
      BASE_TARGET_DURATION + characterCount * DURATION_PER_CHARACTER,
    ),
  );
  const delayFloor = Math.min(MINIMUM_TOKEN_DELAY, maximumDelay);

  return Math.max(
    delayFloor,
    Math.min(maximumDelay, targetDuration / characterCount),
  );
}
