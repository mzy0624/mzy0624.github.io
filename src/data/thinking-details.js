const moment = (status, detail) => Object.freeze({ status, detail });

export const thinkingMoments = Object.freeze([
  moment(
    'Pondering Archimedes and cat treats',
    'I spent a moment wondering whether Archimedes ever ate a cat treat.',
  ),
  moment(
    'Feeding a hamster',
    'A hamster was requesting sunflower seeds under the table, so I handled that first.',
  ),
  moment(
    'Playing table tennis with Ma Long',
    'I played a round of table tennis with Ma Long.',
  ),
  moment(
    'Recounting the salt vote',
    'The tomato and scrambled eggs were voting on whether they needed more salt, and the recount held me up a little.',
  ),
  moment(
    'Teaching a pigeon gradient descent',
    'I tried to teach a pigeon gradient descent, which took longer than expected.',
  ),
  moment(
    'Waiting for the moon',
    'The moon still had not replied to my email, so I gave it one more moment.',
  ),
  moment(
    'Chatting with my girlfriend',
    'I just chatted with my girlfriend for a while.',
  ),
  moment(
    "Calculating a cat's paper capacity",
    'I calculated how many papers a cat could sit on at once.',
  ),
  moment(
    'Looking for a semicolon',
    'I found the missing semicolon under the sofa.',
  ),
  moment(
    'Teaching goldfish about Learnware',
    'I tried to make a goldfish understand the Learnware Paradigm.',
  ),
  moment(
    'Debating coffee as an optimizer',
    'The committee remains divided on whether coffee counts as an optimizer, and its meeting ran a little long.',
  ),
  moment(
    'Waiting for the kettle',
    'The kettle took longer than expected to finish its peer review, so this answer had to wait.',
  ),
  moment(
    'Watching a rubber duck reject the null',
    'A rubber duck has just rejected the null hypothesis.',
  ),
  moment(
    'Rehearsing a chorus with cicadas',
    'I joined the cicadas outside for a quick chorus rehearsal.',
  ),
  moment(
    'Counseling a matrix',
    'I gave a diagonal matrix a moment to consider whether it ever feels lonely.',
  ),
  moment(
    'Consulting Ultraman',
    'I just visited Nebula M78 to ask Ultraman for advice.',
  ),
  moment(
    'Checking the leaderboard',
    'Current leaderboard: a determined squirrel first, my running PB second.',
  ),
  moment(
    'Sorting clouds by citation count',
    'A few clouds needed sorting by citation count, but they refused to stay in order.',
  ),
  moment(
    'Asking the bookshelf for fewer equations',
    'I asked the bookshelf for something with fewer equations.',
  ),
  moment(
    'Debating tomatoes in fruit salad',
    'I was wondering whether tomatoes belong in a fruit salad.',
  ),
  moment(
    'Waiting for the elevator',
    'The elevator declined to reveal which floor it was thinking about, so I waited one more floor.',
  ),
  moment(
    'Helping a cactus exit Vim',
    'I helped a cactus exit Vim, which took a moment.',
  ),
  moment(
    'Meeting with three paper clips',
    'An emergency meeting with three paper clips ran slightly over schedule.',
  ),
  moment(
    "Petting Schrodinger's cat",
    "I just spent a while petting Schrodinger's cat.",
  ),
  moment(
    'Waiting for the printer',
    'I briefly waited for the printer to explain why it only jams before deadlines, but no statement was issued.',
  ),
  moment(
    'Negotiating with a cat',
    'Desk-space negotiations with a cat reached a stalemate, which held me up for a moment.',
  ),
  moment(
    'Looking for Reviewer 2',
    'I looked under the table, but Reviewer 2 was not there after all.',
  ),
  moment(
    'Choosing the random seed',
    "Today's random seed was selected by a squirrel.",
  ),
  moment(
    'Waiting for an ice cube',
    'An ice cube is still trying to understand entropy, and apparently that takes time.',
  ),
  moment(
    'Rehearsing an acceptance speech',
    'I just rehearsed an acceptance speech for finally closing all my browser tabs.',
  ),
]);

export const thinkingDetails = Object.freeze(thinkingMoments.map(({ detail }) => detail));
