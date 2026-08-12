export class BrowserEmbeddingProvider {
  constructor({ modelId, modelBaseUrl, wasmBaseUrl, workerFactory = null }) {
    this.modelId = modelId;
    this.modelBaseUrl = modelBaseUrl;
    this.wasmBaseUrl = wasmBaseUrl;
    this.workerFactory = workerFactory || (() => new Worker(
      new URL('./embedding-worker.js', import.meta.url),
      { type: 'module' },
    ));
    this.sequence = 0;
    this.pending = new Map();
    this.worker = null;
  }

  ensureWorker() {
    if (this.worker) return this.worker;
    this.worker = this.workerFactory();
    this.worker.addEventListener('message', ({ data }) => {
      const request = this.pending.get(data.id);
      if (!request) return;
      this.pending.delete(data.id);
      if (data.type === 'error') {
        request.reject(new Error(data.message));
        return;
      }
      const values = new Float32Array(data.buffer);
      const vectors = Array.from({ length: data.count }, (_, index) => (
        values.slice(index * data.dimensions, (index + 1) * data.dimensions)
      ));
      request.resolve(vectors);
    });
    this.worker.addEventListener('error', (event) => {
      const error = new Error(event.message || 'Embedding worker failed.');
      this.pending.forEach(({ reject }) => reject(error));
      this.pending.clear();
      this.worker?.terminate();
      this.worker = null;
    });
    return this.worker;
  }

  embed(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return Promise.reject(new TypeError('Embedding input must be a non-empty string array.'));
    }
    const worker = this.ensureWorker();
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({
        id,
        type: 'embed',
        texts,
        modelId: this.modelId,
        modelBaseUrl: this.modelBaseUrl,
        wasmBaseUrl: this.wasmBaseUrl,
      });
    });
  }
}
