import { spawnSync } from 'node:child_process';
import { lstat, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePublicationAuthors } from '../../src/data/publication-authors.js';
import { publicationTypes } from '../../src/data/publication-groups.js';

export const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
export const localResourceFiles = Object.freeze({
  pdf: 'paper.pdf', code: 'code.zip', poster: 'poster.png', bib: 'citation.bib',
});
export const generatedCatalogPath = (root = projectRoot) => path.join(root, 'src/data/publications.generated.json');
export const publicationsPath = (root = projectRoot) => path.join(root, 'publications');

export async function isRegularFile(filename) {
  return (await lstat(filename).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  }))?.isFile() || false;
}

export function validatePublication(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('publication.json must contain one object.');
  if (typeof record.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) {
    throw new Error('Publication id must contain lowercase letters, numbers, and single hyphens.');
  }
  for (const key of ['title', 'type', 'venue', 'venueShort', 'year']) {
    if (typeof record[key] !== 'string' || !record[key].trim()) throw new Error(`Publication "${record.id}": ${key} is required.`);
  }
  if (!publicationTypes.includes(record.type)) throw new Error(`Unsupported publication type: ${record.type}`);
  if (!/^\d{4}$/.test(record.year)) throw new Error(`Publication "${record.id}": year must have four digits.`);
  if (/^\s*In\s*:/i.test(record.venue)) throw new Error(`Publication "${record.id}": venue must not include In:.`);
  if (record.summary !== undefined && record.summary !== null && typeof record.summary !== 'string') {
    throw new Error(`Publication "${record.id}": summary must be text when provided.`);
  }
  if (record.resources !== undefined && (!record.resources || typeof record.resources !== 'object' || Array.isArray(record.resources))) {
    throw new Error(`Publication "${record.id}": resources must be an object.`);
  }
  for (const [key, value] of Object.entries(record.resources || {})) {
    if (![...Object.keys(localResourceFiles), 'official'].includes(key)) throw new Error(`Unknown publication resource: ${key}`);
    if (value !== null && value !== '' && (typeof value !== 'string' || !/^https?:\/\//i.test(value))) {
      throw new Error(`Publication "${record.id}": resources.${key} must be an http(s) URL or null.`);
    }
  }
  validatePublicationAuthors(record);
  return record;
}

function ignoredPaths(root, filenames) {
  // --no-index also honors ignore rules for previously tracked files.
  // Fail closed if Git cannot evaluate the production exclusion policy.
  const relativePaths = filenames.map((filename) => path.relative(root, filename).split(path.sep).join('/'));
  const result = spawnSync('git', ['-C', root, 'check-ignore', '--no-index', '-z', '--stdin'], {
    input: `${relativePaths.join('\0')}\0`, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || ![0, 1].includes(result.status)) {
    throw new Error('Production publication scanning requires Git and a Git checkout to evaluate ignore rules.');
  }
  return new Set(result.stdout.split('\0').filter(Boolean).map((filename) => path.resolve(root, filename)));
}

export async function scanPublications(root = projectRoot, { includeIgnored = true } = {}) {
  const sourceRoot = publicationsPath(root);
  const directories = (await readdir(sourceRoot, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  })).filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));
  const candidates = directories.flatMap(({ name }) => [
    path.join(sourceRoot, name, 'publication.json'),
    ...Object.values(localResourceFiles).map((filename) => path.join(sourceRoot, name, filename)),
  ]);
  const excluded = !includeIgnored && candidates.length ? ignoredPaths(root, candidates) : new Set();
  const records = [];
  const publications = [];
  const assets = [];

  for (const { name } of directories) {
    const directory = path.join(sourceRoot, name);
    const manifestPath = path.join(directory, 'publication.json');
    if (excluded.has(manifestPath) || !(await isRegularFile(manifestPath))) continue;
    let record;
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      record = validatePublication({ ...manifest, id: manifest.id ?? name, firstAuthorCount: manifest.firstAuthorCount ?? 1 });
      if (record.id !== name) throw new Error('id must match the publication directory name (or be omitted).');
    } catch (error) {
      throw new Error(`${path.relative(root, manifestPath)}: ${error.message}`);
    }
    const resources = { pdf: null, code: null, poster: null, bib: null, official: record.resources?.official || null };
    for (const [key, filename] of Object.entries(localResourceFiles)) {
      if (record.resources?.[key]) {
        resources[key] = record.resources[key];
        continue;
      }
      const filePath = path.join(directory, filename);
      if (excluded.has(filePath) || !(await isRegularFile(filePath))) continue;
      const url = `assets/publications/${name}/${filename}`;
      if (key === 'bib') {
        resources.bib = (await readFile(filePath, 'utf8')).trim();
        if (!resources.bib.startsWith('@')) throw new Error(`Invalid BibTeX: ${path.relative(root, filePath)}`);
      } else {
        resources[key] = url;
      }
      assets.push({ filePath, url });
    }
    records.push(record);
    publications.push({ ...record, resources });
  }
  return { records, publications, assets };
}

export async function writePublication(record, root = projectRoot) {
  validatePublication(record);
  const directory = path.join(publicationsPath(root), record.id);
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, 'publication.json');
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  await rename(temporary, target);
}

export async function syncPublications(root = projectRoot, options) {
  const catalog = await scanPublications(root, options);
  const output = generatedCatalogPath(root);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(catalog.publications, null, 2)}\n`, 'utf8');
  return catalog;
}
