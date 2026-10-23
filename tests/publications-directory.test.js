import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build, createServer } from 'vite';
import { scanPublications, syncPublications } from '../scripts/lib/publications.mjs';
import { publicationsPlugin } from '../scripts/lib/publications-vite.mjs';

const manifest = (title) => ({
  type: 'technical-report', title, authors: ['Example Author'], firstAuthorCount: 1,
  venue: 'Example Technical Report, 2026.', venueShort: 'Report', year: '2026', summary: 'Example summary.',
});

async function fixture(t, { git = true } = {}) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'mzy-publications-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  if (git) execFileSync('git', ['init', '--quiet', root]);
  await writeFile(path.join(root, '.gitignore'), 'publications/private-draft/\npublications/public-paper/poster.png\nsrc/data/publications.generated.json\n');
  for (const [id, title] of [['public-paper', 'Public Example Report'], ['private-draft', 'PRIVATE_METADATA_CANARY']]) {
    const directory = path.join(root, 'publications', id);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'publication.json'), JSON.stringify(manifest(title)));
    await writeFile(path.join(directory, 'paper.pdf'), id === 'private-draft' ? 'PRIVATE_PDF_CANARY' : '%PDF-public');
  }
  await writeFile(path.join(root, 'publications/public-paper/poster.png'), 'IGNORED_POSTER_CANARY');
  return root;
}

test('directory discovery includes local drafts and infers ids without a central catalog', async (t) => {
  const root = await fixture(t);
  const catalog = await scanPublications(root);
  assert.deepEqual(catalog.records.map(({ id }) => id), ['private-draft', 'public-paper']);
  assert.equal(catalog.publications[0].resources.pdf, 'assets/publications/private-draft/paper.pdf');
  assert.equal(catalog.publications[0].resources.code, null);
  assert.equal(catalog.publications[1].resources.poster, 'assets/publications/public-paper/poster.png');
});

test('production excludes ignored metadata and attachments before reading them', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'publications/private-draft/publication.json'), 'incomplete private draft');
  const catalog = await scanPublications(root, { includeIgnored: false });
  assert.deepEqual(catalog.records.map(({ id }) => id), ['public-paper']);
  assert.equal(catalog.publications[0].resources.poster, null);
  assert.deepEqual(catalog.assets.map(({ url }) => url), ['assets/publications/public-paper/paper.pdf']);
});

test('production respects ignore rules even for already tracked publication files', async (t) => {
  const root = await fixture(t);
  execFileSync('git', ['-C', root, 'add', '-f', 'publications/private-draft']);
  const catalog = await scanPublications(root, { includeIgnored: false });
  assert.deepEqual(catalog.records.map(({ id }) => id), ['public-paper']);
});

test('production fails closed when Git cannot evaluate exclusion rules', async (t) => {
  const root = await fixture(t, { git: false });
  await assert.rejects(scanPublications(root, { includeIgnored: false }), /requires Git/);
});

async function outputFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await outputFiles(target));
    else files.push(target);
  }
  return files;
}

test('a production build excludes private metadata, bytes, and source maps despite a stale local index', async (t) => {
  const root = await fixture(t);
  await syncPublications(root);
  const cached = await readFile(path.join(root, 'src/data/publications.generated.json'), 'utf8');
  assert.match(cached, /PRIVATE_METADATA_CANARY/);
  await writeFile(path.join(root, 'index.html'), '<script type="module" src="/main.js"></script>');
  await writeFile(path.join(root, 'main.js'), 'import records from "./src/data/publications.generated.json"; document.body.textContent = JSON.stringify(records);');
  const outDir = path.join(root, 'dist');
  await build({
    root, configFile: false, publicDir: false, plugins: [publicationsPlugin(root)], logLevel: 'silent',
    build: { outDir, sourcemap: true, minify: false },
  });
  const files = await outputFiles(outDir);
  const contents = (await Promise.all(files.map((filename) => readFile(filename, 'utf8')))).join('\n');
  assert.match(contents, /Public Example Report/);
  assert.doesNotMatch(contents, /PRIVATE_METADATA_CANARY|PRIVATE_PDF_CANARY|IGNORED_POSTER_CANARY|private-draft/);
  assert.ok(files.some((filename) => filename.endsWith('.map')));
  assert.ok(files.some((filename) => filename.endsWith('public-paper/paper.pdf')));
  assert.ok(!files.some((filename) => filename.endsWith('publication.json')));
  // Building does not rewrite another running dev server's local catalog.
  assert.equal(await readFile(path.join(root, 'src/data/publications.generated.json'), 'utf8'), cached);
});

test('development serves draft attachments and refreshes the catalog when a folder is added', { timeout: 15000 }, async (t) => {
  const root = await fixture(t);
  const server = await createServer({
    root, configFile: false, publicDir: false, plugins: [publicationsPlugin(root)], logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
  });
  t.after(() => server.close());
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const pdf = await fetch(`${base}/assets/publications/private-draft/paper.pdf`);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  assert.equal(await pdf.text(), 'PRIVATE_PDF_CANARY');
  assert.equal((await fetch(`${base}/assets/publications/private-draft/publication.json`)).status, 404);
  const before = await server.transformRequest('/src/data/publications.generated.json');
  assert.match(before.code, /PRIVATE_METADATA_CANARY/);
  const directory = path.join(root, 'publications/new-paper');
  await mkdir(directory);
  const target = path.join(directory, 'publication.json');
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { server.watcher.off('add', added); reject(new Error('Publication folder was not detected')); }, 5000);
    const added = (filename) => {
      if (filename !== target) return;
      clearTimeout(timer);
      server.watcher.off('add', added);
      resolve();
    };
    server.watcher.on('add', added);
    writeFile(target, JSON.stringify(manifest('Automatically Discovered Paper'))).catch(reject);
  });
  const after = await server.transformRequest('/src/data/publications.generated.json');
  assert.match(after.code, /Automatically Discovered Paper/);
});
