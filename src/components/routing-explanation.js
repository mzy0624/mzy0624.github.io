import { element } from '../api/dom.js';
import { routingExplanation } from '../data/routing-explanation.js';

let triggerSequence = 0;

export function createRoutingExplanationTrigger() {
  triggerSequence += 1;
  const tooltipId = `routing-explanation-${triggerSequence}`;
  const trigger = element(
    'button',
    {
      className: 'unknown-explanation-trigger',
      attributes: {
        type: 'button',
        'aria-describedby': tooltipId,
      },
    },
    element('span', {
      className: 'unknown-explanation-mark',
      text: '?',
      attributes: { 'aria-hidden': 'true' },
    }),
    element('span', { text: 'Why this answer?' }),
  );
  const tooltip = element('span', {
    className: 'unknown-explanation-tooltip',
    text: routingExplanation.text,
    attributes: { id: tooltipId, role: 'tooltip' },
  });

  return element(
    'span',
    { className: 'unknown-explanation-control' },
    trigger,
    tooltip,
  );
}
