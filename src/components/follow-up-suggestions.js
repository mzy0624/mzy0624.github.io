import { element } from '../api/dom.js';

export function createFollowUpSuggestions(topics, onAsk) {
  if (!topics.length) return null;

  return element(
    'section',
    {
      className: 'follow-up-suggestions',
      attributes: { 'aria-label': 'Suggested follow-up questions' },
    },
    element('h2', {
      className: 'follow-up-heading',
      text: 'You may also want to ask',
    }),
    element(
      'div',
      { className: 'follow-up-list' },
      topics.map((topic) =>
        element('button', {
          className: 'follow-up-question',
          text: topic.prompt,
          attributes: { type: 'button' },
          events: { click: () => onAsk(topic) },
        }),
      ),
    ),
  );
}
