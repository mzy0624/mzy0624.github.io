import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasStartupAssetCookie,
  startupAssetCookie,
} from '../src/api/startup-loader.js';
import { site } from '../src/data/site.js';

test('recognizes only the configured startup asset Cookie version', () => {
  const config = site.startupLoading;
  assert.equal(hasStartupAssetCookie('unrelated=yes'), false);
  assert.equal(
    hasStartupAssetCookie(`${config.cookieName}=${config.cookieVersion}; unrelated=yes`),
    true,
  );
  assert.equal(hasStartupAssetCookie(`${config.cookieName}=old-version`), false);
});

test('serializes a scoped, versioned startup asset Cookie', () => {
  const cookie = startupAssetCookie(site.startupLoading, true);
  assert.match(cookie, new RegExp(`^${site.startupLoading.cookieName}=${site.startupLoading.cookieVersion}`));
  assert.match(cookie, /Max-Age=\d+/);
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
});
