const definitions = {
  portrait: [
    'Can you show me a photo of yourself?',
    'What do you look like?',
    'May I see your picture?',
    'Show me a photograph of yourself.',
    'Could you share a photo of you?',
    'Let me see what you look like.',
    'Is there a photograph of you?',
    'Show me what you look like.',
  ],

  identity_general: [
    'Who are you?',
    'Could you introduce yourself?',
    'Tell me a little about yourself.',
    'Give me a brief introduction to who you are.',
    'How would you describe yourself?',
    'What should I know about you?',
    'Can I get a short introduction?',
    'Please introduce yourself.',
  ],

  identity_contact: [
    'How can I contact you?',
    'What is the best way to reach you?',
    'Which email address should I use to contact you?',
    'Could you share your email addresses?',
    'How may I get in touch with you?',
    'Where can I send you an email?',
    'What are your contact emails?',
    'How should someone contact you online?',
  ],

  education: [
    'Tell me about your education.',
    'What is your educational background?',
    'Could you summarize your academic journey?',
    'Walk me through your education history.',
    'Could you describe your academic training?',
  ],

  research: [
    'What are your research interests?',
    'Which research areas do you focus on?',
    'What topics are you currently researching?',
    'Could you describe your research direction?',
    'What fields does your research cover?',
    'What is the main focus of your Ph.D. research?',
    'Tell me about your research interests.',
  ],

  learnware: [
    'What is the Learnware Paradigm?',
    'Could you explain the Learnware Paradigm?',
    'What does learnware mean?',
    'How would you describe learnware?',
    'What problem is the Learnware Paradigm trying to solve?',
    'Can you give me an introduction to learnware?',
    'What is the basic idea behind learnware?',
    'Why is the Learnware Paradigm useful?',
  ],

  model_capability_mining: [
    'What is Model Capability Mining?',
    'Could you explain Model Capability Mining?',
    'What does Model Capability Mining mean?',
    'How would you define Model Capability Mining?',
    'Can you give me an introduction to Model Capability Mining?',
    'What is the basic idea behind Model Capability Mining?',
  ],

  papers: [
    'How about your publications?',
    'What papers have you published?',
    'Could you show me your publication list?',
    'Tell me about your published work.',
    'Which research papers are on your website?',
    'Can I see your academic publications?',
    'What are your recent papers?',
    'Please list your publications.',
    'Have you published any papers?',
    'What are your recent publications?',
    'What is your latest paper?',
  ],

  skills: [
    'What technical skills do you have?',
    'What are your technical skills?',
    'Which development tools do you know?',
    'Tell me about your technical abilities.',
    'Do you have any technical skills?',
  ],

  hobbies: [
    'What are your hobbies?',
    'What do you enjoy outside research?',
    'How do you spend your free time?',
    'Could you tell me about your personal interests?',
    'What activities do you enjoy beyond academics?',
    'Tell me about your favorite pastimes.',
    'Tell me what you do when you are not researching.',
    'Do you have any hobbies?',
  ],

  services: [
    'What academic service have you done?',
    'Could you describe your academic service experience?',
    'What academic duties have you taken on?',
  ],

  internship: [
    'How about your internship experience?',
    'Tell me which internships you have completed.',
    'Could you describe your internship experience?',
    'Where have you interned?',
    'Describe your experience working as an intern.',
    'What is your internship background?',
    'Summarize your industry internship experience.',
    'Tell me about your internship history.',
    'Do you have any internship experience?',
  ],

  correspondence: [
    'What is your correspondence address?',
    'Where should physical mail be sent to you?',
    'What is your mailing address?',
    'Could you provide your laboratory address?',
    'Where is your office or laboratory located?',
    'What address should I use for correspondence?',
    'Can you give me your postal address?',
    'Where can official mail be delivered to you?',
  ],

  unknown: [],
};

export const labelQuestions = Object.freeze(Object.fromEntries(
  Object.entries(definitions).map(([labelId, questions]) => [
    labelId,
    Object.freeze(questions),
  ]),
));
