import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getImageProcessDelays,
  imageProcessDelayRanges,
} from '../src/api/image-process-timing.js';

test('randomizes each image-process stage within its configured range', () => {
  assert.deepEqual(getImageProcessDelays(() => 0), [480, 560]);
  assert.deepEqual(getImageProcessDelays(() => 0.5), [620, 720]);

  const maximumDelays = getImageProcessDelays(() => 0.999999);
  maximumDelays.forEach((delay, index) => {
    const [minimum, maximum] = imageProcessDelayRanges[index];
    assert.ok(delay >= minimum && delay <= maximum);
  });
});

test('rejects invalid image-process random sources', () => {
  assert.throws(() => getImageProcessDelays(null), TypeError);
  assert.throws(() => getImageProcessDelays(() => Number.NaN), TypeError);
});
