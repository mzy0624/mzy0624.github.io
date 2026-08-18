import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const site = JSON.parse(readFileSync(new URL('./content/site.json', import.meta.url), 'utf8'));
const profile = JSON.parse(readFileSync(new URL('./content/profile.json', import.meta.url), 'utf8'));

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const imagePreloads = [
  site.assets.avatar,
  ...profile.affiliations.map(({ logo }) => logo),
].map((path, index) => (
  `    <link rel="preload" as="image" href="./${escapeHtml(path)}"${index === 0 ? ' fetchpriority="high"' : ''} />`
)).join('\n');

export default defineConfig({
  base: './',
  plugins: [{
    name: 'single-user-content',
    transformIndexHtml(html) {
      return html
        .replaceAll('__SITE_TITLE__', escapeHtml(site.pageTitle))
        .replaceAll('__SITE_DESCRIPTION__', escapeHtml(site.description))
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
