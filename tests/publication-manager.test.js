import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import publications from '../content/publications.json' with { type: 'json' };

const execFileAsync = promisify(execFile);

test('publication manager offers a standalone read-only list command', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    ['scripts/manage-publications.mjs', 'list'],
    { cwd: process.cwd() },
  );

  publications.forEach((publication) => {
    assert.ok(stdout.includes(publication.title));
    assert.ok(stdout.includes(`ID: ${publication.id}`));
    assert.ok(stdout.includes(publication.venueShort));
  });
});

test('publication manager documents its interactive and direct commands', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    ['scripts/manage-publications.mjs', '--help'],
    { cwd: process.cwd() },
  );

  assert.match(stdout, /publication:manage/);
  assert.match(stdout, /edit \[id\]/);
  assert.match(stdout, /remove \[id\]/);
});
