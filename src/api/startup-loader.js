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

export async function prepareStartupAssets(
  profile,
  documentObject = globalThis.document,
  preload = preloadImages,
) {
  const cookieHit = hasStartupAssetCookie(documentObject?.cookie ?? '');
  const paths = criticalUiImageAssets(profile);
  const results = await preload(paths, { fetchPriority: 'high' });
  const failed = results.filter((result) => !result.loaded);
  if (failed.length > 0) {
    throw new Error(`Unable to load critical profile assets: ${failed.map(({ src }) => src).join(', ')}`);
  }
  return { cookieHit, paths, results };
}

function imageUrl(image, baseUrl) {
  return new URL(image.currentSrc || image.src, baseUrl).href;
}

async function waitForImage(image) {
  if (!image.complete) {
    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error(`Unable to render image: ${image.src}`)), {
        once: true,
      });
    });
  }
  if (typeof image.decode === 'function') await image.decode().catch(() => {});
  if (image.naturalWidth <= 0) throw new Error(`Image has no rendered pixels: ${image.src}`);
}

function nextFrame() {
  return new Promise((resolve) => {
    const schedule = globalThis.requestAnimationFrame
      ? globalThis.requestAnimationFrame.bind(globalThis)
      : (callback) => globalThis.setTimeout(callback, 0);
    schedule(resolve);
  });
}

export async function waitForCriticalDomImages(
  paths,
  documentObject = globalThis.document,
) {
  const baseUrl = documentObject.baseURI;
  const expectedUrls = new Set(paths.map((path) => new URL(path, baseUrl).href));
  const images = [...documentObject.images].filter((image) => (
    expectedUrls.has(imageUrl(image, baseUrl))
  ));
  const renderedUrls = new Set(images.map((image) => imageUrl(image, baseUrl)));
  const missing = [...expectedUrls].filter((url) => !renderedUrls.has(url));
  if (missing.length > 0) {
    throw new Error(`Critical profile images are missing from the page: ${missing.join(', ')}`);
  }

  await Promise.all(images.map(waitForImage));
  await nextFrame();
  await nextFrame();

  const avatarUrl = new URL(site.assets.avatar, baseUrl).href;
  const avatarVisible = images
    .filter((image) => imageUrl(image, baseUrl) === avatarUrl)
    .some((image) => {
      const bounds = image.getBoundingClientRect();
      const style = documentObject.defaultView?.getComputedStyle(image);
      return bounds.width > 0
        && bounds.height > 0
        && style?.display !== 'none'
        && style?.visibility !== 'hidden';
    });
  if (!avatarVisible) throw new Error('The profile avatar is loaded but not visible.');
}

export function markStartupAssetsReady(documentObject = globalThis.document) {
  documentObject.cookie = startupAssetCookie(
    site.startupLoading,
    globalThis.location?.protocol === 'https:',
  );
}

export function showStartupLoaderError(loader) {
  if (!loader) return;
  loader.classList.add('has-error');
  const label = loader.querySelector('.startup-loader__text');
  if (label) label.textContent = site.startupLoading.errorText;
  loader.setAttribute('aria-label', site.startupLoading.errorText);
}

export async function dismissStartupLoader(loader) {
  if (!loader) return;
  loader.classList.add('is-leaving');

  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 230));
  }
  loader.remove();
}
