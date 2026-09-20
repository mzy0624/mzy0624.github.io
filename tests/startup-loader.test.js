import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasStartupAssetCookie,
  markStartupAssetsReady,
  prepareStartupAssets,
  showStartupLoaderError,
  startupAssetCookie,
  waitForCriticalDomImages,
} from '../src/api/startup-loader.js';
import { profile } from '../src/data/profile.js';
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

test('a Cookie hit still waits for every critical asset preload', async () => {
  const documentObject = {
    cookie: `${site.startupLoading.cookieName}=${site.startupLoading.cookieVersion}`,
  };
  let preloadCalls = 0;
  const preload = async (paths, options) => {
    preloadCalls += 1;
    assert.ok(paths.length > 0);
    assert.deepEqual(options, { fetchPriority: 'high' });
    return paths.map((src) => ({ src, loaded: true }));
  };

  const result = await prepareStartupAssets(profile, documentObject, preload);
  assert.equal(result.cookieHit, true);
  assert.equal(preloadCalls, 1);
  assert.ok(result.results.every(({ loaded }) => loaded));
});

test('waits for mounted critical images to decode and verifies a visible avatar', async () => {
  const baseURI = 'https://example.com/profile/';
  const paths = [site.assets.avatar, site.assets.profileLink];
  const images = paths.map((path) => ({
    src: new URL(path, baseURI).href,
    currentSrc: '',
    complete: true,
    naturalWidth: 24,
    decodeCalls: 0,
    async decode() { this.decodeCalls += 1; },
    getBoundingClientRect() { return { width: 24, height: 24 }; },
  }));
  const documentObject = {
    baseURI,
    images,
    defaultView: {
      getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    },
  };

  await waitForCriticalDomImages(paths, documentObject);
  assert.ok(images.every(({ decodeCalls }) => decodeCalls === 1));
});

test('marks the validated startup asset version only after display checks', () => {
  const documentObject = { cookie: '' };
  markStartupAssetsReady(documentObject);
  assert.match(documentObject.cookie, new RegExp(
    `^${site.startupLoading.cookieName}=${site.startupLoading.cookieVersion}`,
  ));
});

test('replaces the animated startup label with a readable error message', () => {
  const label = { textContent: '' };
  const classes = new Set();
  const attributes = new Map();
  const loader = {
    classList: { add: (className) => classes.add(className) },
    querySelector: (selector) => selector === '.startup-loader__text' ? label : null,
    setAttribute: (name, value) => attributes.set(name, value),
  };

  showStartupLoaderError(loader);

  assert.ok(classes.has('has-error'));
  assert.equal(label.textContent, site.startupLoading.errorText);
  assert.equal(attributes.get('aria-label'), site.startupLoading.errorText);
});
