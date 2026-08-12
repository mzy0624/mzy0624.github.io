import { BrowserEmbeddingProvider } from './browser-embedding-provider.js';
import { EmbeddingIntentModel } from './embedding-intent-model.js';
import { PrototypeStore } from './prototype-store.js';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

export function createBrowserIntentModel({
  intents,
  fallbackModel,
  siteBaseUrl,
  fetchImplementation = globalThis.fetch,
  workerFactory = null,
}) {
  const resolveSiteUrl = (path) => new URL(path, siteBaseUrl).href;
  const embedder = new BrowserEmbeddingProvider({
    modelId: MODEL_ID,
    modelBaseUrl: resolveSiteUrl('models/'),
    wasmBaseUrl: resolveSiteUrl('wasm/'),
    workerFactory,
  });
  const prototypeStore = new PrototypeStore({
    manifestUrl: resolveSiteUrl('data/question-bank-embeddings.json'),
    embeddingsUrl: resolveSiteUrl('data/question-bank-embeddings.bin'),
    fetchImplementation,
  });
  const configLoader = async () => {
    const response = await fetchImplementation(resolveSiteUrl('data/embedding-router-config.json'));
    if (!response.ok) throw new Error(`Unable to load embedding router config (${response.status}).`);
    return response.json();
  };

  return new EmbeddingIntentModel({
    intents,
    fallbackId: 'unknown',
    embedder,
    prototypeStore,
    configLoader,
    fallbackModel,
  });
}
