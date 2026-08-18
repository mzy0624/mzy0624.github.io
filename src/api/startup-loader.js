import { criticalUiImageAssets, preloadImages } from './image-preloader.js';
import { site } from '../data/site.js';

const secondsPerDay = 24 * 60 * 60;

export function hasStartupAssetCookie(cookieString, config = site.startupLoading) {
  const expectedName = encodeURIComponent(config.cookieName);
  const expectedValue = encodeURIComponent(config.cookieVersion);
  return String(cookieString)
    .split(';')
    .map((part) => part.trim())
    .some((part) => part === `${expectedName}=${expectedValue}`);
}

export function startupAssetCookie(config = site.startupLoading, secure = false) {
  const attributes = [
    `${encodeURIComponent(config.cookieName)}=${encodeURIComponent(config.cookieVersion)}`,
    `Max-Age=${config.cookieMaxAgeDays * secondsPerDay}`,
    'Path=/',
    'SameSite=Lax',
  ];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

export async function prepareStartupAssets(profile, documentObject = globalThis.document) {
  const cookieHit = hasStartupAssetCookie(documentObject?.cookie ?? '');
  const paths = criticalUiImageAssets(profile);
  const criticalPromise = preloadImages(paths, { fetchPriority: 'high' });

  if (cookieHit) return { cookieHit, paths, criticalPromise };

  const results = await criticalPromise;
  const loaded = results.every((result) => result.loaded);
  if (loaded && documentObject) {
    documentObject.cookie = startupAssetCookie(
      site.startupLoading,
      globalThis.location?.protocol === 'https:',
    );
  }
  return { cookieHit, paths, criticalPromise: Promise.resolve(results), loaded };
}

export async function dismissStartupLoader(loader) {
  if (!loader) return;
  await new Promise((resolve) => {
    const schedule = globalThis.requestAnimationFrame
      ? globalThis.requestAnimationFrame.bind(globalThis)
      : (callback) => globalThis.setTimeout(callback, 0);
    schedule(() => schedule(resolve));
  });
  loader.classList.add('is-leaving');

  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 230));
  }
  loader.remove();
}
