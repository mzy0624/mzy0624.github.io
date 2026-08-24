#!/usr/bin/env node

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const contentRoot = path.join(projectRoot, 'content');
const publicRoot = path.join(projectRoot, 'public');

async function readJson(filename) {
  const location = path.join(contentRoot, filename);
  try {
    return JSON.parse(await readFile(location, 'utf8'));
  } catch (error) {
    throw new Error(`${filename}: ${error.message}`);
  }
}

const [
  site,
  profile,
  answerContent,
  questionContent,
  publications,
  boundaries,
  evaluationSource,
  questionBank,
] = await Promise.all([
  readJson('site.json'),
  readJson('profile.json'),
  readJson('answers.json'),
  readJson('questions.json'),
  readJson('publications.json'),
  readJson('router/label-boundaries.json'),
  readJson('router/routing-evaluation-source.json'),
  readJson('router/question-bank.json'),
]);

const errors = [];
const assetPaths = new Set();
const fail = (message) => errors.push(message);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const requireText = (value, field) => {
  if (!isText(value)) fail(`${field} must be a non-empty string.`);
};
const requireArray = (value, field) => {
  if (!Array.isArray(value)) fail(`${field} must be an array.`);
};
const addAsset = (value, field) => {
  if (!isText(value)) {
    fail(`${field} must be a non-empty asset path.`);
    return;
  }
  if (/^https?:\/\//i.test(value)) return;
  if (!value.startsWith('assets/')) {
    fail(`${field} must begin with "assets/" or use an http(s) URL.`);
    return;
  }
  assetPaths.add(value);
};

if (site.schemaVersion !== 1) fail('site.schemaVersion must be 1.');
requireText(site.owner?.name, 'site.owner.name');
requireText(site.owner?.publicationName, 'site.owner.publicationName');
requireText(site.agentName, 'site.agentName');
requireText(site.pageTitle, 'site.pageTitle');
requireText(site.description, 'site.description');
requireText(site.composerPlaceholder, 'site.composerPlaceholder');
requireText(site.startupLoading?.text, 'site.startupLoading.text');
requireText(site.startupLoading?.errorText, 'site.startupLoading.errorText');
requireText(site.startupLoading?.cookieName, 'site.startupLoading.cookieName');
requireText(site.startupLoading?.cookieVersion, 'site.startupLoading.cookieVersion');
if (!Number.isInteger(site.startupLoading?.cookieMaxAgeDays) || site.startupLoading.cookieMaxAgeDays < 1) {
  fail('site.startupLoading.cookieMaxAgeDays must be a positive integer.');
}
if (typeof site.identityAffiliationLogos !== 'boolean') {
  fail('site.identityAffiliationLogos must be a boolean.');
}
if (!Number.isInteger(site.copyrightStartYear)) {
  fail('site.copyrightStartYear must be an integer.');
}
requireArray(site.heroGreetings, 'site.heroGreetings');
site.heroGreetings?.forEach((greeting, index) => requireText(greeting, `site.heroGreetings[${index}]`));
addAsset(site.assets?.avatar, 'site.assets.avatar');
addAsset(site.assets?.profileLink, 'site.assets.profileLink');
addAsset(site.assets?.externalLink, 'site.assets.externalLink');
if (site.sourceRepository?.enabled) {
  requireText(site.sourceRepository.ariaLabel, 'site.sourceRepository.ariaLabel');
  requireText(site.sourceRepository.url, 'site.sourceRepository.url');
  requireText(site.sourceRepository.tooltip, 'site.sourceRepository.tooltip');
  const easterEgg = site.sourceRepository.easterEgg;
  if (easterEgg?.enabled) {
    requireText(easterEgg.message, 'site.sourceRepository.easterEgg.message');
    if (!Number.isInteger(easterEgg.delayMs) || easterEgg.delayMs < 500) {
      fail('site.sourceRepository.easterEgg.delayMs must be an integer of at least 500.');
    }
  }
}

requireArray(profile.emails, 'profile.emails');
profile.emails?.forEach((email, index) => {
  requireText(email.label, `profile.emails[${index}].label`);
  requireText(email.address, `profile.emails[${index}].address`);
  addAsset(email.icon, `profile.emails[${index}].icon`);
});
requireArray(profile.affiliations, 'profile.affiliations');
profile.affiliations?.forEach((affiliation, index) => {
  requireText(affiliation.name, `profile.affiliations[${index}].name`);
  requireText(affiliation.url, `profile.affiliations[${index}].url`);
  addAsset(affiliation.logo, `profile.affiliations[${index}].logo`);
});

const links = profile.links ?? {};
if (!profile.links || typeof profile.links !== 'object' || Array.isArray(profile.links)) {
  fail('profile.links must be an object.');
}
requireArray(profile.socialProfiles, 'profile.socialProfiles');
profile.socialProfiles?.forEach((social, index) => {
  if (!isText(links[social.hrefKey])) {
    fail(`profile.socialProfiles[${index}].hrefKey references missing link "${social.hrefKey}".`);
  }
  addAsset(social.icon, `profile.socialProfiles[${index}].icon`);
});
requireArray(profile.education, 'profile.education');
profile.education?.forEach((education, index) => {
  addAsset(education.icon, `profile.education[${index}].icon`);
  education.details?.flat().forEach((part) => {
    if (part?.hrefKey && !isText(links[part.hrefKey])) {
      fail(`profile.education[${index}] references missing link "${part.hrefKey}".`);
    }
  });
});
requireArray(profile.skills, 'profile.skills');
profile.skills?.forEach((skill, index) => addAsset(skill.icon, `profile.skills[${index}].icon`));
requireArray(profile.hobbies, 'profile.hobbies');
profile.hobbies?.forEach((hobby, index) => addAsset(hobby.icon, `profile.hobbies[${index}].icon`));
requireArray(profile.services?.academic, 'profile.services.academic');
profile.services?.academic?.forEach((service, index) => (
  addAsset(service.icon, `profile.services.academic[${index}].icon`)
));
requireArray(profile.services?.teachingAssistants, 'profile.services.teachingAssistants');
profile.services?.teachingAssistants?.forEach((service, index) => (
  addAsset(service.icon, `profile.services.teachingAssistants[${index}].icon`)
));
requireArray(profile.correspondence, 'profile.correspondence');
profile.correspondence?.forEach((entry, index) => {
  requireText(entry.title, `profile.correspondence[${index}].title`);
  requireArray(entry.lines, `profile.correspondence[${index}].lines`);
  addAsset(entry.icon, `profile.correspondence[${index}].icon`);
});

requireArray(answerContent.answers, 'answers.answers');
requireArray(answerContent.commonRepeatAnswers, 'answers.commonRepeatAnswers');
const answerIds = new Set();
answerContent.answers?.forEach((answer, index) => {
  requireText(answer.id, `answers.answers[${index}].id`);
  if (answerIds.has(answer.id)) fail(`Duplicate answer id "${answer.id}".`);
  answerIds.add(answer.id);
  if (!Array.isArray(answer.variants) || answer.variants.length === 0) {
    fail(`Answer "${answer.id}" must have at least one variant.`);
  }
  answer.variants?.forEach((variant, variantIndex) => {
    requireText(variant.text, `answer ${answer.id} variant ${variantIndex}.text`);
    if (variant.image) {
      addAsset(variant.image.src, `answer ${answer.id} variant ${variantIndex}.image.src`);
      if (variant.image.fullSrc) {
        addAsset(variant.image.fullSrc, `answer ${answer.id} variant ${variantIndex}.image.fullSrc`);
      }
    }
  });
});

requireArray(questionContent.labels, 'questions.labels');
const labelIds = new Set();
const routingAliases = new Map();
questionContent.labels?.forEach((label, index) => {
  requireText(label.id, `questions.labels[${index}].id`);
  if (labelIds.has(label.id)) fail(`Duplicate label id "${label.id}".`);
  labelIds.add(label.id);
  if (!answerIds.has(label.answerId)) {
    fail(`Label "${label.id}" references missing answer "${label.answerId}".`);
  }
  requireArray(label.displayPrompts, `label ${label.id}.displayPrompts`);
  requireArray(label.questions, `label ${label.id}.questions`);
  requireArray(label.keywords, `label ${label.id}.keywords`);
  if (label.routingAliases !== undefined) {
    requireArray(label.routingAliases, `label ${label.id}.routingAliases`);
    label.routingAliases?.forEach((alias, aliasIndex) => {
      requireText(alias, `label ${label.id}.routingAliases[${aliasIndex}]`);
      if (!isText(alias)) return;
      const normalizedAlias = alias
        .normalize('NFKC')
        .toLocaleLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[.!?。！？]+$/u, '')
        .trim();
      const existingLabel = routingAliases.get(normalizedAlias);
      if (existingLabel) {
        fail(`Routing alias "${alias}" is shared by labels "${existingLabel}" and "${label.id}".`);
      } else {
        routingAliases.set(normalizedAlias, label.id);
      }
    });
  }
  requireArray(label.trainingQuestions?.en, `label ${label.id}.trainingQuestions.en`);
  requireArray(label.trainingQuestions?.zh, `label ${label.id}.trainingQuestions.zh`);
  if (label.id !== 'unknown') {
    if (label.trainingQuestions?.en?.length < 12) {
      fail(`Label "${label.id}" requires at least 12 English training questions.`);
    }
    if (label.trainingQuestions?.zh?.length < 10) {
      fail(`Label "${label.id}" requires at least 10 Chinese training questions.`);
    }
  }
});
requireText(questionContent.datasetSeed, 'questions.datasetSeed');
requireArray(questionContent.nearScopePrompts, 'questions.nearScopePrompts');
questionContent.nearScopePrompts?.forEach((pair, index) => {
  requireText(pair.en, `questions.nearScopePrompts[${index}].en`);
  requireText(pair.zh, `questions.nearScopePrompts[${index}].zh`);
});

const placements = questionContent.suggestionPlacements ?? {};
[
  ...(placements.tryAsking ?? []),
  ...(placements.initialTryAsking ?? []),
  ...Object.values(placements.followUps ?? {}).flat(),
].forEach((labelId) => {
  if (!labelIds.has(labelId)) fail(`Suggestion placement references missing label "${labelId}".`);
});
Object.keys(placements.followUps ?? {}).forEach((labelId) => {
  if (!labelIds.has(labelId)) fail(`Follow-up parent references missing label "${labelId}".`);
});

const knownLabelIds = [...labelIds].filter((labelId) => labelId !== 'unknown').sort();
const boundaryLabelIds = (boundaries.labels ?? []).map(({ labelId }) => labelId).sort();
if (JSON.stringify(knownLabelIds) !== JSON.stringify(boundaryLabelIds)) {
  fail('router/label-boundaries.json must cover every known label exactly once.');
}
for (const section of ['positive', 'hardNegative']) {
  const sourceLabelIds = Object.keys(evaluationSource[section] ?? {}).sort();
  if (JSON.stringify(knownLabelIds) !== JSON.stringify(sourceLabelIds)) {
    fail(`router/routing-evaluation-source.json ${section} must cover every known label.`);
  }
}
requireArray(evaluationSource.broadUnknown, 'router.routing-evaluation-source.broadUnknown');
const prototypeLabelIds = (questionBank.labels ?? []).map(({ labelId }) => labelId).sort();
if (JSON.stringify(knownLabelIds) !== JSON.stringify(prototypeLabelIds)) {
  fail('router/question-bank.json must cover every known label exactly once.');
}
questionBank.labels?.forEach(({ labelId, questions: prototypes }) => {
  if (!Array.isArray(prototypes) || prototypes.length === 0) {
    fail(`router/question-bank.json label "${labelId}" requires prototypes.`);
  }
});

requireArray(publications, 'publications');
const publicationIds = new Set();
publications?.forEach((publication, index) => {
  requireText(publication.id, `publications[${index}].id`);
  requireText(publication.title, `publications[${index}].title`);
  requireText(publication.type, `publications[${index}].type`);
  requireText(publication.venue, `publications[${index}].venue`);
  requireText(publication.venueShort, `publications[${index}].venueShort`);
  if (publicationIds.has(publication.id)) fail(`Duplicate publication id "${publication.id}".`);
  publicationIds.add(publication.id);
  if (!publication.authors?.includes(site.owner.publicationName)) {
    fail(`Publication "${publication.id}" must include site.owner.publicationName in authors.`);
  }
});

await Promise.all([...assetPaths].map(async (assetPath) => {
  const file = path.join(publicRoot, assetPath);
  if (!(await stat(file).catch(() => null))?.isFile()) fail(`Missing asset: public/${assetPath}`);
}));

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Content is valid: ${labelIds.size} labels, ${answerIds.size} answers, ${publications.length} publication(s), ${assetPaths.size} assets.`);
}
