import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

function readContent(filename) {
  return JSON.parse(readFileSync(new URL(`./content/${filename}`, import.meta.url), 'utf8'));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export default defineConfig({
  base: './',
  plugins: [{
    name: 'single-user-content',
    transformIndexHtml(html) {
      const site = readContent('site.json');
      const profile = readContent('profile.json');
      const imagePreloads = [
        site.assets.avatar,
        site.assets.profileLink,
        site.assets.externalLink,
        ...profile.socialProfiles.map(({ icon }) => icon),
      ].filter((path, index, paths) => paths.indexOf(path) === index).map((path, index) => (
        `    <link rel="preload" as="image" href="./${escapeHtml(path)}"${index === 0 ? ' fetchpriority="high"' : ''} />`
      )).join('\n');

      return html
        .replaceAll('__SITE_TITLE__', escapeHtml(site.pageTitle))
        .replaceAll('__SITE_DESCRIPTION__', escapeHtml(site.description))
        .replaceAll('__SITE_LOADING_TEXT__', escapeHtml(site.startupLoading.text))
        .replace('    <!-- SITE_IMAGE_PRELOADS -->', imagePreloads);
    },
  }],
  resolve: {
    alias: {
      'onnxruntime-web': 'onnxruntime-web/wasm',
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
