import { assertIntentModel } from '../models/intent-model.js';
import { getImageProcessDelays } from './image-process-timing.js';
import { sampleResponseProcess } from './response-process.js';
import { getTypingDelay } from './typing-speed.js';

const defaultCommonRepeatAnswers = Object.freeze([
  {
    text: "Didn't you ask me that already? 🤔",
    blocks: [],
  },
  {
    text: "I've already answered this quite a few times 😠",
    blocks: [],
  },
]);

const secondQuestionRepeatProbability = 0.4;
const laterQuestionRepeatOneProbability = 0.2;
const laterQuestionRepeatTwoBoundary = 0.5;

/**
 * Framework-independent Academic Agent API.
 * The UI consumes its event stream and never needs to know routing details.
 */

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

const wait = (duration) => new Promise((resolve) => globalThis.setTimeout(resolve, duration));

async function* streamAnswerTokens(response, maximumDelay) {
  const content = response.content || [{ text: response.text }];
  const characterCount = content.reduce(
    (total, item) => total + [...item.text].length,
    0,
  );
  const delay = getTypingDelay(characterCount, maximumDelay);
  for (const item of content) {
    for (const character of item.text) {
      yield {
        type: 'token',
        value: character,
        link: item.href ? { href: item.href } : null,
        strong: Boolean(item.strong),
      };
      if (delay > 0) await wait(delay);
    }
  }
}

async function* streamAnswerBlocks(blocks, maximumDelay) {
  for (const block of blocks) {
    if (block.type !== 'emphasisList') {
      yield { type: 'blocks', value: [block], tokenDelay: maximumDelay };
      continue;
    }

    const characterCount = block.items.reduce(
      (total, item) => total + [...item].length,
      0,
    );
    const delay = getTypingDelay(characterCount, maximumDelay);
    yield { type: 'emphasis-list-start' };
    for (const item of block.items) {
      yield { type: 'emphasis-list-item-start' };
      for (const character of item) {
        yield { type: 'emphasis-list-token', value: character };
        if (delay > 0) await wait(delay);
      }
      yield { type: 'emphasis-list-item-end' };
    }
    yield { type: 'emphasis-list-end' };
  }
}

export class AcademicAgent {
  constructor({
    model,
    intents,
    answers,
    suggestionPlacements,
    typingDelay = 8,
    random = Math.random,
    processRandom = Math.random,
    responseProcessTimeScale = 1,
    commonRepeatAnswers = defaultCommonRepeatAnswers,
  }) {
    this.model = assertIntentModel(model);
    const intentsById = new Map(intents.map((intent) => [intent.id, intent]));
    this.intentsById = intentsById;
    const labelsFor = (ids, location) => ids.map((id) => {
      const label = intentsById.get(id);
      if (!label) throw new TypeError(`${location} references unknown label "${id}".`);
      return label;
    });
    if (
      !suggestionPlacements
      || !Array.isArray(suggestionPlacements.tryAsking)
      || !Array.isArray(suggestionPlacements.initialTryAsking)
      || !suggestionPlacements.followUps
    ) {
      throw new TypeError('AcademicAgent requires complete suggestion placements.');
    }
    this.suggestionIntents = labelsFor(
      suggestionPlacements.tryAsking,
      'Try Asking placements',
    );
    this.initialSuggestionIntents = labelsFor(
      suggestionPlacements.initialTryAsking,
      'Initial Try Asking placements',
    );
    if (!this.initialSuggestionIntents.every(({ id }) => (
      suggestionPlacements.tryAsking.includes(id)
    ))) {
      throw new TypeError('Initial Try Asking labels must also exist in the Try Asking list.');
    }
    this.followUpsByLabel = new Map(
      Object.entries(suggestionPlacements.followUps).map(([parentId, childIds]) => {
        if (!intentsById.has(parentId)) {
          throw new TypeError(`Follow-up placements reference unknown parent label "${parentId}".`);
        }
        if (!Array.isArray(childIds)) {
          throw new TypeError(`Follow-up placements for "${parentId}" must be an array.`);
        }
        return [parentId, labelsFor(childIds, `Follow-up placements for "${parentId}"`)];
      }),
    );
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new TypeError('AcademicAgent requires a non-empty answer catalog.');
    }
    this.answersById = new Map(answers.map((answer) => [answer.id, answer]));
    const invalidAnswer = answers.find((answer) => (
      !answer.id
      || !Array.isArray(answer.variants)
      || answer.variants.length === 0
      || !['tracked', 'stateless'].includes(answer.repeatMode)
      || answer.variants.some(({ samplingWeight = 1 }) => (
        !Number.isFinite(samplingWeight) || samplingWeight <= 0
      ))
    ));
    if (invalidAnswer) {
      throw new TypeError('Every answer requires a stable id and at least one variant.');
    }
    const missingAnswerQuestion = intents.find(({ answerId }) => !this.answersById.has(answerId));
    if (missingAnswerQuestion) {
      throw new TypeError(
        `Question "${missingAnswerQuestion.id}" references unknown answer "${missingAnswerQuestion.answerId}".`,
      );
    }
    if (!Array.isArray(commonRepeatAnswers) || commonRepeatAnswers.length === 0) {
      throw new TypeError('AcademicAgent requires at least one common repeat answer.');
    }
    if (typeof processRandom !== 'function') {
      throw new TypeError('AcademicAgent processRandom must be a function.');
    }
    if (!Number.isFinite(responseProcessTimeScale) || responseProcessTimeScale < 0) {
      throw new RangeError('AcademicAgent responseProcessTimeScale must be a non-negative number.');
    }
    this.commonRepeatAnswers = commonRepeatAnswers;
    this.typingDelay = typingDelay;
    this.random = random;
    this.processRandom = processRandom;
    this.responseProcessTimeScale = responseProcessTimeScale;
    this.conversationStates = new Map();
    this.conversationSequence = 0;
    this.activeConversationId = this.startConversation();
  }

  startConversation() {
    this.conversationSequence += 1;
    const conversationId = `conversation-${this.conversationSequence}`;
    this.conversationStates.set(conversationId, {
      answerPools: new Map(),
      seenSuggestionIds: new Set(),
    });
    this.activeConversationId = conversationId;
    return conversationId;
  }

  switchConversation(conversationId) {
    if (!this.conversationStates.has(conversationId)) {
      throw new RangeError(`Unknown conversation "${conversationId}".`);
    }
    this.activeConversationId = conversationId;
  }

  get activeConversationState() {
    return this.conversationStates.get(this.activeConversationId);
  }

  withDisplayPrompt(intent) {
    const prompts = intent.displayPrompts;
    if (!prompts.length) return intent;
    const prompt = prompts[Math.floor(this.random() * prompts.length)];
    return Object.freeze({ ...intent, prompt });
  }

  suggestions(count = 3, excludedIds = []) {
    const excluded = new Set(excludedIds);
    const eligible = this.suggestionIntents.filter((intent) => !excluded.has(intent.id));
    const targetCount = Math.min(count, eligible.length);
    const selected = [];

    while (selected.length < targetCount) {
      const selectedIds = new Set(selected.map(({ id }) => id));
      const unseen = eligible.filter(({ id }) => (
        !this.activeConversationState.seenSuggestionIds.has(id) && !selectedIds.has(id)
      ));

      if (unseen.length > 0) {
        const remainingCount = targetCount - selected.length;
        const additions = shuffle(unseen, this.random).slice(0, remainingCount);
        additions.forEach(({ id }) => this.activeConversationState.seenSuggestionIds.add(id));
        selected.push(...additions);
        continue;
      }

      const hasCompletedCycle = this.suggestionIntents.every(({ id }) => (
        this.activeConversationState.seenSuggestionIds.has(id)
      ));
      if (!hasCompletedCycle) break;

      this.activeConversationState.seenSuggestionIds.clear();
      selected.forEach(({ id }) => this.activeConversationState.seenSuggestionIds.add(id));
    }

    return selected.map((intent) => this.withDisplayPrompt(intent));
  }

  initialSuggestions() {
    this.activeConversationState.seenSuggestionIds.clear();
    this.initialSuggestionIntents.forEach(({ id }) => (
      this.activeConversationState.seenSuggestionIds.add(id)
    ));
    return this.initialSuggestionIntents.map((intent) => this.withDisplayPrompt(intent));
  }

  followUps(answeredLabelId, count = 3) {
    if (!answeredLabelId) return [];
    const configured = this.followUpsByLabel.get(answeredLabelId) || [];
    const configuredOrder = new Map(configured.map(({ id }, index) => [id, index]));
    return shuffle(configured, this.random)
      .slice(0, count)
      .sort((left, right) => configuredOrder.get(left.id) - configuredOrder.get(right.id))
      .map((intent) => this.withDisplayPrompt(intent));
  }

  resetConversation() {
    this.activeConversationState.answerPools.clear();
    this.activeConversationState.seenSuggestionIds.clear();
  }

  takeRandom(items) {
    if (items.length === 1) return items.pop();
    const index = Math.floor(this.random() * items.length);
    return items.splice(index, 1)[0];
  }

  takeWeighted(items) {
    const totalWeight = items.reduce(
      (total, { samplingWeight = 1 }) => total + samplingWeight,
      0,
    );
    const target = this.random() * totalWeight;
    let accumulatedWeight = 0;
    for (const item of items) {
      accumulatedWeight += item.samplingWeight ?? 1;
      if (target < accumulatedWeight) return item;
    }
    return items.at(-1);
  }

  selectAnswer(answerId) {
    const answer = this.answersById.get(answerId);
    if (!answer) throw new RangeError(`Unknown answer "${answerId}".`);

    if (answer.repeatMode === 'stateless') {
      return {
        response: this.takeWeighted(answer.variants),
        isRepeatResponse: false,
      };
    }

    let pool = this.activeConversationState.answerPools.get(answerId);
    if (!pool) {
      pool = {
        answerCount: 0,
        unusedSynonymAnswers: answer.variants.slice(1),
      };
      this.activeConversationState.answerPools.set(answerId, pool);
    }

    pool.answerCount += 1;
    if (pool.answerCount === 1) {
      return {
        response: answer.variants[0],
        isRepeatResponse: false,
      };
    }

    const sample = this.random();
    let repeatIndex = null;
    if (pool.answerCount === 2) {
      if (sample < secondQuestionRepeatProbability) repeatIndex = 0;
    } else if (sample < laterQuestionRepeatOneProbability) {
      repeatIndex = 0;
    } else if (sample < laterQuestionRepeatTwoBoundary) {
      repeatIndex = 1;
    }

    if (repeatIndex === null) {
      const response = pool.unusedSynonymAnswers.length > 0
        ? this.takeRandom(pool.unusedSynonymAnswers)
        : (answer.variants.length === 1 ? answer.variants[0] : this.takeWeighted(answer.variants));
      return {
        response,
        isRepeatResponse: false,
      };
    }

    const repeatAnswers = answer.repeatAnswers ?? this.commonRepeatAnswers;
    return {
      response: repeatAnswers[Math.min(repeatIndex, repeatAnswers.length - 1)],
      isRepeatResponse: true,
    };
  }

  directPrediction(intentId) {
    const intent = this.intentsById.get(intentId);
    if (!intent) return null;
    return Object.freeze({
      intentId: intent.id,
      answerId: intent.answerId,
      intent,
      confidence: 1,
      source: 'direct-selection',
      modelId: 'direct-selection',
    });
  }

  async *ask(prompt, requestedIntentId = null) {
    let routed = requestedIntentId ? this.directPrediction(requestedIntentId) : null;
    let loaderVisible = false;

    if (!routed) {
      loaderVisible = true;
      yield { type: 'loading-start' };
      try {
        routed = await this.model.predict(prompt);
      } catch (error) {
        yield { type: 'loading-end' };
        throw error;
      }
    }

    const { response, isRepeatResponse } = this.selectAnswer(routed.answerId);
    const answer = this.answersById.get(routed.answerId);
    const allowThinking = answer.repeatMode !== 'stateless' && !isRepeatResponse;
    const process = sampleResponseProcess(this.processRandom, {
      allowThinking,
      allowLongThinking: allowThinking,
    });
    if (process.mode === 'immediate') {
      if (loaderVisible) yield { type: 'loading-end' };
    } else if (process.mode === 'loading') {
      if (!loaderVisible) yield { type: 'loading-start' };
      const duration = process.durationMs * this.responseProcessTimeScale;
      if (duration > 0) await wait(duration);
      yield { type: 'loading-end' };
    } else {
      if (loaderVisible) yield { type: 'loading-end' };
      const stageDuration = (
        process.durationMs
        * this.responseProcessTimeScale
        / process.stageMessages.length
      );
      yield { type: 'thinking-start', message: process.stageMessages[0] };
      for (let index = 0; index < process.stageMessages.length; index += 1) {
        if (index > 0) {
          yield { type: 'thinking-update', message: process.stageMessages[index] };
        }
        if (stageDuration > 0) await wait(stageDuration);
      }
      yield {
        type: 'thinking-end',
        durationSeconds: process.durationSeconds,
        detail: process.detail,
      };
    }

    if (response.image) {
      const [preparingDelay, finishingDelay] = getImageProcessDelays(this.random);
      yield* streamAnswerTokens(response, this.typingDelay);
      yield { type: 'image-start', message: 'Preparing image', value: response.image };
      await wait(preparingDelay);
      yield { type: 'image-progress', message: 'Almost ready' };
      await wait(finishingDelay);
      yield { type: 'image', value: response.image };
      yield {
        type: 'done',
        intentId: routed.intent.id,
        confidence: routed.confidence,
        source: routed.source,
        modelId: routed.modelId,
        answerId: routed.answerId,
        isRepeatResponse,
      };
      return;
    }

    const prefersReducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReducedMotion ? 0 : this.typingDelay;
    const responseBlocks = response.blocks || [];
    yield* streamAnswerBlocks(
      responseBlocks.filter(({ position }) => position === 'before'),
      delay,
    );
    yield* streamAnswerTokens(response, delay);
    yield* streamAnswerBlocks(
      responseBlocks.filter(({ position }) => position !== 'before'),
      delay,
    );
    yield {
      type: 'done',
      intentId: routed.intent.id,
      confidence: routed.confidence,
      source: routed.source,
      modelId: routed.modelId,
      answerId: routed.answerId,
      isRepeatResponse,
    };
  }
}
