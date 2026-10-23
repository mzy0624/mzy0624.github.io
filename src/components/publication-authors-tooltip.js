import { element } from '../api/dom.js';

let tooltipSequence = 0;

export function createPublicationAuthorsTooltip(authors) {
  const tooltipId = `remaining-authors-${++tooltipSequence}`;
  const trigger = element('button', {
    className: 'publication-authors-trigger',
    text: 'et al.',
    attributes: {
      type: 'button',
      'aria-label': 'Show remaining authors',
      'aria-controls': tooltipId,
      'aria-describedby': tooltipId,
      'aria-expanded': 'false',
    },
  });
  const tooltip = element('span', {
    className: 'publication-authors-tooltip',
    text: authors.join(', '),
    attributes: { id: tooltipId, role: 'tooltip', hidden: true },
  });
  const control = element('span', {
    className: 'publication-authors-control',
    attributes: { 'data-stream-atomic': '' },
  }, trigger);
  let pinned = false;
  let hideTimer = null;

  const position = () => {
    const rect = trigger.getBoundingClientRect();
    const inset = 16;
    const gap = 8;
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const left = Math.max(inset, Math.min(rect.left, document.documentElement.clientWidth - width - inset));
    const above = rect.top - gap - height;
    const top = above >= inset ? above : Math.max(inset, Math.min(rect.bottom + gap, innerHeight - height - inset));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const close = () => {
    clearTimeout(hideTimer);
    pinned = false;
    tooltip.hidden = true;
    tooltip.remove();
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutsidePointer);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('scroll', position, true);
    window.removeEventListener('resize', position);
  };
  const onOutsidePointer = (event) => {
    if (!control.contains(event.target) && !tooltip.contains(event.target)) close();
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') close();
  };
  const open = () => {
    clearTimeout(hideTimer);
    // The streamed answer has a transform; mount on body so fixed positioning
    // remains relative to the viewport rather than the answer block.
    if (!tooltip.isConnected) document.body.append(tooltip);
    tooltip.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    position();
    document.addEventListener('pointerdown', onOutsidePointer);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);
  };

  control.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') open();
  });
  control.addEventListener('pointerleave', () => {
    if (!pinned && document.activeElement !== trigger) hideTimer = setTimeout(close, 150);
  });
  tooltip.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  tooltip.addEventListener('pointerleave', () => {
    if (!pinned && document.activeElement !== trigger) hideTimer = setTimeout(close, 150);
  });
  trigger.addEventListener('focus', open);
  trigger.addEventListener('click', () => {
    if (pinned) {
      close();
      trigger.blur();
    } else {
      pinned = true;
      open();
    }
  });
  control.addEventListener('focusout', (event) => {
    if (!control.contains(event.relatedTarget)) close();
  });
  return control;
}
