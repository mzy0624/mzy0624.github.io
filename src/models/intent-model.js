/**
 * @typedef {Object} IntentPrediction
 * @property {string} intentId
 * @property {string} answerId
 * @property {Object} intent
 * @property {number} confidence
 * @property {string} source
 * @property {string} modelId
 */

/**
 * Formal interface for every intent-routing model.
 *
 * A trained browser model can extend this class and implement `predict`
 * without changing AcademicAgent or any UI component.
 */
export class IntentModel {
  constructor({ id, intents, fallbackId = 'unknown' }) {
    if (!id) throw new TypeError('IntentModel requires a stable id.');
    if (!Array.isArray(intents) || !intents.length) {
      throw new TypeError('IntentModel requires a non-empty intents array.');
    }

    this.id = id;
    this.intents = intents;
    this.fallbackId = fallbackId;

    if (!this.getIntentById(fallbackId)) {
      throw new TypeError(`Fallback intent "${fallbackId}" does not exist.`);
    }
  }

  /**
   * @param {string} _prompt
   * @param {{ hintIntentId?: string | null }} _options
   * @returns {Promise<IntentPrediction>}
   */
  async predict(_prompt, _options = {}) {
    throw new Error(`${this.constructor.name} must implement predict(prompt).`);
  }

  getIntentById(intentId) {
    return this.intents.find((intent) => intent.id === intentId) || null;
  }

  getIntentsByAnswerId(answerId) {
    return this.intents.filter((intent) => intent.answerId === answerId);
  }

  predictionForRoutingAlias(prompt) {
    const normalizedPrompt = normalizeRoutingAlias(prompt);
    if (!normalizedPrompt) return null;

    const intent = this.intents.find(({ routingAliases = [] }) => (
      routingAliases.some((alias) => normalizeRoutingAlias(alias) === normalizedPrompt)
    ));
    if (!intent) return null;

    return this.prediction(intent.id, {
      confidence: 1,
      source: 'explicit-routing-alias',
    });
  }

  prediction(intentId, { confidence, source }) {
    const intent = this.getIntentById(intentId) || this.getIntentById(this.fallbackId);
    return Object.freeze({
      intentId: intent.id,
      answerId: intent.answerId,
      intent,
      confidence,
      source,
      modelId: this.id,
    });
  }

  predictionForAnswer(answerId, { confidence, source }) {
    const candidates = this.getIntentsByAnswerId(answerId);
    const canonicalIntent = candidates.find(({ id }) => id === answerId)
      || candidates[0];
    if (!canonicalIntent) return this.fallback(source);
    return this.prediction(canonicalIntent.id, { confidence, source });
  }

  fallback(source = 'fallback') {
    return this.prediction(this.fallbackId, { confidence: 0, source });
  }
}

export function assertIntentModel(model) {
  if (!model || typeof model.predict !== 'function' || typeof model.getIntentById !== 'function') {
    throw new TypeError('AcademicAgent requires an IntentModel-compatible model.');
  }
  return model;
}
import { normalizeRoutingAlias } from './prompt-normalization.js';
