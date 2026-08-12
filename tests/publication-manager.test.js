import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('publication manager offers a standalone read-only list command', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    ['scripts/manage-publications.mjs', 'list'],
    { cwd: process.cwd() },
  );

  assert.match(stdout, /Identifying Learnwares via Reduced Neural Conditional Mean Embedding/);
  assert.match(stdout, /ID: rncme/);
  assert.match(stdout, /ICML 2026/);
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
