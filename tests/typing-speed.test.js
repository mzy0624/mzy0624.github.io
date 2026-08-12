import test from 'node:test';
import assert from 'node:assert/strict';
import { getTypingDelay } from '../src/api/typing-speed.js';

test('uses progressively shorter token delays for longer output', () => {
  const shortDelay = getTypingDelay(60);
  const mediumDelay = getTypingDelay(200);
  const longDelay = getTypingDelay(700);

  assert.equal(shortDelay, 8);
  assert.ok(mediumDelay < shortDelay);
  assert.ok(longDelay < mediumDelay);
});

test('respects the configured speed cap and reduced-motion instant output', () => {
  assert.equal(getTypingDelay(60, 5), 5);
  assert.equal(getTypingDelay(700, 0), 0);
  assert.equal(getTypingDelay(0), 0);
});

test('rejects invalid typing inputs', () => {
  assert.throws(() => getTypingDelay(-1), RangeError);
  assert.throws(() => getTypingDelay(100, Number.NaN), RangeError);
});
