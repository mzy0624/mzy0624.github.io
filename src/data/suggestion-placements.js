import questionContent from '../../content/questions.json' with { type: 'json' };
import { deepFreeze } from './content-loader.js';

export const suggestionPlacements = deepFreeze(questionContent.suggestionPlacements);
