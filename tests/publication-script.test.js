import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('publication script validates a manifest and places it first during dry run', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      'scripts/add-publication.mjs',
      'tests/fixtures/publication',
      '--dry-run',
    ],
    { cwd: process.cwd() },
  );
  const plan = JSON.parse(stdout);

  assert.equal(plan.position, 1);
  assert.equal(plan.record.id, 'example-paper');
  assert.equal(plan.record.type, 'conference');
  assert.deepEqual(plan.record.authors, ['Zi-Yu Mao', 'Coauthor']);
  assert.equal(plan.record.firstAuthorCount, 2);
  assert.deepEqual(plan.record.resources, {
    code: 'https://github.com/example/repository',
    official: 'https://example.com/paper',
  });
  assert.equal('details' in plan.record, false);
  assert.equal(plan.copies.length, 1);
  assert.equal(plan.copies[0].key, 'bib');
  assert.equal(plan.copies[0].filename, 'citation.bib');
});
