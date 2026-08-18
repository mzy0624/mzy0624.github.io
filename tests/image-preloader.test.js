import test from 'node:test';
import assert from 'node:assert/strict';

import {
  answerImageAssets,
  criticalUiImageAssets,
  deferredImageAssets,
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

  assert.ok(critical.includes(site.assets.avatar));
  assert.ok(critical.includes(site.assets.profileLink));
  assert.ok(critical.includes(site.assets.externalLink));
  assert.ok(profile.emails.every(({ icon }) => critical.includes(icon)));
  assert.ok(profile.socialProfiles.every(({ icon }) => critical.includes(icon)));
  assert.ok(profile.affiliations.every(({ logo }) => deferred.includes(logo)));
  assert.ok(profile.skills.every(({ icon }) => deferred.includes(icon)));
  assert.ok(profile.hobbies.every(({ icon }) => deferred.includes(icon)));
  assert.ok(answerImageAssets(answers).every((path) => deferred.includes(path)));
  assert.ok(deferred.every((path) => !critical.includes(path)));
});
