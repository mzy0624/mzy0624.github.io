import { asset, clear, element } from '../api/dom.js';
import { createProfileMenus } from './profile-menus.js';

const MOBILE_SIDEBAR_QUERY = '(max-width: 900px)';

function affiliationLink(affiliation) {
  return element(
    'a',
    {
      className: 'sidebar-affiliation',
      attributes: {
        href: affiliation.url,
        target: '_blank',
        rel: 'noreferrer',
        title: affiliation.name,
        'aria-label': affiliation.name,
      },
    },
    element('img', {
      attributes: { src: asset(affiliation.logo), alt: affiliation.name },
    }),
  );
}

export function createSidebar({
  profile,
  onNewConversation,
  onSelectConversation,
  onExpandedChange,
}) {
  const mobileQuery = globalThis.matchMedia?.(MOBILE_SIDEBAR_QUERY);
  const historyList = element('div', {
    className: 'conversation-history-list',
  });
  const history = element(
    'section',
    { className: 'sidebar-history', attributes: { 'aria-label': 'Conversation history' } },
    element('h2', { className: 'sidebar-history-title', text: 'History' }),
    historyList,
  );
  const newConversation = element(
    'button',
    {
      className: 'new-conversation-button',
      attributes: { type: 'button' },
    },
    element('span', { className: 'new-conversation-icon', text: '+', attributes: { 'aria-hidden': 'true' } }),
    element('span', { text: 'New conversation' }),
  );
  const collapse = element('button', {
    className: 'sidebar-collapse-button',
    text: '‹',
    attributes: { type: 'button', 'aria-label': 'Collapse sidebar' },
  });
  const open = element('button', {
    className: 'sidebar-open-button',
    text: '☰',
    attributes: { type: 'button', 'aria-label': 'Open sidebar' },
  });
  const backdrop = element('button', {
    className: 'sidebar-backdrop',
    attributes: { type: 'button', 'aria-label': 'Close sidebar', tabindex: '-1' },
  });
  const sidebar = element(
    'aside',
    { className: 'site-sidebar', attributes: { 'aria-label': 'Agent sidebar' } },
    element(
      'div',
      { className: 'sidebar-top' },
      element(
        'div',
        { className: 'sidebar-profile' },
        element('img', {
          className: 'sidebar-profile-avatar',
          attributes: { src: asset('assets/avatar.png'), alt: '' },
        }),
        element('span', { className: 'sidebar-profile-name', text: profile.name }),
        createProfileMenus(profile, 'sidebar'),
      ),
      collapse,
    ),
    newConversation,
    history,
    element(
      'div',
      { className: 'sidebar-bottom' },
      element(
        'nav',
        { className: 'sidebar-affiliations', attributes: { 'aria-label': 'Academic affiliations' } },
        profile.affiliations.map(affiliationLink),
      ),
      element('p', {
        className: 'sidebar-copyright',
        text: `© 2023–${new Date().getFullYear()} Zi-Yu Mao`,
      }),
    ),
  );
  const node = element('div', { className: 'sidebar-system' }, backdrop, sidebar, open);
  let expanded = !mobileQuery?.matches;
  let initialized = false;
  let activeTransition = null;
  let busy = false;

  function renderHistory(conversations, activeConversationId) {
    const hasActiveHistoryItem = conversations.some(({ id }) => id === activeConversationId);
    newConversation.classList.toggle('is-active', !hasActiveHistoryItem);
    if (hasActiveHistoryItem) newConversation.removeAttribute('aria-current');
    else newConversation.setAttribute('aria-current', 'page');

    clear(historyList);
    if (conversations.length === 0) {
      historyList.append(
        element('p', { className: 'conversation-history-empty', text: 'No conversations yet' }),
      );
      return;
    }

    conversations.forEach(({ id, title }) => {
      const isActive = id === activeConversationId;
      historyList.append(
        element(
          'button',
          {
            className: `conversation-history-item${isActive ? ' is-active' : ''}`,
            text: title,
            attributes: {
              type: 'button',
              title,
              disabled: busy,
              'aria-current': isActive ? 'page' : null,
            },
            events: {
              click: () => {
                onSelectConversation(id);
                if (mobileQuery?.matches) setExpanded(false);
              },
            },
          },
        ),
      );
    });
  }

  function setExpanded(nextExpanded, { animate = true } = {}) {
    if (initialized && nextExpanded === expanded) return;

    const commit = () => {
      expanded = nextExpanded;
      node.classList.toggle('is-collapsed', !expanded);
      open.setAttribute('aria-expanded', String(expanded));
      onExpandedChange(expanded);
    };
    const prefersReducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canUseSharedTransition = initialized
      && animate
      && !prefersReducedMotion
      && !mobileQuery?.matches
      && typeof document.startViewTransition === 'function';

    if (canUseSharedTransition) {
      activeTransition?.skipTransition();
      const transition = document.startViewTransition(commit);
      activeTransition = transition;
      transition.finished.finally(() => {
        if (activeTransition === transition) activeTransition = null;
      });
    } else {
      commit();
    }

    initialized = true;
  }

  function focusFirstControl() {
    globalThis.setTimeout(() => collapse.focus({ preventScroll: true }), 0);
  }

  function focusOpenControl() {
    globalThis.setTimeout(() => open.focus({ preventScroll: true }), 0);
  }

  sidebar.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || !expanded || !mobileQuery?.matches) return;
    const controls = [...sidebar.querySelectorAll('button:not(:disabled), a[href]')]
      .filter((control) => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  newConversation.addEventListener('click', () => {
    onNewConversation();
    if (mobileQuery?.matches) setExpanded(false);
  });
  collapse.addEventListener('click', () => {
    setExpanded(false);
    if (mobileQuery?.matches) focusOpenControl();
  });
  open.addEventListener('click', () => {
    setExpanded(true);
    if (mobileQuery?.matches) focusFirstControl();
  });
  backdrop.addEventListener('click', () => {
    setExpanded(false);
    focusOpenControl();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && expanded && mobileQuery?.matches) {
      setExpanded(false);
      focusOpenControl();
    }
  });
  mobileQuery?.addEventListener('change', (event) => setExpanded(!event.matches, { animate: false }));

  setExpanded(expanded, { animate: false });

  return {
    node,
    collapse: () => setExpanded(false),
    renderHistory,
    setBusy(nextBusy) {
      busy = nextBusy;
      newConversation.disabled = nextBusy;
      historyList.querySelectorAll('.conversation-history-item').forEach((button) => {
        button.disabled = nextBusy;
      });
    },
  };
}
