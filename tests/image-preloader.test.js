import test from 'node:test';
import assert from 'node:assert/strict';

import {
  answerImageAssets,
  criticalUiImageAssets,
  deferredImageAssets,
  preloadImagesLazily,
  profileImageAssets,
} from '../src/api/image-preloader.js';
import { answers } from '../src/data/intents.js';
import { profile } from '../src/data/profile.js';
import { site } from '../src/data/site.js';

test('profile image warmup covers local UI images without preloading large on-demand media', () => {
  const assets = profileImageAssets(profile);

  assert.equal(new Set(assets).size, assets.length);
  assert.ok(assets.includes(site.assets.avatar));
  assert.ok(profile.socialProfiles.every(({ icon }) => assets.includes(icon)));
  assert.ok(profile.affiliations.every(({ logo }) => assets.includes(logo)));
  assert.ok(profile.skills.every(({ icon }) => assets.includes(icon)));
  assert.ok(profile.hobbies.every(({ icon }) => assets.includes(icon)));
});

test('splits startup UI assets from deferred logos, icons, and portrait media', () => {
  const critical = criticalUiImageAssets(profile);
  const deferred = deferredImageAssets(profile, answers);
  const answerAssets = answerImageAssets(answers);

  assert.ok(critical.includes(site.assets.avatar));
  assert.ok(critical.includes(site.assets.profileLink));
  assert.ok(critical.includes(site.assets.externalLink));
  assert.ok(profile.emails.every(({ icon }) => deferred.includes(icon)));
  assert.ok(profile.socialProfiles.every(({ icon }) => critical.includes(icon)));
  assert.ok(profile.affiliations.every(({ logo }) => deferred.includes(logo)));
  assert.ok(profile.skills.every(({ icon }) => deferred.includes(icon)));
  assert.ok(profile.hobbies.every(({ icon }) => deferred.includes(icon)));
  assert.ok(answerAssets.every((path) => deferred.includes(path)));
  if (answerAssets.length > 0) {
    assert.deepEqual(deferred.slice(-answerAssets.length), answerAssets);
  }
  assert.ok(deferred.every((path) => !critical.includes(path)));
});

test('loads deferred images one at a time during browser idle periods', async () => {
  const events = [];
  const paths = ['first.svg', 'second.svg', 'photo.jpg'];
  const results = await preloadImagesLazily(paths, {
    schedule: async () => { events.push('idle'); },
    preload: async (path, options) => {
      events.push(path);
      assert.deepEqual(options, { fetchPriority: 'low' });
      return { src: path, loaded: true };
    },
  });

  assert.deepEqual(events, [
    'idle', 'first.svg',
    'idle', 'second.svg',
    'idle', 'photo.jpg',
  ]);
  assert.deepEqual(results.map(({ src }) => src), paths);
});
