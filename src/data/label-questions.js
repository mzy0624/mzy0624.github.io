import questionContent from '../../content/questions.json' with { type: 'json' };
import { deepFreeze } from './content-loader.js';

export const labelQuestions = deepFreeze(Object.fromEntries(
  questionContent.labels.map(({ id, questions }) => [id, [...questions]]),
));
