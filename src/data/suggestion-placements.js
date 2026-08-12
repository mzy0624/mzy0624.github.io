export const suggestionPlacements = Object.freeze({
  tryAsking: Object.freeze([
    'portrait',
    'identity_general',
    'education',
    'research',
    'papers',
    'skills',
    'hobbies',
    'services',
    'correspondence',
  ]),

  initialTryAsking: Object.freeze([
    'identity_general',
    'research',
    'papers',
  ]),

  followUps: Object.freeze({
    identity_general: Object.freeze([
      'identity_contact',
      'portrait',
      'education',
    ]),
    research: Object.freeze([
      'learnware',
      'model_capability_mining',
    ]),
  }),
});
