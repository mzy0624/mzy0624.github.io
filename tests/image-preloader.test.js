import test from 'node:test';
import assert from 'node:assert/strict';

import { profileImageAssets } from '../src/api/image-preloader.js';
import { profile } from '../src/data/profile.js';

test('profile image warmup covers local UI images without preloading large on-demand media', () => {
  const assets = profileImageAssets(profile);

  assert.equal(new Set(assets).size, assets.length);
  assert.ok(assets.includes('assets/avatar.png'));
  assert.ok(assets.includes('assets/icons/github.svg'));
  assert.ok(assets.includes('assets/icons/google-scholar.svg'));
  assert.ok(assets.includes('assets/affiliations/lamda.png'));
  assert.ok(assets.includes('assets/affiliations/njuai.png'));
  assert.ok(assets.includes('assets/affiliations/nju.png'));
  assert.ok(profile.skills.every(({ icon }) => assets.includes(icon)));
  assert.ok(profile.hobbies.every(({ icon }) => assets.includes(icon)));
  assert.ok(!assets.includes('assets/photo.png'));
  assert.ok(!assets.includes('assets/photo-original.jpg'));
});
