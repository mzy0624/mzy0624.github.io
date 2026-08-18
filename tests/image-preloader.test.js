import test from 'node:test';
import assert from 'node:assert/strict';

import { profileImageAssets } from '../src/api/image-preloader.js';
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
