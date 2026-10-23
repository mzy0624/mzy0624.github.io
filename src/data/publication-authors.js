const isText = (value) => typeof value === 'string' && value.trim().length > 0;

export function validatePublicationAuthors(publication) {
  const { authors, authorDisplayCount, authorNotes = [], authorCredit } = publication;
  const firstAuthorCount = publication.firstAuthorCount ?? 1;
  const fail = (message) => { throw new Error(`Publication "${publication.id}": ${message}`); };

  if (!Array.isArray(authors) || !authors.length || !authors.every(isText)) {
    fail('authors must be a non-empty array of names.');
  }
  if (!Number.isInteger(firstAuthorCount) || firstAuthorCount < 1 || firstAuthorCount > authors.length) {
    fail('firstAuthorCount must be an integer from 1 to the number of authors.');
  }
  if (authorDisplayCount !== undefined && (
    !Number.isInteger(authorDisplayCount) || authorDisplayCount < 1 || authorDisplayCount > authors.length
  )) {
    fail('authorDisplayCount must be an integer from 1 to the number of authors.');
  }
  if (authorCredit !== undefined && (
    !authorCredit || !isText(authorCredit.team) || !isText(authorCredit.role)
    || !isText(authorCredit.name) || !authors.includes(authorCredit.team)
    || !authors.includes(authorCredit.name)
  )) {
    fail('authorCredit requires a team and name from authors, plus a non-empty role.');
  }
  if (!Array.isArray(authorNotes)) fail('authorNotes must be an array.');
  const symbols = new Set(firstAuthorCount > 1 ? ['*'] : []);
  authorNotes.forEach((note) => {
    if (!note || !isText(note.symbol) || !isText(note.text)) {
      fail('each author note requires a symbol and text.');
    }
    if (symbols.has(note.symbol)) fail(`author note symbol "${note.symbol}" is already used.`);
    symbols.add(note.symbol);
    if (!Array.isArray(note.authors) || !note.authors.length
      || !note.authors.every((name) => authors.includes(name))) {
      fail(`author note "${note.symbol}" must reference names in authors.`);
    }
  });
}

export function getPublicationAuthorDisplay(publication) {
  const { authors, authorNotes = [], authorCredit = null } = publication;
  const firstAuthorCount = publication.firstAuthorCount ?? 1;
  const displayCount = publication.authorDisplayCount ?? authors.length;
  const notes = authorCredit ? [] : [
    ...(firstAuthorCount > 1 ? [{
      symbol: '*',
      text: 'Equal contribution.',
      authors: authors.slice(0, firstAuthorCount),
    }] : []),
    ...authorNotes,
  ];
  const visibleAuthors = authorCredit ? [authorCredit.team] : authors.slice(0, displayCount);

  return {
    authors: visibleAuthors.map((name, index) => ({
      name,
      isFirstAuthor: authorCredit ? authors.indexOf(name) < firstAuthorCount : index < firstAuthorCount,
      markers: notes.filter((note) => note.authors.includes(name)).map((note) => note.symbol).join(''),
    })),
    notes: notes.filter((note) => note.authors.some((name) => visibleAuthors.includes(name))),
    remainingAuthors: authorCredit ? [] : authors.slice(displayCount),
    credit: authorCredit,
  };
}
