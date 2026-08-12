export class PrototypeStore {
  constructor({ manifestUrl, embeddingsUrl, fetchImplementation = globalThis.fetch }) {
    if (typeof fetchImplementation !== 'function') {
      throw new TypeError('PrototypeStore requires a fetch implementation.');
    }
    this.manifestUrl = manifestUrl;
    this.embeddingsUrl = embeddingsUrl;
    this.fetch = fetchImplementation;
    this.loading = null;
  }

  async load() {
    if (!this.loading) this.loading = this.loadFiles();
    return this.loading;
  }

  async loadFiles() {
    const [manifestResponse, embeddingsResponse] = await Promise.all([
      this.fetch(this.manifestUrl),
      this.fetch(this.embeddingsUrl),
    ]);
    if (!manifestResponse.ok) {
      throw new Error(`Unable to load embedding manifest (${manifestResponse.status}).`);
    }
    if (!embeddingsResponse.ok) {
      throw new Error(`Unable to load prototype embeddings (${embeddingsResponse.status}).`);
    }

    const [manifest, buffer] = await Promise.all([
      manifestResponse.json(),
      embeddingsResponse.arrayBuffer(),
    ]);
    const embeddings = new Float32Array(buffer);
    const expectedValues = manifest.totalPrototypes * manifest.dimensions;
    if (embeddings.length !== expectedValues) {
      throw new Error(`Prototype embedding length mismatch: expected ${expectedValues}, received ${embeddings.length}.`);
    }
    return Object.freeze({ manifest: Object.freeze(manifest), embeddings });
  }
}
