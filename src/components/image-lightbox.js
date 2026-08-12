import { element } from '../api/dom.js';

export function createImageLightbox() {
  const enlargedImage = element('img', { attributes: { alt: '' } });
  const closeButton = element('button', {
    className: 'image-lightbox-close',
    text: '×',
    attributes: { type: 'button', 'aria-label': 'Close enlarged image' },
  });
  const overlay = element(
    'div',
    {
      className: 'image-lightbox',
      attributes: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Enlarged image',
        'aria-hidden': 'true',
      },
    },
    closeButton,
    enlargedImage,
  );
  let returnFocus = null;
  let backgroundRoot = null;
  let backgroundWasInert = false;

  function close() {
    if (!overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-lightbox');
    if (backgroundRoot && !backgroundWasInert) backgroundRoot.removeAttribute('inert');
    backgroundRoot = null;
    backgroundWasInert = false;
    returnFocus?.focus();
    returnFocus = null;
  }

  function open({ src, alt }, trigger) {
    returnFocus = trigger;
    backgroundRoot = document.getElementById('app');
    backgroundWasInert = backgroundRoot?.hasAttribute('inert') ?? false;
    if (backgroundRoot && !backgroundWasInert) backgroundRoot.setAttribute('inert', '');
    enlargedImage.src = src;
    enlargedImage.alt = alt;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-lightbox');
    closeButton.focus();
  }

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains('is-open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus();
    }
  });
  document.body.append(overlay);

  return { open, close };
}
