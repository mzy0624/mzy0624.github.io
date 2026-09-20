import { asset, element } from '../api/dom.js';
import { preloadImage } from '../api/image-preloader.js';
import { getTypingDelay } from '../api/typing-speed.js';
import { renderAnswerBlocks } from './answers.js';
import { createFollowUpSuggestions } from './follow-up-suggestions.js';
import { createImageLightbox } from './image-lightbox.js';
import { createRoutingExplanationTrigger } from './routing-explanation.js';
import { site } from '../data/site.js';

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const wait = (duration) => new Promise((resolve) => globalThis.setTimeout(resolve, duration));

function prepareBlockStream(root) {
  const operations = [];

  const extractChildren = (parent) => {
    const children = [...parent.childNodes];
    parent.replaceChildren();

    children.forEach((child) => {
      if (child.nodeType === TEXT_NODE) {
        const text = child.data;
        child.data = '';
        operations.push({ type: 'node', parent, node: child });
        for (const character of text) {
          operations.push({ type: 'token', node: child, value: character });
        }
        return;
      }

      operations.push({ type: 'node', parent, node: child });
      if (child.nodeType === ELEMENT_NODE && child.hasAttribute('data-stream-atomic')) return;
      extractChildren(child);
    });
  };

  extractChildren(root);
  return operations;
}

async function appendStreamedBlock(content, block, tokenDelay) {
  const operations = prepareBlockStream(block);
  const characterCount = operations.filter(({ type }) => type === 'token').length;
  const delay = getTypingDelay(characterCount, tokenDelay);
  block.classList.add('is-visible', 'is-streaming');
  block.setAttribute('aria-busy', 'true');
  block.setAttribute('inert', '');
  content.append(block);

  for (const operation of operations) {
    if (operation.type === 'node') {
      operation.parent.append(operation.node);
      continue;
    }
    operation.node.appendData(operation.value);
    if (delay > 0) await wait(delay);
  }

  block.classList.remove('is-streaming');
  block.removeAttribute('aria-busy');
  block.removeAttribute('inert');
}

export function createConversation(profile, imageLightbox = createImageLightbox()) {
  const node = element('section', {
    className: 'conversation',
    attributes: { 'aria-label': 'Conversation' },
  });

  function addUserMessage(prompt) {
    node.append(
      element(
        'article',
        { className: 'message user-message' },
        element('div', { className: 'user-bubble', text: prompt }),
      ),
    );
  }

  function addAgentMessage() {
    const content = element('div', { className: 'response-content' });
    const article = element(
      'article',
      { className: 'message agent-message' },
      element(
        'div',
        { className: 'mini-agent', attributes: { 'aria-hidden': 'true' } },
        element('img', { attributes: { src: asset(site.assets.avatar), alt: '' } }),
      ),
      element(
        'div',
        { className: 'agent-answer' },
        element('div', { className: 'agent-name', text: site.agentName }),
        content,
      ),
    );
    node.append(article);

    let paragraph = null;
    let activeLink = null;
    let activeStrong = null;
    let loader = null;
    let thinkingProcess = null;
    let thinkingLabel = null;
    let imageProcess = null;
    let imagePreload = null;
    let emphasisList = null;
    let emphasisListItem = null;
    let emphasisListStrong = null;

    return {
      showLoader() {
        loader = element(
          'div',
          {
            className: 'answer-loader',
            attributes: { role: 'status', 'aria-label': 'Loading answer' },
          },
          element(
            'span',
            { className: 'process-dots', attributes: { 'aria-hidden': 'true' } },
            element('i'), element('i'), element('i'),
          ),
        );
        content.append(loader);
      },
      hideLoader() {
        if (!loader) return;
        loader.remove();
        loader = null;
      },
      showThinking(message = 'Thinking') {
        thinkingLabel = element('span', { className: 'thinking-process-text', text: message });
        thinkingProcess = element(
          'div',
          { className: 'thinking-process', attributes: { role: 'status' } },
          thinkingLabel,
        );
        content.append(thinkingProcess);
      },
      updateThinking(message) {
        if (!thinkingProcess || !thinkingLabel) {
          this.showThinking(message);
          return;
        }
        const nextLabel = element('span', { className: 'thinking-process-text', text: message });
        thinkingLabel.replaceWith(nextLabel);
        thinkingLabel = nextLabel;
      },
      hideThinking() {
        if (!thinkingProcess) return;
        thinkingProcess.remove();
        thinkingProcess = null;
        thinkingLabel = null;
      },
      finishThinking(durationSeconds, detail) {
        this.hideThinking();
        const roundedDuration = Math.round(durationSeconds);
        const durationUnit = roundedDuration === 1 ? 'second' : 'seconds';
        const record = element('div', { className: 'thought-record' });
        const panel = element(
          'div',
          {
            className: 'thought-record-panel',
            attributes: { 'aria-hidden': 'true' },
          },
          element(
            'div',
            { className: 'thought-record-panel-inner' },
            element('div', { className: 'thought-record-detail', text: detail }),
          ),
        );
        const toggle = element(
          'button',
          {
            className: 'thought-record-toggle',
            attributes: { type: 'button', 'aria-expanded': 'false' },
          },
          element('span', { text: `Thought for ${roundedDuration} ${durationUnit}` }),
          element('span', {
            className: 'thought-record-chevron',
            text: '›',
            attributes: { 'aria-hidden': 'true' },
          }),
        );
        toggle.addEventListener('click', () => {
          const expanded = toggle.getAttribute('aria-expanded') !== 'true';
          toggle.setAttribute('aria-expanded', String(expanded));
          panel.setAttribute('aria-hidden', String(!expanded));
          record.classList.toggle('is-open', expanded);
        });
        record.append(toggle, panel);
        content.append(record);
      },
      showError(message) {
        content.append(element('p', { className: 'answer-error', text: message }));
      },
      appendToken(character, link = null, strong = false) {
        if (!paragraph) {
          paragraph = element('p', { className: 'answer-text' });
          content.append(paragraph);
        }
        if (link) {
          activeStrong = null;
          if (!activeLink || activeLink.dataset.answerHref !== link.href) {
            activeLink = element('a', {
              className: 'inline-answer-link',
              attributes: { href: link.href, target: '_blank', rel: 'noreferrer' },
              dataset: { answerHref: link.href },
            });
            paragraph.append(activeLink);
          }
          activeLink.append(document.createTextNode(character));
          return;
        }
        activeLink = null;
        if (strong) {
          if (!activeStrong) {
            activeStrong = element('strong', { className: 'answer-emphasis' });
            paragraph.append(activeStrong);
          }
          activeStrong.append(document.createTextNode(character));
          return;
        }
        activeStrong = null;
        paragraph.append(document.createTextNode(character));
      },
      async appendBlocks(blocks, tokenDelay = 8) {
        const prefersReducedMotion = globalThis.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches;
        const delay = prefersReducedMotion ? 0 : tokenDelay;
        for (const block of renderAnswerBlocks(blocks, profile)) {
          await appendStreamedBlock(content, block, delay);
        }
      },
      startEmphasisList() {
        emphasisList = element('ul', {
          className: 'response-detail response-list research-interest-list is-visible',
        });
        content.append(emphasisList);
      },
      startEmphasisListItem() {
        if (!emphasisList) return;
        emphasisListStrong = element('strong');
        emphasisListItem = element('li', {}, emphasisListStrong);
        emphasisList.append(emphasisListItem);
      },
      appendEmphasisListToken(character) {
        if (!emphasisListStrong) return;
        emphasisListStrong.append(document.createTextNode(character));
      },
      endEmphasisListItem() {
        emphasisListItem = null;
        emphasisListStrong = null;
      },
      endEmphasisList() {
        emphasisList = null;
        emphasisListItem = null;
        emphasisListStrong = null;
      },
      appendFollowUps(topics, onAsk) {
        const followUps = createFollowUpSuggestions(topics, onAsk);
        if (followUps) content.append(followUps);
      },
      appendUnknownExplanation() {
        content.append(
          element(
            'div',
            { className: 'unknown-explanation' },
            createRoutingExplanationTrigger(),
          ),
        );
      },
      showImageProcess(message, image) {
        if (image) {
          imagePreload = preloadImage(image.src, { fetchPriority: 'high' });
          if (image.fullSrc && image.fullSrc !== image.src) {
            preloadImage(image.fullSrc, { fetchPriority: 'low' });
          }
        }
        imageProcess = element(
          'div',
          { className: 'image-process', attributes: { role: 'status' } },
          element(
            'span',
            { className: 'image-process-mark', attributes: { 'aria-hidden': 'true' } },
            element('i'),
            element('i'),
          ),
          element(
            'span',
            { className: 'image-process-copy' },
            element('strong', { text: message }),
            element('span', { className: 'image-progress-track' }, element('i')),
          ),
        );
        content.append(imageProcess);
      },
      updateImageProcess(message) {
        if (!imageProcess) return;
        imageProcess.querySelector('strong').textContent = message;
        imageProcess.classList.add('is-finishing');
      },
      async appendImage(image) {
        const resolvedImage = {
          src: asset(image.src),
          fullSrc: asset(image.fullSrc || image.src),
          alt: image.alt,
        };
        const preloaded = await (imagePreload
          || preloadImage(image.src, { fetchPriority: 'high' }));
        const result = preloaded.image || element('img');
        result.className = 'image-result';
        result.src = resolvedImage.src;
        result.alt = resolvedImage.alt;
        const trigger = element(
          'button',
          {
            className: 'image-result-trigger',
            attributes: { type: 'button', 'aria-label': `Enlarge ${image.alt}` },
            events: {
              click: () => imageLightbox.open(
                { src: resolvedImage.fullSrc, alt: resolvedImage.alt },
                trigger,
              ),
            },
          },
          result,
        );
        if (!preloaded.loaded && !result.complete) {
          await new Promise((resolve) => {
            result.addEventListener('load', resolve, { once: true });
            result.addEventListener('error', resolve, { once: true });
          });
        }
        imageProcess?.remove();
        imageProcess = null;
        imagePreload = null;
        content.append(trigger);
        requestAnimationFrame(() => result.classList.add('is-visible'));
      },
    };
  }

  return {
    node,
    addUserMessage,
    addAgentMessage,
    clear() {
      node.replaceChildren();
    },
  };
}
