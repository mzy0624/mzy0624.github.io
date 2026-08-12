const imageProcessDelayRanges = Object.freeze([
  Object.freeze([480, 760]),
  Object.freeze([560, 880]),
]);

function sampleDuration([minimum, maximum], random) {
  const sample = Number(random());
  if (!Number.isFinite(sample)) throw new TypeError('Image process timing requires a finite random value.');
  const boundedSample = Math.min(Math.max(sample, 0), 1 - Number.EPSILON);
  return minimum + Math.floor(boundedSample * (maximum - minimum + 1));
}

export function getImageProcessDelays(random = Math.random) {
  if (typeof random !== 'function') throw new TypeError('Image process timing requires a random function.');
  return imageProcessDelayRanges.map((range) => sampleDuration(range, random));
}

export { imageProcessDelayRanges };
