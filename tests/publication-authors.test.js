import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPublicationAuthorDisplay,
  validatePublicationAuthors,
} from '../src/data/publication-authors.js';

const teamPaper = {
  id: 'team-paper',
  authors: ['Example Team', 'Carol Smith', 'Alice Adams', 'Bob Brown', 'Other Author'],
  firstAuthorCount: 1,
  authorDisplayCount: 4,
  authorNotes: [
    { symbol: '†', text: 'Core contributors, listed alphabetically by last name.', authors: ['Alice Adams', 'Bob Brown'] },
    { symbol: '‡', text: 'Tech lead.', authors: ['Carol Smith'] },
  ],
};

test('team authorship is independent of lead and core-contributor markers and order', () => {
  validatePublicationAuthors(teamPaper);
  const display = getPublicationAuthorDisplay(teamPaper);
  assert.deepEqual(display.authors, [
    { name: 'Example Team', isFirstAuthor: true, markers: '' },
    { name: 'Carol Smith', isFirstAuthor: false, markers: '‡' },
    { name: 'Alice Adams', isFirstAuthor: false, markers: '†' },
    { name: 'Bob Brown', isFirstAuthor: false, markers: '†' },
  ]);
  assert.deepEqual(display.notes, teamPaper.authorNotes);
  assert.deepEqual(display.remainingAuthors, ['Other Author']);
  assert.equal(teamPaper.authors.length, 5);
});

test('author truncation preserves remaining author order without needing a URL and hides their notes', () => {
  const paper = { ...teamPaper, authorDisplayCount: 2 };
  validatePublicationAuthors(paper);
  const display = getPublicationAuthorDisplay(paper);
  assert.deepEqual(display.remainingAuthors, ['Alice Adams', 'Bob Brown', 'Other Author']);
  assert.deepEqual(display.notes, [teamPaper.authorNotes[1]]);
});

test('existing papers retain complete author lists and automatic equal-contribution notes', () => {
  const paper = { id: 'existing', authors: ['First Author', 'Second Author', 'Last Author'], firstAuthorCount: 2 };
  validatePublicationAuthors(paper);
  const display = getPublicationAuthorDisplay(paper);
  assert.deepEqual(display.authors.map(({ markers }) => markers), ['*', '*', '']);
  assert.deepEqual(display.authors.map(({ isFirstAuthor }) => isFirstAuthor), [true, true, false]);
  assert.deepEqual(display.remainingAuthors, []);
  assert.equal(display.notes[0].text, 'Equal contribution.');
});

test('invalid contribution names and ambiguous marker symbols are rejected', () => {
  assert.throws(() => validatePublicationAuthors({ ...teamPaper, authorNotes: [{ symbol: '†', text: 'Core contributors.', authors: ['Missing Author'] }] }), /names in authors/);
  assert.throws(() => validatePublicationAuthors({ ...teamPaper, authorNotes: [...teamPaper.authorNotes, teamPaper.authorNotes[0]] }), /already used/);
  assert.throws(() => validatePublicationAuthors({ ...teamPaper, firstAuthorCount: 2, authorNotes: [{ symbol: '*', text: 'Core contributors.', authors: ['Alice Adams'] }] }), /already used/);
});

test('author truncation rejects invalid display counts', () => {
  assert.throws(() => validatePublicationAuthors({ ...teamPaper, authorDisplayCount: 0 }), /authorDisplayCount/);
  assert.throws(() => validatePublicationAuthors({ ...teamPaper, authorDisplayCount: 6 }), /authorDisplayCount/);
});

test('compact team credit replaces individual names, notes, and remaining-author expansion', () => {
  const authorCredit = { team: 'Example Team', role: 'Core contributor', name: 'Alice Adams' };
  const paper = { ...teamPaper, authorCredit };
  validatePublicationAuthors(paper);
  const display = getPublicationAuthorDisplay(paper);
  assert.deepEqual(display.authors, [{ name: 'Example Team', isFirstAuthor: true, markers: '' }]);
  assert.deepEqual(display.credit, authorCredit);
  assert.deepEqual(display.notes, []);
  assert.deepEqual(display.remainingAuthors, []);
  assert.equal(paper.authors.length, 5);
  assert.throws(() => validatePublicationAuthors({ ...paper, authorCredit: { ...authorCredit, name: 'Missing Author' } }), /authorCredit/);
});
