import { asset, clear, element } from '../api/dom.js';

function createSuggestionIcon(topic) {
  const content = topic.iconType === 'emoji'
    ? element('span', {
      className: 'suggestion-emoji',
      text: topic.icon,
      attributes: { 'aria-hidden': 'true' },
    })
    : element('img', { attributes: { src: asset(topic.icon), alt: '' } });

  return element('span', { className: 'suggestion-icon' }, content);
}

export function createSuggestions({ initialTopics, onAsk, onReplace, onShuffle }) {
  const grid = element('div', { className: 'suggestion-grid' });

  function render(topics) {
    clear(grid);
    topics.forEach((topic, index) => {
      const ask = element(
        'button',
        {
          className: 'suggestion-question',
          attributes: { type: 'button' },
          events: { click: () => onAsk(topic) },
        },
        createSuggestionIcon(topic),
        element('span', { text: topic.prompt }),
      );
      const remove = element('button', {
        className: 'suggestion-remove',
        text: '×',
        attributes: { type: 'button', 'aria-label': `Replace ${topic.prompt}` },
        events: { click: () => onReplace(topic.id) },
      });
      const card = element('div', { className: 'suggestion-card' }, ask, remove);
      card.style.setProperty('--enter-delay', `${index * 55}ms`);
      grid.append(card);
    });
  }

  const node = element(
    'section',
    { className: 'suggestion-area', attributes: { 'aria-label': 'Suggested questions' } },
    element(
      'div',
      { className: 'suggestion-heading' },
      element('span', { text: 'Try asking' }),
      element(
        'button',
        {
          className: 'shuffle-button',
          attributes: { type: 'button', 'aria-label': 'Shuffle suggested questions', title: 'Shuffle' },
          events: { click: onShuffle },
        },
        element('span', { className: 'shuffle-glyph', text: '↻', attributes: { 'aria-hidden': 'true' } }),
      ),
    ),
    grid,
  );

  render(initialTopics);
  return { node, render };
}
