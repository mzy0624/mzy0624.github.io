import test from 'node:test';
import assert from 'node:assert/strict';
import { heroGreetings, selectHeroGreeting } from '../src/data/hero-greetings.js';

test('randomly selects from the configured hero greetings', () => {
  assert.ok(heroGreetings.length > 0);
  assert.equal(selectHeroGreeting(() => 0), heroGreetings[0]);
  heroGreetings.forEach((greeting, index) => {
    assert.equal(selectHeroGreeting(() => index / heroGreetings.length), greeting);
  });
  assert.equal(selectHeroGreeting(() => 0.999999), heroGreetings.at(-1));
});

test('rejects an invalid hero greeting random source', () => {
  assert.throws(() => selectHeroGreeting(null), TypeError);
  assert.throws(() => selectHeroGreeting(() => Number.NaN), TypeError);
});
