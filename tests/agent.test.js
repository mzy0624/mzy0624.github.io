import test from 'node:test';
import assert from 'node:assert/strict';
import { thinkingDetails, thinkingMoments } from '../src/data/thinking-details.js';
import { AcademicAgent } from '../src/api/academic-agent.js';
import { answers, commonRepeatAnswers, intents } from '../src/data/intents.js';
import { getPublicationVenuePrefix, groupPublications, publicationTypes } from '../src/data/publication-groups.js';
import { profile } from '../src/data/profile.js';
import answerContent from '../content/answers.json' with { type: 'json' };
import profileContent from '../content/profile.json' with { type: 'json' };
import questionContent from '../content/questions.json' with { type: 'json' };
import { scanPublications } from '../scripts/lib/publications.mjs';
import { suggestionPlacements } from '../src/data/suggestion-placements.js';
import { DeterministicIntentModel } from '../src/models/deterministic-intent-model.js';

const model = new DeterministicIntentModel({
  intents,
  fallbackId: 'unknown',
});

const { records: publicationRecords } = await scanPublications();

const createAgent = (options = {}) => new AcademicAgent({
  model,
  intents,
  answers,
  suggestionPlacements,
  processRandom: () => 0,
  responseProcessTimeScale: 0,
  ...options,
});

const answersById = new Map(answers.map((answer) => [answer.id, answer]));
const answerForQuestion = (questionOrId) => {
  const question = typeof questionOrId === 'string'
    ? intents.find(({ id }) => id === questionOrId)
    : questionOrId;
  return answersById.get(question.answerId);
};

async function askText(agent, prompt, requestedIntentId = null) {
  const events = [];
  for await (const event of agent.ask(prompt, requestedIntentId)) events.push(event);
  return {
    text: events
      .filter(({ type }) => type === 'token')
      .map(({ value }) => value)
      .join(''),
    done: events.find(({ type }) => type === 'done'),
  };
}

test('directly selected suggestions output immediately in the 40 percent branch', async () => {
  let predictionCalls = 0;
  const directModel = new DeterministicIntentModel({
    intents,
    fallbackId: 'unknown',
  });
  const originalPredict = directModel.predict.bind(directModel);
  directModel.predict = async (...parameters) => {
    predictionCalls += 1;
    return originalPredict(...parameters);
  };
  const directAgent = createAgent({ model: directModel, typingDelay: 0 });
  const events = [];

  for await (const event of directAgent.ask('How about your publications?', 'papers')) {
    events.push(event);
  }

  assert.equal(predictionCalls, 0);
  assert.ok(!events.some(({ type }) => (
    type.startsWith('loading-') || type.startsWith('thinking-')
  )));
  assert.equal(events.find(({ type }) => type === 'done').source, 'direct-selection');
});

test('manual questions show the loader for their actual routing time', async () => {
  let predictionCalls = 0;
  const routingModel = new DeterministicIntentModel({
    intents,
    fallbackId: 'unknown',
  });
  const originalPredict = routingModel.predict.bind(routingModel);
  routingModel.predict = async (...parameters) => {
    predictionCalls += 1;
    return originalPredict(...parameters);
  };
  const routingAgent = createAgent({ model: routingModel, typingDelay: 0 });
  const events = [];

  for await (const event of routingAgent.ask('Could you introduce yourself?')) events.push(event);

  const loadingIndex = events.findIndex(({ type }) => type === 'loading-start');
  const loadingEndIndex = events.findIndex(({ type }) => type === 'loading-end');
  const firstAnswerIndex = events.findIndex(({ type }) => type === 'token' || type === 'blocks');

  assert.equal(predictionCalls, 1);
  assert.equal(loadingIndex, 0);
  assert.ok(loadingEndIndex > loadingIndex);
  assert.ok(firstAnswerIndex > loadingEndIndex);

  const laterEvents = [];
  for await (const event of routingAgent.ask('What are your hobbies?')) laterEvents.push(event);
  assert.equal(laterEvents[0].type, 'loading-start');
  assert.ok(laterEvents.some(({ type }) => type === 'loading-end'));
});

test('direct questions can take the one-second loading branch', async () => {
  const agent = createAgent({ processRandom: () => 0.6 });
  const events = [];
  for await (const event of agent.ask('How about your publications?', 'papers')) events.push(event);
  const startIndex = events.findIndex(({ type }) => type === 'loading-start');
  const endIndex = events.findIndex(({ type }) => type === 'loading-end');
  const answerIndex = events.findIndex(({ type }) => type === 'token' || type === 'blocks');

  assert.equal(startIndex, 0);
  assert.ok(endIndex > startIndex);
  assert.ok(answerIndex > endIndex);
});

test('ordinary thinking emits two stages and its detail before the answer', async () => {
  const samples = [0.8, 0.5, 0];
  const agent = createAgent({ processRandom: () => samples.shift() });
  const events = [];
  for await (const event of agent.ask('Who are you?', 'identity_general')) events.push(event);
  const startIndex = events.findIndex(({ type }) => type === 'thinking-start');
  const updateIndex = events.findIndex(({ type }) => type === 'thinking-update');
  const endIndex = events.findIndex(({ type }) => type === 'thinking-end');
  const answerIndex = events.findIndex(({ type }) => type === 'token' || type === 'blocks');

  assert.equal(startIndex, 0);
  assert.deepEqual(events[startIndex], { type: 'thinking-start', message: 'Thinking' });
  assert.deepEqual(events[updateIndex], {
    type: 'thinking-update',
    message: thinkingMoments[0].status,
  });
  assert.ok(updateIndex > startIndex);
  assert.ok(endIndex > startIndex);
  assert.ok(answerIndex > endIndex);
  assert.deepEqual(events[endIndex], {
    type: 'thinking-end',
    durationSeconds: 3.5,
    detail: thinkingDetails[0],
  });
});

test('long thinking emits three stages for a normal answer', async () => {
  const samples = [0.95, 0.5, 0];
  const agent = createAgent({ processRandom: () => samples.shift() });
  const events = [];
  for await (const event of agent.ask('Who are you?', 'identity_general')) events.push(event);

  assert.deepEqual(
    events.filter(({ type }) => type.startsWith('thinking-')),
    [
      { type: 'thinking-start', message: 'Thinking' },
      { type: 'thinking-update', message: thinkingMoments[0].status },
      { type: 'thinking-update', message: 'Organizing the answer' },
      { type: 'thinking-end', durationSeconds: 7.5, detail: thinkingDetails[0] },
    ],
  );
});

test('unknown and repeated answers skip every thinking branch', async () => {
  const unknownSamples = [0.8];
  const unknownAgent = createAgent({
    typingDelay: 0,
    random: () => 0,
    processRandom: () => unknownSamples.shift(),
  });
  const unknownEvents = [];
  for await (const event of unknownAgent.ask('Explain relativity.', 'unknown')) {
    unknownEvents.push(event);
  }

  assert.equal(
    unknownEvents.some(({ message }) => message === 'Organizing the answer'),
    false,
  );
  assert.equal(unknownEvents.some(({ type }) => type.startsWith('thinking-')), false);

  const repeatSamples = [0, 0.8];
  const repeatAgent = createAgent({
    typingDelay: 0,
    random: () => 0,
    processRandom: () => repeatSamples.shift(),
  });
  for await (const _event of repeatAgent.ask('Who are you?', 'identity_general')) {
    // Establish the answer count before asking the repeated question.
  }
  const repeatEvents = [];
  for await (const event of repeatAgent.ask('Who are you?', 'identity_general')) {
    repeatEvents.push(event);
  }

  assert.equal(
    repeatEvents.some(({ message }) => message === 'Organizing the answer'),
    false,
  );
  assert.equal(repeatEvents.some(({ type }) => type.startsWith('thinking-')), false);
  assert.equal(repeatEvents.find(({ type }) => type === 'done').isRepeatResponse, true);
});

test('returns unique suggestions and respects exclusions', () => {
  const agent = createAgent({ model, intents, answers, random: () => 0.42 });
  const suggestions = agent.suggestions(3, ['identity_general']);
  assert.equal(suggestions.length, 3);
  assert.equal(new Set(suggestions.map((item) => item.id)).size, 3);
  assert.ok(!suggestions.some((item) => item.id === 'identity_general'));
  assert.ok(suggestions.every((item) => suggestionPlacements.tryAsking.includes(item.id)));
});

test('uses the configured fixed questions only for the initial suggestion state', () => {
  const agent = createAgent({ model, intents, answers, random: () => 0.42 });
  assert.deepEqual(agent.initialSuggestions().map(({ id }) => id), [
    'identity_general',
    'research',
    'papers',
  ]);
  assert.deepEqual(agent.initialSuggestions().map(({ prompt }) => prompt), [
    'Who are you?',
    'What are your research interests?',
    'How about your publications?',
  ]);
});

test('randomly chooses only English display prompts for the same label', () => {
  const firstAgent = createAgent({ model, intents, answers, random: () => 0 });
  const secondAgent = createAgent({ model, intents, answers, random: () => 0.999 });
  const firstIdentity = firstAgent.initialSuggestions().find(({ id }) => id === 'identity_general');
  const secondIdentity = secondAgent.initialSuggestions().find(({ id }) => id === 'identity_general');

  assert.equal(firstIdentity.prompt, 'Who are you?');
  assert.equal(secondIdentity.prompt, 'Introduce yourself.');
  assert.ok(!intents.find(({ id }) => id === 'identity_general').displayPrompts.includes('你是谁'));
});

test('does not repeat primary questions until every primary question has appeared', () => {
  const agent = createAgent({ model, intents, answers, random: () => 0.42 });
  const initial = agent.initialSuggestions();
  const primaryIds = suggestionPlacements.tryAsking;
  const firstCycle = [...initial];

  while (firstCycle.length < primaryIds.length) {
    firstCycle.push(...agent.suggestions(Math.min(3, primaryIds.length - firstCycle.length)));
  }
  const firstCycleIds = firstCycle.map(({ id }) => id);

  assert.equal(firstCycleIds.length, primaryIds.length);
  assert.deepEqual(new Set(firstCycleIds), new Set(primaryIds));

  const nextCycle = agent.suggestions(3);
  assert.equal(nextCycle.length, 3);
  assert.ok(nextCycle.some(({ id }) => firstCycleIds.includes(id)));
});

test('single-question replacements use the same unseen primary-question pool', () => {
  const agent = createAgent({ model, intents, answers, random: () => 0.42 });
  const initial = agent.initialSuggestions();
  const initialIds = initial.map(({ id }) => id);
  const [replacement] = agent.suggestions(1, initialIds);

  assert.ok(replacement);
  assert.ok(!initialIds.includes(replacement.id));
});

test('suggestion placements are maintained separately from labels', () => {
  const agent = createAgent({ model, intents, answers, random: () => 0.42 });
  const primaryIds = [
    'portrait',
    'identity_general',
    'education',
    'research',
    'papers',
    'skills',
    'hobbies',
    'services',
    'internship',
    'correspondence',
  ];
  assert.deepEqual(suggestionPlacements.tryAsking, primaryIds);
  assert.deepEqual(suggestionPlacements.followUps, {
    identity_general: ['identity_contact', 'portrait', 'education'],
    research: ['learnware', 'model_capability_mining'],
  });
  assert.deepEqual(
    new Set(agent.suggestions(20).map(({ id }) => id)),
    new Set(primaryIds),
  );
  assert.ok(intents.every((label) => (
    !Object.hasOwn(label, 'visibility')
    && !Object.hasOwn(label, 'showAfter')
    && !Object.hasOwn(label, 'canDisplayInTryAsking')
    && !Object.hasOwn(label, 'canDisplayAfterAnswer')
  )));
});

test('primary questions use the configured emoji icons in order', () => {
  assert.deepEqual(
    intents
      .filter(({ id }) => suggestionPlacements.tryAsking.includes(id))
      .map(({ icon, iconType }) => ({ icon, iconType })),
    ['📸', '🧑🏻‍💻', '📚', '🔬', '📑', '🔧', '🪄', '💁', '💼', '📍']
      .map((icon) => ({ icon, iconType: 'emoji' })),
  );
});

test('returns the configured child questions after their parent answers', () => {
  const agent = createAgent({ model, intents, answers, random: () => 0.42 });
  const researchFollowUps = agent.followUps('research');
  const identityFollowUps = agent.followUps('identity_general');

  assert.deepEqual(
    researchFollowUps.map(({ id }) => id),
    ['learnware', 'model_capability_mining'],
  );
  assert.deepEqual(
    identityFollowUps.map(({ id }) => id),
    ['identity_contact', 'portrait', 'education'],
  );
});

test('every known label appears in Try Asking or as a follow-up', () => {
  const placedIds = new Set([
    ...suggestionPlacements.tryAsking,
    ...Object.values(suggestionPlacements.followUps).flat(),
  ]);
  const hiddenLeaves = intents.filter(({ id }) => id !== 'unknown' && !placedIds.has(id));

  assert.deepEqual(hiddenLeaves.map(({ id }) => id), []);
});

test('contact follow-up renders the configured email list with its local logos', () => {
  const contact = intents.find(({ id }) => id === 'identity_contact');
  const contactAnswer = answerForQuestion(contact);

  assert.deepEqual(contactAnswer.variants[0].blocks, [{ type: 'emails' }]);
  assert.deepEqual(profile.emails, profileContent.emails);
});

test('separates question metadata from the answer catalog', () => {
  assert.ok(intents.every(({ answerId }) => answersById.has(answerId)));
  assert.ok(intents.every((intent) => (
    !Object.hasOwn(intent, 'answer')
    && !Object.hasOwn(intent, 'answers')
    && !Object.hasOwn(intent, 'repeatAnswers')
  )));
  assert.ok(answers.every(({ id, variants }) => id && variants.length > 0));
});

test('samples repeat responses by answer count and otherwise returns normal answers', () => {
  const randomValues = [0.39, 0.19, 0.3, 0.8];
  const primary = { text: 'Primary answer.', blocks: [] };
  const synonym = { text: 'Synonym answer.', blocks: [] };
  const repeatAnswers = [
    { text: 'Asked already.', blocks: [] },
    { text: 'Asked several times.', blocks: [] },
  ];
  const customAnswers = answers.map((answer) => answer.id === 'research'
    ? { ...answer, variants: [primary, synonym], repeatAnswers }
    : answer);
  const agent = createAgent({
    model,
    intents,
    answers: customAnswers,
    commonRepeatAnswers,
    typingDelay: 0,
    random: () => randomValues.shift() ?? 0,
  });

  const first = agent.selectAnswer('research');
  const second = agent.selectAnswer('research');
  const third = agent.selectAnswer('research');
  const fourth = agent.selectAnswer('research');
  const fifth = agent.selectAnswer('research');

  assert.strictEqual(first.response, primary);
  assert.strictEqual(second.response, repeatAnswers[0]);
  assert.strictEqual(third.response, repeatAnswers[0]);
  assert.strictEqual(fourth.response, repeatAnswers[1]);
  assert.strictEqual(fifth.response, synonym);
  assert.equal(first.isRepeatResponse, false);
  assert.equal(second.isRepeatResponse, true);
  assert.equal(third.isRepeatResponse, true);
  assert.equal(fourth.isRepeatResponse, true);
  assert.equal(fifth.isRepeatResponse, false);

  agent.resetConversation();
  const afterReset = agent.selectAnswer('research');
  assert.strictEqual(afterReset.response, primary);
  assert.equal(afterReset.isRepeatResponse, false);
});

test('returns a normal answer on the second question at the 40 percent boundary', () => {
  const primary = { text: 'Primary answer.', blocks: [] };
  const synonym = { text: 'Synonym answer.', blocks: [] };
  const customAnswers = answers.map((answer) => answer.id === 'research'
    ? { ...answer, variants: [primary, synonym] }
    : answer);
  const agent = createAgent({ answers: customAnswers, random: () => 0.4 });

  agent.selectAnswer('research');
  const second = agent.selectAnswer('research');

  assert.strictEqual(second.response, synonym);
  assert.equal(second.isRepeatResponse, false);
});

test('inherits common repeat answers when an intent has no custom repeat answers', () => {
  const research = intents.find(({ id }) => id === 'research');
  const agent = createAgent({
    model,
    intents,
    answers,
    commonRepeatAnswers,
    typingDelay: 0,
    random: () => 0,
  });

  assert.ok(!Object.hasOwn(answerForQuestion(research), 'repeatAnswers'));
  agent.selectAnswer('research');
  const repeated = agent.selectAnswer('research');
  assert.equal(repeated.response.text, commonRepeatAnswers[0].text);
});

test('unknown is stateless and never enters the repeat-response flow', async () => {
  const agent = createAgent({
    typingDelay: 0,
    random: () => 0,
  });
  const unknownAnswer = answersById.get('unknown');

  const relativity = await askText(agent, 'Please introduce the theory of relativity.');
  const groupTheory = await askText(agent, 'Please introduce group theory.');
  const relativityAgain = await askText(agent, 'Please introduce the theory of relativity.');

  assert.equal(unknownAnswer.repeatMode, 'stateless');
  assert.equal(relativity.text, unknownAnswer.variants[0].text);
  assert.equal(groupTheory.text, unknownAnswer.variants[0].text);
  assert.equal(relativityAgain.text, unknownAnswer.variants[0].text);
  assert.equal(relativity.done.isRepeatResponse, false);
  assert.equal(groupTheory.done.isRepeatResponse, false);
  assert.equal(relativityAgain.done.isRepeatResponse, false);
  assert.equal(agent.activeConversationState.answerPools.has('unknown'), false);
});

test('internship routes to its own visible label and joins the repeat-response flow', async () => {
  const agent = createAgent({
    typingDelay: 0,
    random: () => 0,
  });
  const internship = intents.find(({ id }) => id === 'internship');
  const response = await askText(agent, 'What internships have you completed?');

  assert.equal(internship.answerId, 'internship');
  assert.ok(suggestionPlacements.tryAsking.includes(internship.id));
  assert.ok(!Object.values(suggestionPlacements.followUps).flat().includes(internship.id));
  assert.equal(response.done.intentId, 'internship');
  assert.equal(response.done.answerId, 'internship');
  assert.equal(response.done.isRepeatResponse, false);
  assert.equal(response.text, 'Here is my internship experience.');
  assert.equal(answersById.get('internship').repeatMode, 'tracked');
  assert.equal(agent.activeConversationState.answerPools.has('internship'), true);

  const repeated = agent.selectAnswer('internship');
  assert.equal(repeated.response.text, commonRepeatAnswers[0].text);
  assert.equal(repeated.isRepeatResponse, true);

  agent.startConversation();
  const fresh = agent.selectAnswer('internship');
  assert.equal(fresh.response.text, 'Here is my internship experience.');
  assert.equal(fresh.isRepeatResponse, false);
});

test('unknown variants remain English while playful ones express uncertainty indirectly', () => {
  const unknownAnswer = answersById.get('unknown');
  const directUncertaintyOpening = /^(I don't know|I'm not sure|I have no idea|I have no reliable answer|I don't have a reliable answer|I can't answer that reliably)/;
  const seriousVariants = unknownAnswer.variants.filter(({ samplingWeight }) => samplingWeight === 10);
  const playfulVariants = unknownAnswer.variants.filter(({ samplingWeight }) => samplingWeight === undefined);

  assert.equal(unknownAnswer.variants.length, 23);
  assert.ok(unknownAnswer.variants.every(({ text }) => !/[\u3400-\u9fff]/u.test(text)));
  assert.ok(seriousVariants.every(({ text }) => directUncertaintyOpening.test(text)));
  assert.ok(playfulVariants.every(({ text }) => !directUncertaintyOpening.test(text)));
  assert.ok(playfulVariants.every(({ text }) => !/\b(?:imaginary|virtual|internal)\b/i.test(text)));
});

test('serious unknown answers have a higher combined sampling probability', () => {
  const unknownAnswer = answersById.get('unknown');
  const seriousVariants = unknownAnswer.variants.filter(({ samplingWeight }) => samplingWeight === 10);
  const playfulVariants = unknownAnswer.variants.filter(({ samplingWeight }) => samplingWeight === undefined);
  const totalWeight = unknownAnswer.variants.reduce(
    (total, { samplingWeight = 1 }) => total + samplingWeight,
    0,
  );

  assert.equal(seriousVariants.length, 3);
  assert.equal(playfulVariants.length, 20);
  assert.equal(
    seriousVariants.reduce((total, item) => total + item.samplingWeight, 0) / totalWeight,
    0.6,
  );
});

test('stateless unknown answers are randomly sampled with replacement', () => {
  const firstAgent = createAgent({ random: () => 0 });
  const seriousAgent = createAgent({ random: () => 0.599 });
  const playfulAgent = createAgent({ random: () => 0.6 });
  const lastAgent = createAgent({ random: () => 0.999 });
  const unknownAnswer = answersById.get('unknown');

  assert.equal(firstAgent.selectAnswer('unknown').response.text, unknownAnswer.variants[0].text);
  assert.equal(seriousAgent.selectAnswer('unknown').response.samplingWeight, 10);
  assert.equal(playfulAgent.selectAnswer('unknown').response.samplingWeight, undefined);
  assert.equal(lastAgent.selectAnswer('unknown').response.text, unknownAnswer.variants.at(-1).text);
  assert.equal(firstAgent.selectAnswer('unknown').response.text, unknownAnswer.variants[0].text);
});

test('keeps answer and suggestion state independent for each conversation', () => {
  const agent = createAgent({
    model,
    intents,
    answers,
    commonRepeatAnswers,
    typingDelay: 0,
    random: () => 0,
  });
  const firstConversationId = agent.activeConversationId;
  const firstTopics = agent.initialSuggestions();
  const firstAnswer = agent.selectAnswer('research');
  const firstRepeat = agent.selectAnswer('research');

  const secondConversationId = agent.startConversation();
  const secondTopics = agent.initialSuggestions();
  const freshAnswer = agent.selectAnswer('research');

  agent.switchConversation(firstConversationId);
  const resumedRepeat = agent.selectAnswer('research');

  assert.notEqual(secondConversationId, firstConversationId);
  assert.deepEqual(secondTopics.map(({ id }) => id), firstTopics.map(({ id }) => id));
  assert.strictEqual(firstAnswer.response, answerForQuestion('research').variants[0]);
  assert.strictEqual(firstRepeat.response, commonRepeatAnswers[0]);
  assert.strictEqual(freshAnswer.response, answerForQuestion('research').variants[0]);
  assert.strictEqual(resumedRepeat.response, commonRepeatAnswers[0]);
});

test('streams a routed answer variant through the public Agent API', async () => {
  const agent = createAgent({
    model,
    intents,
    answers,
    typingDelay: 0,
    random: () => 0.5,
  });
  const events = [];
  for await (const event of agent.ask('你的研究方向是什么？')) events.push(event);

  const text = events
    .filter((event) => event.type === 'token')
    .map((event) => event.value)
    .join('');
  const done = events.find((event) => event.type === 'done');
  const strongText = events
    .filter((event) => event.type === 'token' && event.strong)
    .map((event) => event.value)
    .join('');

  const configuredAnswer = answerForQuestion('research').variants[0];
  assert.equal(text, configuredAnswer.text);
  assert.equal(
    strongText,
    configuredAnswer.content.filter(({ strong }) => strong).map(({ text: value }) => value).join(''),
  );
  assert.equal(
    events
      .filter(({ type }) => type === 'emphasis-list-token')
      .map(({ value }) => value)
      .join(''),
    configuredAnswer.blocks[0].items.join(''),
  );
  assert.equal(events.filter(({ type }) => type === 'emphasis-list-start').length, 1);
  assert.equal(events.filter(({ type }) => type === 'emphasis-list-item-start').length, 2);
  assert.equal(events.filter(({ type }) => type === 'emphasis-list-item-end').length, 2);
  assert.equal(events.filter(({ type }) => type === 'emphasis-list-end').length, 1);
  assert.ok(!events.some(({ type }) => type === 'blocks'));
  assert.equal(done.intentId, 'research');
  assert.equal(done.answerId, 'research');
  assert.equal(done.modelId, 'deterministic-keyword-v1');
});

test('streams a configured leading statement before its answer text', async () => {
  const answer = answerForQuestion('learnware').variants[0];
  const statement = answer.blocks.find(({ type }) => type === 'statement');
  assert.ok(answer.text.length > 0);
  assert.equal(statement.position, 'before');

  const agent = createAgent();
  const events = [];
  const prompt = intents.find(({ id }) => id === 'learnware').displayPrompts[0];
  for await (const event of agent.ask(prompt, 'learnware')) {
    events.push(event);
  }
  const formulaIndex = events.findIndex(({ type }) => type === 'blocks');
  const textIndex = events.findIndex(({ type }) => type === 'token');
  assert.ok(formulaIndex >= 0);
  assert.ok(textIndex > formulaIndex);
});

test('preserves configured rich emphasis in the second research sub-answer', () => {
  const answer = answerForQuestion('model_capability_mining').variants[0];
  assert.ok(answer.text.length > 0);
  assert.ok(answer.content.some(({ strong }) => strong));
});

test('marks every structured profile answer for token-paced block rendering', async () => {
  const cases = [
    ['Tell me about your education', 'education', 'education'],
    ['How about your internship experience?', 'internship', 'internships'],
    ['How can I contact you?', 'identity_contact', 'emails'],
    ['How about your publications?', 'papers', 'publications'],
    ['What technical skills do you have?', 'skills', 'skills'],
    ['What are your hobbies?', 'hobbies', 'hobbies'],
    ['What academic service have you done?', 'services', 'services'],
    ['What is your correspondence address?', 'correspondence', 'correspondence'],
  ];

  for (const [prompt, intentId, blockType] of cases) {
    const agent = createAgent({
      model,
      intents,
      answers,
      typingDelay: 0,
      random: () => 0.5,
    });
    const events = [];
    for await (const event of agent.ask(prompt, intentId)) events.push(event);
    const blockEvent = events.find(({ type }) => type === 'blocks');

    assert.ok(blockEvent, prompt);
    assert.equal(blockEvent.tokenDelay, 0, prompt);
    assert.deepEqual(blockEvent.value.map(({ type }) => type), [blockType], prompt);
  }
});

test('education loads structured degree entries from profile content', () => {
  const answer = answerForQuestion('education').variants[0];
  assert.deepEqual(answer.blocks, [{ type: 'education' }]);
  assert.deepEqual(profile.education, profileContent.education);
});

test('internship loads its structured timeline entry from profile content', () => {
  const answer = answerForQuestion('internship').variants[0];
  assert.deepEqual(answer.blocks, [{ type: 'internships' }]);
  assert.deepEqual(profile.internships, profileContent.internships);
  assert.deepEqual(profile.internships, [
    {
      name: 'SinapisAI (南芥智能)',
      hrefKey: 'sinapisAI',
      period: 'August 2026 – Present',
      icon: 'assets/icons/sinapisai.svg',
      details: [['Algorithm Intern']],
    },
  ]);
});

test('one education label can appear in Try asking and after identity with one counter', () => {
  const education = intents.find(({ id }) => id === 'education');
  const educationAnswer = answerForQuestion(education);
  const agent = createAgent({
    model,
    intents,
    answers,
    commonRepeatAnswers,
    typingDelay: 0,
    random: () => 0,
  });

  assert.ok(suggestionPlacements.tryAsking.includes(education.id));
  assert.ok(suggestionPlacements.followUps.identity_general.includes(education.id));
  assert.equal(education.answerId, 'education');

  const first = agent.selectAnswer(education.answerId);
  const second = agent.selectAnswer(education.answerId);
  assert.strictEqual(first.response, educationAnswer.variants[0]);
  assert.equal(first.isRepeatResponse, false);
  assert.strictEqual(second.response, commonRepeatAnswers[0]);
  assert.equal(second.isRepeatResponse, true);

  agent.startConversation();
  const freshConversation = agent.selectAnswer(education.answerId);
  assert.strictEqual(freshConversation.response, educationAnswer.variants[0]);
  assert.equal(freshConversation.isRepeatResponse, false);
});

test('publication overview exposes every paper and its resource actions', () => {
  const publicationsIntent = intents.find((intent) => intent.id === 'papers');
  assert.deepEqual(answerForQuestion(publicationsIntent).variants[0].blocks, [{ type: 'publications' }]);
  assert.ok(profile.publications.length > 0);
  profile.publications.forEach((publication) => {
    assert.ok(Array.isArray(publication.authors));
    assert.ok(publication.authors.includes(profile.publicationName));
    assert.ok(publicationTypes.includes(publication.type));
    assert.ok(Number.isInteger(publication.firstAuthorCount));
    assert.ok(publication.firstAuthorCount >= 1);
    assert.ok(publication.firstAuthorCount <= publication.authors.length);
    assert.equal('details' in publication, false);
    assert.doesNotMatch(publication.venue, /^\s*In\s*:/i);
    assert.ok(publication.venue.length > publication.venueShort.length);
    assert.deepEqual(Object.keys(publication.resources), [
      'pdf', 'code', 'poster', 'bib', 'official',
    ]);
    if (publication.resources.pdf && !publication.resources.pdf.startsWith('http')) {
      assert.ok(publication.resources.pdf.endsWith('/paper.pdf'));
    }
    if (publication.resources.code && !publication.resources.code.startsWith('http')) {
      assert.ok(publication.resources.code.endsWith('/code.zip'));
    }
    if (publication.resources.poster && !publication.resources.poster.startsWith('http')) {
      assert.ok(publication.resources.poster.endsWith('/poster.png'));
    }
    if (publication.resources.bib) {
      if (publication.resources.bib.startsWith('http')) {
        assert.match(publication.resources.bib, /^https?:\/\//);
      } else {
        assert.match(publication.resources.bib, /^@[a-z]+\{/i);
      }
    }
  });

  publicationRecords.forEach((publication) => {
    Object.values(publication.resources || {}).forEach((resource) => {
      assert.match(resource, /^https?:\/\//);
    });
  });

});

test('publication groups prioritize conference, journal, technical report, and preprint with newest papers first', () => {
  const groups = groupPublications([
    { id: 'preprint', type: 'preprint', year: '2027' },
    { id: 'conference-old', type: 'conference', year: '2025' },
    { id: 'journal', type: 'journal', year: '2028' },
    { id: 'conference-new', type: 'conference', year: '2027' },
    { id: 'conference-newer-in-json', type: 'conference', year: '2027' },
    { id: 'report-old', type: 'technical-report', year: '2025' },
    { id: 'report-new', type: 'technical-report', year: '2026' },
  ]);

  assert.deepEqual(groups.map(({ type }) => type), ['conference', 'journal', 'technical-report', 'preprint']);
  assert.deepEqual(
    groups[0].publications.map(({ id }) => id),
    ['conference-new', 'conference-newer-in-json', 'conference-old'],
  );
  assert.deepEqual(groups[2].publications.map(({ id }) => id), ['report-new', 'report-old']);
  assert.equal(getPublicationVenuePrefix('conference'), 'In: ');
  assert.equal(getPublicationVenuePrefix('journal'), 'In: ');
  assert.equal(getPublicationVenuePrefix('technical-report'), '');
  assert.equal(getPublicationVenuePrefix('preprint'), '');
});

test('publication groups prioritize owner author position, then newest year, using the full author list', () => {
  const owner = 'Test Owner';
  const papers = [
    { id: 'third-new', type: 'conference', year: '2028', authors: ['A', 'B', owner], authorDisplayCount: 1 },
    { id: 'first-old', type: 'conference', year: '2024', authors: [owner, 'A'] },
    { id: 'second-new', type: 'conference', year: '2027', authors: ['A', owner], firstAuthorCount: 2 },
    { id: 'first-new', type: 'conference', year: '2026', authors: [owner] },
    { id: 'first-tie', type: 'conference', year: '2026', authors: [owner, 'B'] },
    { id: 'second-old', type: 'conference', year: '2025', authors: ['B', owner] },
    { id: 'not-an-author', type: 'conference', year: '2030', authors: ['A'] },
    { id: 'journal-first', type: 'journal', year: '2031', authors: [owner] },
  ];
  const sourceOrder = papers.map(({ id }) => id);
  const groups = groupPublications(papers, owner);

  assert.deepEqual(groups.map(({ type }) => type), ['conference', 'journal']);
  assert.deepEqual(groups[0].publications.map(({ id }) => id), [
    'first-new', 'first-tie', 'first-old', 'second-new', 'second-old', 'third-new', 'not-an-author',
  ]);
  assert.deepEqual(papers.map(({ id }) => id), sourceOrder);
});

test('skills preserve configured order and icon metadata', () => {
  const skills = intents.find(({ id }) => id === 'skills');

  assert.deepEqual(profile.skills, profileContent.skills);
  assert.ok(skills.displayPrompts.length > 0);
  assert.ok(answerForQuestion(skills).variants[0].text.length > 0);
});

test('hobbies preserve configured items and details', () => {
  assert.deepEqual(profile.hobbies, profileContent.hobbies);
});

test('services load academic and teaching metadata from profile content', () => {
  const services = intents.find(({ id }) => id === 'services');

  assert.deepEqual(profile.services, profileContent.services);
  assert.ok(services.displayPrompts.length > 0);
  assert.ok(answerForQuestion(services).variants[0].text.length > 0);
});

test('correspondence loads configured address blocks and icons', () => {
  assert.deepEqual(profile.correspondence, profileContent.correspondence);
  assert.ok(profile.correspondence.every(({ icon }) => icon.endsWith('.svg')));
});

test('header contact and social data come from profile content', () => {
  assert.deepEqual(profile.emails, profileContent.emails);
  assert.deepEqual(profile.links, profileContent.links);
  assert.deepEqual(profile.socialProfiles, profileContent.socialProfiles);
});

test('sidebar affiliations preserve configured order', () => {
  assert.deepEqual(profile.affiliations, profileContent.affiliations);
});

test('does not emit an image unless the routed answer explicitly contains one', async () => {
  const agent = createAgent({
    model,
    intents,
    answers,
    typingDelay: 0,
    random: () => 0.5,
  });
  const events = [];
  for await (const event of agent.ask('你是谁？')) events.push(event);
  assert.ok(!events.some((event) => event.type === 'image'));
});

test('streams biography links as safe structured token metadata', async () => {
  const agent = createAgent({
    model,
    intents,
    answers,
    typingDelay: 0,
    random: () => 0.5,
  });
  const events = [];
  for await (const event of agent.ask('Who are you?')) events.push(event);

  const links = events
    .filter((event) => event.type === 'token' && event.link)
    .map((event) => event.link.href);
  const configuredLinks = answerForQuestion('identity_general').variants[0].content
    .filter(({ href }) => href)
    .map(({ href }) => href);
  assert.deepEqual([...new Set(links)], configuredLinks);
});

test('one portrait label can appear on both suggestion surfaces with one image response', () => {
  const portrait = intents.find(({ id }) => id === 'portrait');
  const portraitAnswer = answerForQuestion(portrait);
  const imageAnswers = answers
    .filter(({ variants }) => variants.some((variant) => Boolean(variant.image)))
    .map(({ id, variants }) => [id, variants[0].image.src, variants[0].image.fullSrc]);
  const configuredImageAnswers = answerContent.answers
    .filter(({ variants }) => variants.some(({ image }) => Boolean(image)))
    .map(({ id, variants }) => [id, variants[0].image.src, variants[0].image.fullSrc]);
  assert.deepEqual(imageAnswers, configuredImageAnswers);
  assert.ok(suggestionPlacements.tryAsking.includes(portrait.id));
  assert.ok(suggestionPlacements.followUps.identity_general.includes(portrait.id));
  assert.deepEqual(
    portrait.displayPrompts,
    questionContent.labels.find(({ id }) => id === 'portrait').displayPrompts,
  );
  assert.equal(portrait.answerId, 'portrait');
  assert.ok(portraitAnswer.variants[0].text.length > 0);
});

test('portrait uses one per-conversation answer count regardless of display surface', () => {
  const portrait = intents.find(({ id }) => id === 'portrait');
  const portraitAnswer = answerForQuestion(portrait);
  const agent = createAgent({
    model,
    intents,
    answers,
    commonRepeatAnswers,
    typingDelay: 0,
    random: () => 0,
  });

  const first = agent.selectAnswer(portrait.answerId);
  const second = agent.selectAnswer(portrait.answerId);
  assert.strictEqual(first.response, portraitAnswer.variants[0]);
  assert.equal(first.isRepeatResponse, false);
  assert.strictEqual(second.response, commonRepeatAnswers[0]);
  assert.equal(second.isRepeatResponse, true);

  agent.startConversation();
  const freshConversation = agent.selectAnswer(portrait.answerId);
  assert.strictEqual(freshConversation.response, portraitAnswer.variants[0]);
  assert.equal(freshConversation.isRepeatResponse, false);
});

test('uses a short image process and emits exactly one image for an image request', async () => {
  const agent = createAgent({
    model,
    intents,
    answers,
    typingDelay: 0,
    random: () => 0.5,
  });
  const events = [];
  for await (const event of agent.ask('给我看一张你的照片')) events.push(event);

  assert.equal(events.filter((event) => event.type === 'image-start').length, 1);
  assert.equal(events.filter((event) => event.type === 'image-progress').length, 1);
  assert.equal(events.filter((event) => event.type === 'image').length, 1);
  assert.equal(
    events.find((event) => event.type === 'image-start').value.src,
    'assets/photo.png',
  );
  assert.ok(!events.some((event) => event.type === 'blocks'));
});
