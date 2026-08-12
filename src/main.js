import './styles/main.css';
import './styles/desktop.css';
import './styles/mobile.css';
import { AcademicAgent } from './api/academic-agent.js';
import { mount } from './api/dom.js';
import { preloadProfileImages } from './api/image-preloader.js';
import { createAcademicAgentApp } from './app.js';
import { answers, commonRepeatAnswers, labels } from './data/intents.js';
import { profile } from './data/profile.js';
import { suggestionPlacements } from './data/suggestion-placements.js';
import { createBrowserIntentModel } from './models/create-browser-intent-model.js';
import { DeterministicIntentModel } from './models/deterministic-intent-model.js';

const deterministicFallback = new DeterministicIntentModel({
  intents: labels,
  fallbackId: 'unknown',
});
const model = createBrowserIntentModel({
  intents: labels,
  fallbackModel: deterministicFallback,
  siteBaseUrl: document.baseURI,
});

const agent = new AcademicAgent({
  model,
  intents: labels,
  answers,
  suggestionPlacements,
  commonRepeatAnswers,
});
const app = createAcademicAgentApp({ agent, profile });

mount(document.getElementById('app'), app);
preloadProfileImages(profile);
