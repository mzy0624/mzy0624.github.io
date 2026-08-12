import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
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
