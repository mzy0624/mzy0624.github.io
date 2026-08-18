import { site } from './site.js';

export const heroGreetings = site.heroGreetings;

export function selectHeroGreeting(random = Math.random) {
  if (typeof random !== 'function') {
    throw new TypeError('Hero greeting selection requires a random function.');
  }

  const sample = Number(random());
  if (!Number.isFinite(sample)) {
    throw new TypeError('Hero greeting selection requires a finite random value.');
  }

  const normalizedSample = Math.min(Math.max(sample, 0), 1 - Number.EPSILON);
  return heroGreetings[Math.floor(normalizedSample * heroGreetings.length)];
}
