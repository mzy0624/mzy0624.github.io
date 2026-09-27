import { element } from '../api/dom.js';
import { site } from '../data/site.js';

export const COMPOSER_PLACEHOLDER = site.composerPlaceholder;

export function createComposer({ onSubmit }) {
  const input = element('textarea', {
    attributes: {
      rows: '1',
      maxlength: '280',
      placeholder: COMPOSER_PLACEHOLDER,
      autocomplete: 'off',
      'aria-label': 'Ask a question',
    },
  });

  const send = element('button', {
    className: 'send-button',
    text: '↑',
    attributes: { type: 'submit', disabled: true, 'aria-label': 'Send question' },
  });

  const resize = () => {
    // Keep the same text width when wrapping; only the height and alignment change.
    input.style.height = 'auto';
    const lineHeight = Number.parseFloat(getComputedStyle(input).lineHeight);
    const isMultiline = input.value.length > 0
      && input.scrollHeight > lineHeight * 1.5;

    form.classList.toggle('is-multiline', isMultiline);
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
    send.disabled = !input.value.trim();
  };

  const form = element(
    'form',
    {
      className: 'composer',
      events: {
        submit(event) {
          event.preventDefault();
          const prompt = input.value.trim();
          if (!prompt || send.disabled) return;
          input.value = '';
          resize();
          onSubmit(prompt);
        },
      },
    },
    input,
    element(
      'div',
      { className: 'composer-meta' },
      send,
    ),
  );

  input.addEventListener('input', resize);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  return {
    node: form,
    input,
    setBusy(busy) {
      input.disabled = busy;
      send.disabled = busy || !input.value.trim();
      form.classList.toggle('is-busy', busy);
    },
    focus() {
      input.focus({ preventScroll: true });
    },
    reset() {
      input.value = '';
      input.disabled = false;
      resize();
    },
  };
}
