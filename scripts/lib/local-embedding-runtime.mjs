import { env, pipeline } from '@huggingface/transformers';
import { resolve } from 'node:path';

export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
export const MODEL_DTYPE = 'q8';
export const EMBEDDING_DIMENSIONS = 384;

let extractorPromise = null;

export function getLocalExtractor(projectRoot) {
  if (!extractorPromise) {
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.localModelPath = `${resolve(projectRoot, 'public/models')}/`;
    extractorPromise = pipeline('feature-extraction', MODEL_ID, { dtype: MODEL_DTYPE });
  }
  return extractorPromise;
}

export async function embedTexts(texts, { projectRoot, batchSize = 32 } = {}) {
  const extractor = await getLocalExtractor(projectRoot);
  const vectors = [];
  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const output = await extractor(batch, { pooling: 'mean', normalize: true });
    const dimensions = output.dims.at(-1);
    if (dimensions !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Unexpected embedding dimension ${dimensions}.`);
    }
    const values = Float32Array.from(output.data);
    for (let index = 0; index < batch.length; index += 1) {
      vectors.push(values.slice(index * dimensions, (index + 1) * dimensions));
    }
  }
  return vectors;
}
