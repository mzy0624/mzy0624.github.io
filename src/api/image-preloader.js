import { asset } from './dom.js';
import { site } from '../data/site.js';

const preloadCache = new Map();
const imageFieldNames = new Set(['icon', 'logo']);

export const persistentUiImageAssets = Object.freeze([
  site.assets.avatar,
  site.assets.profileLink,
  site.assets.externalLink,
]);

function collectImageFields(value, paths) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectImageFields(item, paths));
    return;
  }
  if (!value || typeof value !== 'object') return;

  Object.entries(value).forEach(([key, child]) => {
    if (imageFieldNames.has(key) && typeof child === 'string') paths.add(child);
    else collectImageFields(child, paths);
  });
}

export function profileImageAssets(profile) {
  const paths = new Set(persistentUiImageAssets);
  collectImageFields(profile, paths);
  return [...paths];
}

export function criticalUiImageAssets(profile) {
  return [...new Set([
    ...persistentUiImageAssets,
    ...profile.emails.map(({ icon }) => icon),
    ...profile.socialProfiles.map(({ icon }) => icon),
  ])];
}

export function answerImageAssets(answers) {
  const paths = new Set();
  answers.forEach(({ variants }) => {
    variants.forEach(({ image }) => {
      if (!image) return;
      if (image.src) paths.add(image.src);
      if (image.fullSrc) paths.add(image.fullSrc);
    });
  });
  return [...paths];
}

export function deferredImageAssets(profile, answers) {
  const critical = new Set(criticalUiImageAssets(profile));
  return [...new Set([
    ...profileImageAssets(profile),
    ...answerImageAssets(answers),
  ])].filter((path) => !critical.has(path));
}

export function preloadImage(path, { fetchPriority = 'auto' } = {}) {
  const src = asset(path);
  if (preloadCache.has(src)) return preloadCache.get(src);

  if (typeof globalThis.Image !== 'function') {
    return Promise.resolve({ image: null, loaded: false, src });
  }

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = fetchPriority;

    const finish = async (loaded) => {
      if (loaded && typeof image.decode === 'function') {
        await image.decode().catch(() => {});
      }
      if (!loaded) preloadCache.delete(src);
      resolve({ image, loaded, src });
    };

    image.addEventListener('load', () => finish(true), { once: true });
    image.addEventListener('error', () => finish(false), { once: true });
    image.src = src;
    if (image.complete) finish(image.naturalWidth > 0);
  });

  preloadCache.set(src, promise);
  return promise;
}

export function preloadProfileImages(profile) {
  return Promise.allSettled(
    profileImageAssets(profile).map((path) => preloadImage(path)),
  );
}

export function preloadImages(paths, { fetchPriority = 'auto' } = {}) {
  return Promise.all(paths.map((path) => preloadImage(path, { fetchPriority })));
}
