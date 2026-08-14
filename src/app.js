import { element } from './api/dom.js';
import { createComposer } from './components/composer.js';
import { createConversation } from './components/conversation.js';
import { createHeader, createHero } from './components/chrome.js';
import { createImageLightbox } from './components/image-lightbox.js';
import { createSidebar } from './components/sidebar.js';
import { createSuggestions } from './components/suggestions.js';
import { shouldShowRoutingExplanation } from './data/routing-explanation.js';

export function createAcademicAgentApp({ agent, profile }) {
  const page = element('div', { className: 'page' });
  const main = element('main', { className: 'main-shell' });
  const hero = createHero();
  const imageLightbox = createImageLightbox();
  const askArea = element('section', { className: 'ask-area' });
  const sessions = [];
  let sessionOrder = 0;
  let busy = false;

  function createSession(agentConversationId) {
    agent.switchConversation(agentConversationId);
    const session = {
      id: agentConversationId,
      title: 'New conversation',
      conversation: createConversation(profile, imageLightbox),
      visibleTopics: agent.initialSuggestions(),
      hasMessages: false,
      updatedOrder: ++sessionOrder,
    };
    sessions.push(session);
    return session;
  }

  let activeSession = createSession(agent.activeConversationId);
  let conversation = activeSession.conversation;
  let visibleTopics = activeSession.visibleTopics;

  const titleFromPrompt = (prompt) => {
    const normalized = prompt.replace(/\s+/g, ' ').trim();
    return normalized.length > 38 ? `${normalized.slice(0, 38)}…` : normalized;
  };

  const historyItems = () => sessions
    .filter(({ hasMessages }) => hasMessages)
    .sort((left, right) => right.updatedOrder - left.updatedOrder)
    .map(({ id, title }) => ({ id, title }));

  const refreshHistory = () => {
    sidebar.renderHistory(historyItems(), activeSession.id);
  };

  const scrollToLatest = () => {
    window.setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  async function ask(prompt, requestedIntentId = null) {
    if (busy) return;
    busy = true;
    if (!activeSession.hasMessages) {
      activeSession.hasMessages = true;
      activeSession.title = titleFromPrompt(prompt);
    }
    activeSession.updatedOrder = ++sessionOrder;
    page.classList.add('has-conversation');
    composer.setBusy(true);
    sidebar.setBusy(true);
    conversation.addUserMessage(prompt);
    refreshHistory();
    const response = conversation.addAgentMessage();
    let answeredIntentId = null;
    scrollToLatest();

    try {
      for await (const event of agent.ask(prompt, requestedIntentId)) {
        if (event.type === 'loading-start') response.showLoader();
        if (event.type === 'loading-end') response.hideLoader();
        if (event.type === 'thinking-start') response.showThinking(event.message);
        if (event.type === 'thinking-update') response.updateThinking(event.message);
        if (event.type === 'thinking-end') {
          response.finishThinking(event.durationSeconds, event.detail);
        }
        if (event.type === 'token') response.appendToken(event.value, event.link, event.strong);
        if (event.type === 'blocks') {
          await response.appendBlocks(event.value, event.tokenDelay);
        }
        if (event.type === 'emphasis-list-start') response.startEmphasisList();
        if (event.type === 'emphasis-list-item-start') response.startEmphasisListItem();
        if (event.type === 'emphasis-list-token') response.appendEmphasisListToken(event.value);
        if (event.type === 'emphasis-list-item-end') response.endEmphasisListItem();
        if (event.type === 'emphasis-list-end') response.endEmphasisList();
        if (event.type === 'image-start') response.showImageProcess(event.message, event.value);
        if (event.type === 'image-progress') response.updateImageProcess(event.message);
        if (event.type === 'image') await response.appendImage(event.value);
        if (event.type === 'done') {
          answeredIntentId = event.isRepeatResponse ? null : event.intentId;
          if (shouldShowRoutingExplanation(event)) response.appendUnknownExplanation();
        }
      }

      response.appendFollowUps(
        agent.followUps(answeredIntentId),
        (topic) => ask(topic.prompt, topic.id),
      );
    } catch (error) {
      response.hideLoader();
      response.hideThinking();
      response.showError('Something went wrong while preparing this answer. Please try again.');
      console.error('Unable to complete the requested answer.', error);
    } finally {
      busy = false;
      composer.setBusy(false);
      sidebar.setBusy(false);
      scrollToLatest();
    }
  }

  const composer = createComposer({ onSubmit: (prompt) => ask(prompt) });
  const suggestions = createSuggestions({
    initialTopics: visibleTopics,
    onAsk: (topic) => ask(topic.prompt, topic.id),
    onReplace: (removedId) => {
      const remaining = visibleTopics.filter((topic) => topic.id !== removedId);
      const [replacement] = agent.suggestions(1, [...remaining.map((topic) => topic.id), removedId]);
      visibleTopics = [...remaining, replacement];
      activeSession.visibleTopics = visibleTopics;
      suggestions.render(visibleTopics);
    },
    onShuffle: () => {
      visibleTopics = agent.suggestions();
      activeSession.visibleTopics = visibleTopics;
      suggestions.render(visibleTopics);
    },
  });

  const activateSession = (session) => {
    if (busy) return;
    if (session.id !== activeSession.id) {
      agent.switchConversation(session.id);
      conversation.node.replaceWith(session.conversation.node);
      activeSession = session;
      conversation = session.conversation;
      visibleTopics = session.visibleTopics;
    }
    page.classList.toggle('has-conversation', session.hasMessages);
    suggestions.render(visibleTopics);
    composer.reset();
    refreshHistory();
    window.setTimeout(() => {
      window.scrollTo({
        top: session.hasMessages ? document.body.scrollHeight : 0,
        behavior: 'smooth',
      });
    }, 0);
    composer.focus();
  };

  const newConversation = () => {
    if (busy) return;
    const session = createSession(agent.startConversation());
    activateSession(session);
  };

  const selectConversation = (conversationId) => {
    const session = sessions.find(({ id }) => id === conversationId);
    if (session) activateSession(session);
  };

  const pageContent = element(
    'div',
    { className: 'page-content' },
    createHeader(profile),
    main,
  );
  const mobileSidebarQuery = globalThis.matchMedia?.('(max-width: 900px)');
  const sidebar = createSidebar({
    profile,
    onNewConversation: newConversation,
    onSelectConversation: selectConversation,
    onExpandedChange: (expanded) => {
      page.classList.toggle('sidebar-expanded', expanded);
      pageContent.toggleAttribute('inert', Boolean(expanded && mobileSidebarQuery?.matches));
    },
  });
  refreshHistory();

  askArea.append(composer.node, suggestions.node);
  main.append(hero, conversation.node, askArea);
  page.append(sidebar.node, pageContent);
  return page;
}
