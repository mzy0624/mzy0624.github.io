import './styles/main.css';
import './styles/desktop.css';
import './styles/mobile.css';
import { AcademicAgent } from './api/academic-agent.js';
import { mount } from './api/dom.js';
import { deferredImageAssets, preloadImages } from './api/image-preloader.js';
import {
  dismissStartupLoader,
  markStartupAssetsReady,
  prepareStartupAssets,
  showStartupLoaderError,
  waitForCriticalDomImages,
} from './api/startup-loader.js';
import { createAcademicAgentApp } from './app.js';
import { answers, commonRepeatAnswers, labels } from './data/intents.js';
import { profile } from './data/profile.js';
import { suggestionPlacements } from './data/suggestion-placements.js';
import { createBrowserIntentModel } from './models/create-browser-intent-model.js';
import { DeterministicIntentModel } from './models/deterministic-intent-model.js';

async function bootstrap() {
  const startup = await prepareStartupAssets(profile);
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
  await waitForCriticalDomImages(startup.paths);
  markStartupAssetsReady();
  await dismissStartupLoader(document.getElementById('startup-loader'));

  // Only begin warming profile logos, answer icons, and portrait media after
  // every critical image has been painted and the startup layer is gone.
  void preloadImages(deferredImageAssets(profile, answers));
}

bootstrap().catch((error) => {
  showStartupLoaderError(document.getElementById('startup-loader'));
  console.error('Unable to initialize the academic Agent.', error);
});
