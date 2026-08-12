import test from 'node:test';
import assert from 'node:assert/strict';
import { intents } from '../src/data/intents.js';
import { IntentModel } from '../src/models/intent-model.js';
import {
  DeterministicIntentModel,
  normalizePrompt,
} from '../src/models/deterministic-intent-model.js';

const model = new DeterministicIntentModel({
  intents,
  fallbackId: 'unknown',
});

test('defines an explicit model interface', async () => {
  const abstractModel = new IntentModel({ id: 'abstract-test', intents, fallbackId: 'unknown' });
  await assert.rejects(() => abstractModel.predict('hello'), /must implement predict/);
});

test('normalizes full-width and mixed-case input', () => {
  assert.equal(normalizePrompt('  ＷＨＯ  ARE You?  '), 'who are you?');
});

test('routes a Chinese identity question', async () => {
  const result = await model.predict('你是谁？');
  assert.equal(result.intent.id, 'identity_general');
  assert.equal(result.answerId, 'identity_general');
  assert.equal(result.modelId, 'deterministic-keyword-v1');
});

test('uses answer ids as classification labels without question levels', () => {
  const prediction = model.predictionForAnswer('education', {
    confidence: 0.91,
    source: 'trained-classifier',
  });

  assert.equal(prediction.answerId, 'education');
  assert.equal(prediction.intentId, 'education');
  assert.equal(prediction.intent.id, 'education');
  assert.equal(prediction.source, 'trained-classifier');
  assert.deepEqual(
    new Set(model.getIntentsByAnswerId('education').map(({ id }) => id)),
    new Set(['education']),
  );
});

test('routes the identity contact follow-up in English and Chinese', async () => {
  for (const prompt of ['How can I contact you?', '我该如何联系你？']) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'identity_contact', prompt);
  }
});

test('removed identity-specific questions fall back to unknown', async () => {
  const cases = [
    'Who is your Ph.D. supervisor?',
    'What is your full name?',
    'What is your Chinese name?',
    'Which university are you studying at?',
    'Where are you currently based?',
  ];

  for (const prompt of cases) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'unknown', prompt);
  }
});

test('routes an English publication question', async () => {
  const result = await model.predict('Could you show me your papers?');
  assert.equal(result.intent.id, 'papers');
});

test('routes internship questions to an independent internship answer', async () => {
  for (const prompt of [
    'What internships have you completed?',
    'Do you have internship experience?',
    '你做过哪些实习？',
  ]) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'internship', prompt);
    assert.equal(result.answerId, 'internship', prompt);
  }
  assert.deepEqual(
    new Set(model.getIntentsByAnswerId('unknown').map(({ id }) => id)),
    new Set(['unknown']),
  );
});

test('uses fallback for an unrelated question', async () => {
  const result = await model.predict('What is the weather today?');
  assert.equal(result.intent.id, 'unknown');
});

test('applies label-specific boundaries to general Yes/No questions', async () => {
  const routedCases = [
    ['Do you have any technical skills?', 'skills'],
    ['Have you published any papers?', 'papers'],
    ['Do you have internship experience?', 'internship'],
    ['Do you have any hobbies?', 'hobbies'],
  ];

  for (const [prompt, expectedIntentId] of routedCases) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, expectedIntentId, prompt);
  }

  const identityFact = await model.predict('Are you a member of the LAMDA Group?');
  assert.equal(identityFact.intent.id, 'unknown');
});

test('is deterministic for identical prompts', async () => {
  const first = await model.predict('介绍一下你自己');
  const second = await model.predict('介绍一下你自己');
  assert.deepEqual(first, second);
});

test('accepts a known suggestion as a model hint', async () => {
  const result = await model.predict('Show me your papers', { hintIntentId: 'papers' });
  assert.equal(result.intent.id, 'papers');
  assert.equal(result.source, 'deterministic-hint');
});

test('prioritizes an explicit image request over general identity wording', async () => {
  const result = await model.predict('Who are you? Show me a photo.');
  assert.equal(result.intent.id, 'portrait');
});

const researchCases = [
  ['What are your research interests?', 'research'],
  ['你的研究方向是什么？', 'research'],
  ['What is the Learnware Paradigm?', 'learnware'],
  ['什么是 Learnware？', 'learnware'],
  ['What is Model Capability Mining?', 'model_capability_mining'],
  ['什么是模型能力挖掘？', 'model_capability_mining'],
];

test('routes every selected research sub-intent', async () => {
  for (const [prompt, expectedIntentId] of researchCases) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, expectedIntentId, prompt);
  }
});

test('keeps publications as one overview intent', async () => {
  assert.deepEqual(
    intents.filter(({ id }) => id === 'papers' || id.startsWith('paper_')).map(({ id }) => id),
    ['papers'],
  );

  for (const prompt of ['How about your publications?', '介绍一下你的论文']) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'papers', prompt);
  }
});

test('routes the selected skills question in English and Chinese', async () => {
  for (const prompt of ['What technical skills do you have?', '你掌握哪些技能？']) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'skills', prompt);
  }
});

test('routes hobbies to one overview intent without sub-intents', async () => {
  assert.deepEqual(intents.filter(({ id }) => id.startsWith('hobbies')).map(({ id }) => id), ['hobbies']);
  for (const prompt of ['What are your hobbies?', '你有哪些兴趣爱好？']) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'hobbies', prompt);
  }
});

test('routes academic service to one overview intent', async () => {
  assert.deepEqual(intents.filter(({ id }) => id.startsWith('services')).map(({ id }) => id), ['services']);
  for (const prompt of ['What academic service have you done?', '你有哪些学术服务经历？']) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'services', prompt);
  }
});

test('routes correspondence to one overview intent', async () => {
  assert.deepEqual(
    intents.filter(({ id }) => id.startsWith('correspondence')).map(({ id }) => id),
    ['correspondence'],
  );
  for (const prompt of ['What is your correspondence address?', '你的联系地址是什么？']) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'correspondence', prompt);
  }
});

test('every known label has English-only synonymous question variants', () => {
  const knownLabels = intents.filter(({ id }) => id !== 'unknown');
  const unknown = intents.find(({ id }) => id === 'unknown');
  const knownQuestions = knownLabels.flatMap(({ questions }) => questions);

  assert.equal(knownLabels.length, 13);
  assert.equal(knownQuestions.length, 94);
  assert.ok(knownLabels.every(({ questions }) => questions.length >= 3));
  assert.ok(knownLabels.every(({ questions }) => questions.some((item) => /[a-z]/i.test(item))));
  assert.ok(knownQuestions.every((item) => !/[\u3400-\u9fff]/u.test(item)));
  assert.deepEqual(unknown.questions, []);
});

test('routes every synonymous question variant to its owning label', async () => {
  for (const label of intents.filter(({ id }) => id !== 'unknown')) {
    for (const question of label.questions) {
      const result = await model.predict(question);
      assert.equal(result.intent.id, label.id, `${label.id}: ${question}`);
    }
  }
});

test('display prompts remain English-only', () => {
  assert.ok(intents.every(({ displayPrompts }) => (
    displayPrompts.every((item) => !/[\u3400-\u9fff]/u.test(item))
  )));
});

test('identity display prompts are English while Chinese remains route-only', () => {
  assert.deepEqual(
    intents.find(({ id }) => id === 'identity_general').displayPrompts,
    ['Who are you?', 'Introduce yourself.'],
  );
  assert.ok(intents.find(({ id }) => id === 'identity_general').keywords.includes('你是谁'));
});

test('keeps education as one overview intent', async () => {
  assert.deepEqual(
    intents.filter(({ id }) => id === 'education' || id.startsWith('education_')).map(({ id }) => id),
    ['education'],
  );

  for (const prompt of [
    'Tell me about your education.',
    'How about your education?',
    '介绍一下你的教育经历',
  ]) {
    const result = await model.predict(prompt);
    assert.equal(result.intent.id, 'education', prompt);
  }
});
