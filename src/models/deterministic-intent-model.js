import { IntentModel } from './intent-model.js';
import { normalizePrompt } from './prompt-normalization.js';

export { normalizePrompt } from './prompt-normalization.js';

/**
 * Current model implementation.
 * It is deterministic: identical prompts and intent data produce the same result.
 */
export class DeterministicIntentModel extends IntentModel {
  constructor({ intents, fallbackId = 'unknown', minimumScore = 1 }) {
    super({ id: 'deterministic-keyword-v1', intents, fallbackId });
    this.minimumScore = minimumScore;
  }

  async predict(prompt, { hintIntentId = null } = {}) {
    if (hintIntentId && this.getIntentById(hintIntentId)) {
      return this.prediction(hintIntentId, {
        confidence: 1,
        source: 'deterministic-hint',
      });
    }

    const aliasPrediction = this.predictionForRoutingAlias(prompt);
    if (aliasPrediction) return aliasPrediction;

    const normalized = normalizePrompt(prompt);
    let bestMatch = null;

    this.intents.forEach((intent) => {
      const routingPhrases = [...intent.questions, ...intent.keywords];
      const matches = routingPhrases.filter((phrase) =>
        normalized.includes(normalizePrompt(phrase)),
      );
      if (!matches.length) return;

      const score = matches.reduce((total, phrase) => {
        const normalizedPhrase = normalizePrompt(phrase);
        const exactMatchBonus = normalized === normalizedPhrase ? 5 : 0;
        return total + 1 + Math.min(normalizedPhrase.length / 20, 1) + exactMatchBonus;
      }, intent.priority || 0);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { intentId: intent.id, score };
      }
    });

    if (!bestMatch || bestMatch.score < this.minimumScore) {
      return this.fallback('deterministic-fallback');
    }

    return this.prediction(bestMatch.intentId, {
      confidence: Math.min(0.99, 0.72 + bestMatch.score * 0.07),
      source: 'deterministic-keywords',
    });
  }
}
