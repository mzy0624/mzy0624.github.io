import { IntentModel } from './intent-model.js';
import { scorePrototypeLabels } from './embedding-similarity.js';

export class EmbeddingIntentModel extends IntentModel {
  constructor({
    intents,
    fallbackId = 'unknown',
    embedder,
    prototypeStore,
    configLoader,
    fallbackModel = null,
  }) {
    super({ id: 'minilm-question-bank-v1', intents, fallbackId });
    if (!embedder || typeof embedder.embed !== 'function') {
      throw new TypeError('EmbeddingIntentModel requires an embedder.');
    }
    if (!prototypeStore || typeof prototypeStore.load !== 'function') {
      throw new TypeError('EmbeddingIntentModel requires a prototype store.');
    }
    if (typeof configLoader !== 'function') {
      throw new TypeError('EmbeddingIntentModel requires a config loader.');
    }
    this.embedder = embedder;
    this.prototypeStore = prototypeStore;
    this.configLoader = configLoader;
    this.fallbackModel = fallbackModel;
    this.configPromise = null;
  }

  loadConfig() {
    if (!this.configPromise) this.configPromise = this.configLoader();
    return this.configPromise;
  }

  async predict(prompt) {
    try {
      const [{ manifest, embeddings }, config, [queryEmbedding]] = await Promise.all([
        this.prototypeStore.load(),
        this.loadConfig(),
        this.embedder.embed([String(prompt)]),
      ]);
      if (manifest.modelId !== config.modelId) {
        throw new Error('Embedding model and calibrated router configuration do not match.');
      }
      const scores = scorePrototypeLabels(
        queryEmbedding,
        embeddings,
        manifest.labels,
        config.scoring,
      );
      const best = scores[0];
      if (!best || best.score < config.threshold) {
        return this.fallback('embedding-threshold');
      }
      return this.prediction(best.labelId, {
        confidence: Math.max(0, Math.min(1, best.score)),
        source: 'embedding-question-bank',
      });
    } catch (error) {
      if (this.fallbackModel) return this.fallbackModel.predict(prompt);
      return this.fallback('embedding-unavailable');
    }
  }
}
