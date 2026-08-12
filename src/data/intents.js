import { labelQuestions } from './label-questions.js';
import { profile } from './profile.js';

const linked = (text, href) => ({ text, href });
const segment = (text) => ({ text });

function richAnswer(...content) {
  const normalized = content.map((item) => (typeof item === 'string' ? segment(item) : item));
  return {
    text: normalized.map((item) => item.text).join(''),
    content: normalized,
    blocks: [],
  };
}

function plainAnswer(text, blocks = []) {
  return { text, blocks };
}

function weightedPlainAnswer(text, samplingWeight) {
  return { ...plainAnswer(text), samplingWeight };
}

const links = profile.links;

export const commonRepeatAnswers = Object.freeze([
  plainAnswer("Didn't you ask me that already? 🤔"),
  plainAnswer("I've already answered this quite a few times 😠"),
]);

const portraitKeywords = Object.freeze([
  'photo', 'picture', 'image', 'portrait', 'what do you look like',
  '照片', '图片', '相片', '长什么样', '看看你', '看一下你',
]);

const portraitAnswer = Object.freeze({
  text: 'This photo captures me singing in front of an audience of several hundred at Nanjing University Xianlin Campus on May 11, 2025.',
  image: Object.freeze({
    src: 'assets/photo.png',
    fullSrc: 'assets/photo-original.jpg',
    alt: 'Portrait of Zi-Yu Mao',
  }),
  blocks: Object.freeze([]),
});

const portraitQuestion = Object.freeze({
  answerId: 'portrait',
  priority: 10,
  displayPrompts: Object.freeze(['Show me a photo of you']),
  keywords: portraitKeywords,
  answer: portraitAnswer,
});

const educationKeywords = Object.freeze([
  'tell me about your education', 'how about your education',
  'educational background', 'academic background',
  'academic journey', 'academic timeline', 'summarize your education',
  'where did you receive your education', 'education experience',
  '教育经历', '学术经历', '教育背景', '本科和博士', '学历经历',
]);

const educationAnswer = plainAnswer(
  'Here is my educational background.',
  [{ type: 'education' }],
);

const educationQuestion = Object.freeze({
  answerId: 'education',
  priority: 1,
  displayPrompts: Object.freeze([
    'Tell me about your education',
    'How about your education?',
  ]),
  keywords: educationKeywords,
  answer: educationAnswer,
});

const unknownAnswerVariants = Object.freeze([
  weightedPlainAnswer(
    "I don't know enough to answer that reliably. You could try asking about my academic background, research, publications, skills, or hobbies instead.",
    10,
  ),
  weightedPlainAnswer(
    "I'm not sure about that. My current knowledge is limited to the information included in this academic profile.",
    10,
  ),
  weightedPlainAnswer(
    "I don't have a reliable answer to that. Please try a question about my research or academic experience.",
    10,
  ),
  plainAnswer('My Martian-to-Earth translator returned nothing but static 📡, so I have nothing useful to tell you 👽.'),
  plainAnswer('That one is beyond me, but would you like some water? I can pour you a glass. 💧'),
  plainAnswer('The answer escaped while I stopped to pet a cat 🐈, and I have no idea where it went.'),
  plainAnswer('You have reached the blank part of my brain; would you like some tomato-and-egg stir-fry 🍅🍳 instead?'),
  plainAnswer('A suspiciously confident pigeon 🐦 appears to know more about that than I do.'),
  plainAnswer('My last remaining brain cell is still compiling ⏳, so no answer has come back.'),
  plainAnswer('The answer may be hiding behind the sofa 🛋️, because it certainly is not in my head.'),
  plainAnswer('That question has left me completely blank; would a cookie 🍪 improve the situation?'),
  plainAnswer('The Moon declined to comment 🌙, and I have nothing more informative to add.'),
  plainAnswer('My rubber duck 🐤 is reviewing the question, but neither of us has found an answer.'),
  plainAnswer('A cat 🐈 walked across my keyboard ⌨️  and deleted whatever answer I might have had.'),
  plainAnswer('Cosmic rays ☄️  appear to have erased that knowledge before it reached me.'),
  plainAnswer('I consulted the tomatoes 🍅, but they were every bit as clueless as I am.'),
  plainAnswer('Someone wearing a cape 🦸 would have a much better chance of answering that than I do.'),
  plainAnswer('My hamster 🐹 is on a tea break ☕, so the knowledge desk is currently unattended.'),
  plainAnswer('The answer cupboard is empty, but please accept this emergency cup of tea ☕.'),
  plainAnswer('The answer missed its train 🚆 and will not be arriving in my brain today.'),
  plainAnswer('A tiny committee of squirrels 🐿️ requested more evidence, so I have reached no conclusion.'),
  plainAnswer('The oracle is out for lunch 🍱, and I do not have a substitute answer.'),
  plainAnswer('My crystal ball is installing updates 🔮, so I cannot retrieve an answer right now.'),
]);

const labelDefinitions = [
  {
    ...portraitQuestion,
    id: 'portrait',
    icon: '📸',
    iconType: 'emoji',
  },

  // Identity: general introduction
  {
    id: 'identity_general',
    displayPrompts: ['Who are you?', 'Introduce yourself.'],
    icon: '🧑🏻‍💻',
    iconType: 'emoji',
    keywords: [
      'who are you', 'introduce yourself', 'tell me about yourself',
      'brief introduction', 'what do you currently do', 'current academic position',
      'student or a researcher', 'student or researcher', 'about you',
      '你是谁', '介绍一下你自己', '介绍自己', '个人简介', '你现在是做什么的',
    ],
    answer: richAnswer(
      "I'm Zi-Yu Mao (毛子钰), a third-year Ph.D. student at the ",
      linked('School of Artificial Intelligence', links.schoolAI),
      ', ',
      linked('Nanjing University', links.nju),
      ', and a member of the ',
      linked('LAMDA Group', links.lamda),
      ', led by Professor ',
      linked('Zhi-Hua Zhou', links.zhiHuaZhou),
      '. I conduct my doctoral research under the supervision of Professor ',
      linked('Ming Li', links.mingLi),
      '.',
    ),
  },
  {
    id: 'identity_contact',
    priority: 6,
    prompt: 'How can I contact you?',
    keywords: [
      'how can i contact you', 'how do i contact you',
      'how can i reach you', 'how do i reach you',
      'what is your email', 'what is your email address',
      'your email address', 'email you',
      '我该如何联系你', '如何联系你', '怎么联系你', '怎样联系你',
      '怎么和你联系', '你的邮箱是什么', '你的电子邮箱', '邮箱地址',
    ],
    answer: plainAnswer(
      'You can reach me at any of the following email addresses:',
      [{ type: 'emails' }],
    ),
  },
  // Education overview
  {
    ...educationQuestion,
    id: 'education',
    icon: '📚',
    iconType: 'emoji',
  },
  // Research, publications, skills, life, and contact
  {
    id: 'research',
    prompt: 'What are your research interests?',
    icon: '🔬',
    iconType: 'emoji',
    keywords: [
      'what are your research interests', 'what do you research',
      'what are your research areas', 'research interests', 'research direction',
      'your research', 'research areas', 'research',
      '你的研究方向是什么', '你主要研究什么', '研究兴趣', '研究方向', '研究领域',
      '研究', '方向', '课题',
    ],
    answer: {
      ...richAnswer(
        'My research interests include ',
        { text: 'Machine Learning', strong: true },
        ' and ',
        { text: 'Data Mining', strong: true },
        ', especially:',
      ),
      blocks: [{
        type: 'emphasisList',
        items: ['Learnware Paradigm', 'Model Capability Mining'],
      }],
    },
  },
  {
    id: 'learnware',
    prompt: 'What is the Learnware Paradigm?',
    keywords: [
      'what is the learnware paradigm', 'what is learnware', 'explain learnware',
      'learnware paradigm', 'learnwares', 'learnware', 'reusable model',
      '什么是 learnware paradigm', '什么是 learnware', '解释一下 learnware',
      'learnware 是什么', '学件范式', '学件', '模型复用',
    ],
    answer: {
      ...richAnswer(
        'The ',
        { text: 'Learnware Paradigm', strong: true },
        ' provides a framework for turning well-trained models into reusable and composable units. Each learnware pairs a ',
        { text: 'model', strong: true },
        ' with a ',
        { text: 'specification', strong: true },
        ' that characterizes, organizes, and identifies its capabilities for reuse and collaboration on new tasks. As more learnwares join and interact within the system, their capabilities can be continually composed and evolved, enabling the system to solve problems that no single model could handle alone.',
      ),
      blocks: [{
        type: 'statement',
        position: 'before',
        text: 'Learnware = Model + Specification',
        strong: true,
        centered: true,
      }],
    },
  },
  {
    id: 'model_capability_mining',
    prompt: 'What is Model Capability Mining?',
    keywords: [
      'what is model capability mining', 'explain model capability mining',
      'model capability mining', 'mining model capabilities',
      '什么是 model capability mining', '解释 model capability mining',
      '模型能力挖掘',
    ],
    answer: richAnswer(
      { text: 'Model Capability Mining', strong: true },
      ' studies how to discover, understand, characterize, and represent the ',
      { text: 'abstract, latent, and high-dimensional functional capabilities', strong: true },
      ' manifested by trained models through their behavior across different data and tasks, revealing what each model can do, where it may be useful, and how its capabilities relate to those of other models. The resulting capability representations can serve as specifications in the ',
      { text: 'Learnware Paradigm', strong: true },
      ', enabling models to be organized, identified, reused, and composed for new tasks.',
    ),
  },
  {
    id: 'papers',
    prompt: 'How about your publications?',
    icon: '📑',
    iconType: 'emoji',
    keywords: [
      'how about your publications', 'what papers have you published',
      'show me your papers', 'show your publications', 'list your papers',
      'your publications', 'your papers', 'publication list', 'published work',
      'papers', 'publications', 'paper', 'publication',
      '你的论文有哪些', '介绍一下你的论文', '列出你的论文', '论文列表',
      '论文情况', '你的论文', '学术成果', '论文', '发表', '文章', '成果',
    ],
    answer: plainAnswer(
      'Here are the publications currently listed on my website.',
      [{ type: 'publications' }],
    ),
  },
  {
    id: 'skills',
    prompt: 'What technical skills do you have?',
    icon: '🔧',
    iconType: 'emoji',
    keywords: [
      'what skills do you have', 'what are your skills', 'show me your skills',
      'what is in your toolkit', 'your toolkit', 'technical skills',
      'programming skills', 'skill', 'skills', 'toolkit', 'programming',
      '你掌握哪些技能', '你会哪些技能', '你有什么技能', '展示你的技能',
      '技能', '技术栈', '编程能力', '会什么',
    ],
    answer: plainAnswer(
      'Here are some of my technical skills.',
      [{ type: 'skills' }],
    ),
  },
  {
    id: 'hobbies',
    prompt: 'What are your hobbies?',
    icon: '🪄',
    iconType: 'emoji',
    keywords: [
      'what are your hobbies', 'tell me about your hobbies', 'show me your hobbies',
      'what do you do beyond research', 'what do you do in your free time',
      'your hobbies', 'hobby', 'hobbies', 'free time', 'outside research',
      '你有哪些兴趣爱好', '介绍一下你的爱好', '你的爱好是什么',
      '平时喜欢做什么', '兴趣', '爱好', '业余', '平时做什么',
    ],
    answer: plainAnswer(
      'Beyond research, these are the hobbies currently listed on my website.',
      [{ type: 'hobbies' }],
    ),
  },
  {
    id: 'services',
    prompt: 'What academic service have you done?',
    icon: '💁',
    iconType: 'emoji',
    keywords: [
      'how about your service experience', 'tell me about your service experience',
      'what is your service experience', 'service experience',
      'what academic services have you provided', 'what is your academic service experience',
      'tell me about your academic services', 'how do you contribute academically',
      'program committee experience', 'teaching assistant experience',
      'academic service', 'services', 'program committee', 'teaching assistant',
      '你有哪些学术服务经历', '介绍一下你的学术服务', '学术服务经历',
      '程序委员会经历', '助教经历', '学术服务', '助教',
    ],
    answer: plainAnswer(
      'My academic service experience includes the roles of conference reviewer and teaching assistant.',
      [{ type: 'services' }],
    ),
  },
  {
    id: 'internship',
    prompt: 'How about your internship experience?',
    icon: '💼',
    iconType: 'emoji',
    keywords: [
      'how about your internship experience', 'tell me about your internship experience',
      'what internships have you completed', 'do you have internship experience',
      'have you completed any internships', 'where have you interned',
      'industry internship experience',
      'internship background', 'internship history', 'internship experience',
      'internships', 'internship', 'intern',
      '你的实习经历怎么样', '介绍一下你的实习经历', '你做过哪些实习',
      '你有实习经历吗', '你在哪里实习过', '实习背景', '实习经历', '实习',
    ],
    answer: plainAnswer('NULL'),
  },
  {
    id: 'correspondence',
    prompt: 'What is your correspondence address?',
    icon: '📍',
    iconType: 'emoji',
    keywords: [
      'what is your correspondence address', 'what is your contact address',
      'show me your correspondence address', 'correspondence address',
      'laboratory and mailing address', 'mailing and laboratory address',
      '你的联系地址是什么', '你的通讯地址是什么', '联系地址', '通讯地址',
      '实验室和邮寄地址', '邮寄和实验室地址',
    ],
    answer: plainAnswer(
      'Here are my laboratory and mailing addresses.',
      [{ type: 'correspondence' }],
    ),
  },
  {
    id: 'unknown',
    icon: '',
    keywords: [],
    repeatMode: 'stateless',
    answers: unknownAnswerVariants,
  },
];

const answerDefinitions = new Map();

function normalizeLabel(intent) {
  const {
    answerId = intent.id,
    answer,
    answers = answer ? [answer] : [],
    repeatAnswers,
    repeatMode = 'tracked',
    prompt,
    displayPrompts = prompt ? [prompt] : [],
    ...question
  } = intent;
  if (answers.length === 0) {
    throw new TypeError(`Intent "${intent.id}" requires at least one answer.`);
  }
  if (
    repeatAnswers !== undefined
    && (!Array.isArray(repeatAnswers) || repeatAnswers.length === 0)
  ) {
    throw new TypeError(`Intent "${intent.id}" requires a non-empty repeatAnswers array.`);
  }
  if (!['tracked', 'stateless'].includes(repeatMode)) {
    throw new TypeError(`Intent "${intent.id}" has an invalid repeatMode.`);
  }

  const existingAnswer = answerDefinitions.get(answerId);
  if (existingAnswer) {
    const sharesVariants = existingAnswer.variants.length === answers.length
      && existingAnswer.variants.every((variant, index) => variant === answers[index]);
    const sharesRepeatAnswers = repeatAnswers === undefined
      || existingAnswer.repeatAnswers === repeatAnswers
      || (
        existingAnswer.repeatAnswers?.length === repeatAnswers.length
        && existingAnswer.repeatAnswers.every((item, index) => item === repeatAnswers[index])
      );
    const sharesRepeatMode = existingAnswer.repeatMode === repeatMode;
    if (!sharesVariants || !sharesRepeatAnswers || !sharesRepeatMode) {
      throw new TypeError(`Questions sharing answerId "${answerId}" must share its answer data.`);
    }
  } else {
    answerDefinitions.set(answerId, Object.freeze({
      id: answerId,
      variants: Object.freeze([...answers]),
      repeatMode,
      ...(repeatAnswers ? { repeatAnswers: Object.freeze([...repeatAnswers]) } : {}),
    }));
  }

  if (!Array.isArray(displayPrompts) || displayPrompts.some((item) => !item?.trim())) {
    throw new TypeError(`Label "${intent.id}" requires valid displayPrompts.`);
  }
  const questions = labelQuestions[intent.id];
  if (!Array.isArray(questions)) {
    throw new TypeError(`Label "${intent.id}" requires a question-variant list.`);
  }
  return Object.freeze({
    ...question,
    answerId,
    displayPrompts: Object.freeze([...displayPrompts]),
    questions,
  });
}

export const labels = Object.freeze(labelDefinitions.map(normalizeLabel));
// Compatibility aliases for model adapters that still use intent terminology.
export const intents = labels;
export const questions = labels;
export const answers = Object.freeze([...answerDefinitions.values()]);
