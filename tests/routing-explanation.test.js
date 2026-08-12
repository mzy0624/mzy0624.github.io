import test from 'node:test';
import assert from 'node:assert/strict';
import {
  routingExplanation,
  shouldShowRoutingExplanation,
} from '../src/data/routing-explanation.js';

test('shows the routing explanation only after an unknown answer', () => {
  assert.equal(shouldShowRoutingExplanation({ type: 'done', intentId: 'unknown' }), true);
  assert.equal(shouldShowRoutingExplanation({ type: 'done', intentId: 'internship' }), false);
  assert.equal(shouldShowRoutingExplanation({ type: 'done', intentId: 'research' }), false);
  assert.equal(shouldShowRoutingExplanation({ type: 'token', intentId: 'unknown' }), false);
});

test('routing explanation accurately describes the local heuristic', () => {
  const content = routingExplanation.text;

  assert.match(content, /not hooked up to an LLM API/i);
  assert.match(content, /ask it to write code/i);
  assert.match(content, /full local LLM/i);
  assert.match(content, /similarity-based heuristic router/i);
  assert.doesNotMatch(content, /embedding|top-k|threshold/i);
});
