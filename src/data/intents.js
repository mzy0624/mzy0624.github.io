import answerContent from '../../content/answers.json' with { type: 'json' };
import questionContent from '../../content/questions.json' with { type: 'json' };
import { deepFreeze, requireStringArray } from './content-loader.js';

const answerDefinitions = new Map();

for (const answer of answerContent.answers) {
  if (!answer?.id || answerDefinitions.has(answer.id)) {
    throw new TypeError(`Duplicate or invalid answer id: ${answer?.id ?? '(missing)'}.`);
  }
  if (!Array.isArray(answer.variants) || answer.variants.length === 0) {
    throw new TypeError(`Answer "${answer.id}" requires at least one variant.`);
  }
  if (!['tracked', 'stateless'].includes(answer.repeatMode)) {
    throw new TypeError(`Answer "${answer.id}" has an invalid repeatMode.`);
  }
  answerDefinitions.set(answer.id, deepFreeze(answer));
}

export const labels = deepFreeze(questionContent.labels.map((label) => {
  if (!label?.id || !answerDefinitions.has(label.answerId)) {
    throw new TypeError(`Label "${label?.id ?? '(missing)'}" references an unknown answer.`);
  }
  requireStringArray(label.displayPrompts, `${label.id}.displayPrompts`, { allowEmpty: true });
  requireStringArray(label.questions, `${label.id}.questions`, { allowEmpty: true });
  if (label.routingAliases !== undefined) {
    requireStringArray(label.routingAliases, `${label.id}.routingAliases`, { allowEmpty: false });
  }
  if (!Array.isArray(label.keywords)) {
    throw new TypeError(`Label "${label.id}" requires a keywords array.`);
  }
  return { ...label };
}));

export const commonRepeatAnswers = deepFreeze(answerContent.commonRepeatAnswers);
export const answers = deepFreeze([...answerDefinitions.values()]);

// Compatibility aliases for model adapters that still use intent terminology.
export const intents = labels;
export const questions = labels;
