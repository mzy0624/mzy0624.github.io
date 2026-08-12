export function dotSimilarity(left, right, rightOffset = 0) {
  let score = 0;
  for (let index = 0; index < left.length; index += 1) {
    score += left[index] * right[rightOffset + index];
  }
  return score;
}

function aggregateTopScores(scores, aggregation, topK) {
  if (aggregation === 'max') return Math.max(...scores);
  if (aggregation !== 'top_k_mean') {
    throw new RangeError(`Unsupported similarity aggregation "${aggregation}".`);
  }
  const selected = scores.sort((left, right) => right - left).slice(0, topK);
  return selected.reduce((total, score) => total + score, 0) / selected.length;
}

export function scorePrototypeLabels(
  queryEmbedding,
  prototypeEmbeddings,
  labels,
  { aggregation = 'max', topK = 1 } = {},
) {
  if (!(queryEmbedding instanceof Float32Array)) {
    throw new TypeError('Query embedding must be a Float32Array.');
  }
  if (!(prototypeEmbeddings instanceof Float32Array)) {
    throw new TypeError('Prototype embeddings must be a Float32Array.');
  }
  if (!Number.isInteger(topK) || topK < 1) {
    throw new RangeError('topK must be a positive integer.');
  }

  const dimensions = queryEmbedding.length;
  return labels.map(({ labelId, start, count }) => {
    const scores = [];
    for (let prototypeIndex = 0; prototypeIndex < count; prototypeIndex += 1) {
      const offset = (start + prototypeIndex) * dimensions;
      scores.push(dotSimilarity(queryEmbedding, prototypeEmbeddings, offset));
    }
    return {
      labelId,
      score: aggregateTopScores(scores, aggregation, Math.min(topK, scores.length)),
    };
  }).sort((left, right) => right.score - left.score);
}
