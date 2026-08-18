import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPOSER_PLACEHOLDER } from '../src/components/composer.js';
import { site } from '../src/data/site.js';

test('composer placeholder invites a question without a language restriction', () => {
  assert.equal(COMPOSER_PLACEHOLDER, site.composerPlaceholder);
});
