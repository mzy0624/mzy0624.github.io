import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EMBEDDING_DIMENSIONS,
  MODEL_DTYPE,
  MODEL_ID,
  embedTexts,
} from './lib/local-embedding-runtime.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const questionBankPath = resolve(projectRoot, 'training/question-bank.json');
const outputDirectory = resolve(projectRoot, 'public/data');
const manifestPath = resolve(outputDirectory, 'question-bank-embeddings.json');
const embeddingsPath = resolve(outputDirectory, 'question-bank-embeddings.bin');
const questionBankContents = await readFile(questionBankPath, 'utf8');
const questionBank = JSON.parse(questionBankContents);
const labels = [];
const texts = [];
let start = 0;

for (const { labelId, questions } of questionBank.labels) {
  labels.push({ labelId, start, count: questions.length });
  texts.push(...questions.map(({ text }) => text));
  start += questions.length;
}

const vectors = await embedTexts(texts, { projectRoot });
const flattened = new Float32Array(vectors.length * EMBEDDING_DIMENSIONS);
vectors.forEach((vector, index) => flattened.set(vector, index * EMBEDDING_DIMENSIONS));
const binary = Buffer.from(flattened.buffer, flattened.byteOffset, flattened.byteLength);
const manifest = {
  schemaVersion: 1,
  modelId: MODEL_ID,
  dtype: MODEL_DTYPE,
  pooling: 'mean',
  normalized: true,
  dimensions: EMBEDDING_DIMENSIONS,
  totalPrototypes: vectors.length,
  questionBankSha256: createHash('sha256').update(questionBankContents).digest('hex'),
  embeddingsSha256: createHash('sha256').update(binary).digest('hex'),
  labels,
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
  writeFile(embeddingsPath, binary),
]);

console.log(`Generated ${vectors.length} ${EMBEDDING_DIMENSIONS}-dimensional question-bank embeddings.`);
