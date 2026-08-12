import test from 'node:test';
import assert from 'node:assert/strict';
import { heroGreetings, selectHeroGreeting } from '../src/data/hero-greetings.js';

test('randomly selects one of four concise hero greetings', () => {
  assert.deepEqual(heroGreetings, [
    'What would you like to discover?',
    'What would you like to explore?',
    'What are you curious about?',
    'What shall we explore?',
  ]);
  assert.equal(selectHeroGreeting(() => 0), heroGreetings[0]);
  assert.equal(selectHeroGreeting(() => 0.249999), heroGreetings[0]);
  assert.equal(selectHeroGreeting(() => 0.25), heroGreetings[1]);
  assert.equal(selectHeroGreeting(() => 0.5), heroGreetings[2]);
  assert.equal(selectHeroGreeting(() => 0.75), heroGreetings[3]);
  assert.equal(selectHeroGreeting(() => 0.999999), heroGreetings[3]);
});

test('rejects an invalid hero greeting random source', () => {
  assert.throws(() => selectHeroGreeting(null), TypeError);
  assert.throws(() => selectHeroGreeting(() => Number.NaN), TypeError);
});
