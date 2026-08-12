import { env, pipeline } from '@huggingface/transformers';

let extractorPromise = null;
let activeModelKey = null;

function getExtractor(modelId, modelBaseUrl, wasmBaseUrl) {
  const modelKey = `${modelBaseUrl}/${modelId}/${wasmBaseUrl}`;
  if (extractorPromise && activeModelKey === modelKey) return extractorPromise;

  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.localModelPath = modelBaseUrl;
  // GitHub Pages cannot emit the cross-origin isolation headers required by
  // multi-threaded WASM. Inference already runs off the main thread here.
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.wasmPaths = wasmBaseUrl;
  activeModelKey = modelKey;
  extractorPromise = pipeline('feature-extraction', modelId, { dtype: 'q8' });
  return extractorPromise;
}

self.addEventListener('message', async ({ data }) => {
  if (data.type !== 'embed') return;
  try {
    const extractor = await getExtractor(data.modelId, data.modelBaseUrl, data.wasmBaseUrl);
    const output = await extractor(data.texts, { pooling: 'mean', normalize: true });
    const values = Float32Array.from(output.data);
    const dimensions = output.dims.at(-1);
    self.postMessage({
      id: data.id,
      type: 'result',
      buffer: values.buffer,
      count: data.texts.length,
      dimensions,
    }, [values.buffer]);
  } catch (error) {
    self.postMessage({
      id: data.id,
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
