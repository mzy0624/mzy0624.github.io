#!/usr/bin/env node

import { constants } from 'node:fs';
import {
  access,
  copyFile,
  mkdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  localResourceFiles,
  syncPublicationResources,
} from './lib/publication-resources.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const catalogPath = path.join(projectRoot, 'src/data/publications.json');
const publicationAssetsRoot = path.join(projectRoot, 'public/assets/publications');
const externalResourceKeys = ['pdf', 'code', 'poster', 'bib', 'official'];
const publicationTypes = new Set(['preprint', 'conference', 'journal']);
const requiredTextFields = [
  'id',
  'type',
  'title',
  'venue',
  'venueShort',
  'year',
  'summary',
];

function fail(message) {
  throw new Error(message);
}

function isWebUrl(value) {
  return /^https?:\/\//i.test(value);
}

function requireText(record, key) {
  if (typeof record[key] !== 'string' || !record[key].trim()) {
    fail(`"${key}" must be a non-empty string.`);
  }
  return record[key].trim();
}

function prepareAuthors(manifest) {
  if (!Array.isArray(manifest.authors) || manifest.authors.length === 0) {
    fail('"authors" must be a non-empty array of author names.');
  }
  const authors = manifest.authors.map((author, index) => {
    if (typeof author !== 'string' || !author.trim()) {
      fail(`authors[${index}] must be a non-empty string.`);
    }
    return author.trim();
  });
  const firstAuthorCount = manifest.firstAuthorCount ?? 1;
  if (
    !Number.isInteger(firstAuthorCount)
    || firstAuthorCount < 1
    || firstAuthorCount > authors.length
  ) {
    fail('"firstAuthorCount" must be an integer from 1 to the number of authors.');
  }
  return { authors, firstAuthorCount };
}

async function resolveManifestPath(inputPath) {
  const absoluteInput = path.resolve(process.cwd(), inputPath);
  const inputStat = await stat(absoluteInput).catch(() => null);
  if (!inputStat) fail(`Cannot find ${absoluteInput}`);
  return inputStat.isDirectory()
    ? path.join(absoluteInput, 'publication.json')
    : absoluteInput;
}

function prepareExternalResources(manifest) {
  const resources = {};
  for (const key of externalResourceKeys) {
    const value = manifest.resources?.[key];
    if (value === null || value === undefined || value === '') continue;
    if (typeof value !== 'string' || !isWebUrl(value)) {
      fail(`resources.${key} must be an http(s) URL when provided.`);
    }
    resources[key] = value.trim();
  }
  return resources;
}

async function prepareLocalCopies(sourceDirectory, externalResources) {
  const copies = [];
  for (const [key, filename] of Object.entries(localResourceFiles)) {
    if (externalResources[key]) continue;
    const source = path.join(sourceDirectory, filename);
    const sourceStat = await stat(source).catch(() => null);
    if (!sourceStat?.isFile()) continue;
    if (key === 'bib') {
      const bib = (await readFile(source, 'utf8')).trim();
      if (!bib.startsWith('@')) fail(`BibTeX file does not start with "@": ${source}`);
    }
    copies.push({ key, source, filename });
  }
  return copies;
}

async function publicationRecord(manifest, sourceDirectory) {
  requiredTextFields.forEach((key) => requireText(manifest, key));
  const { authors, firstAuthorCount } = prepareAuthors(manifest);
  const type = manifest.type.trim();
  if (!publicationTypes.has(type)) {
    fail('"type" must be one of: preprint, conference, journal.');
  }
  if (/^\s*In\s*:/i.test(manifest.venue)) {
    fail('"venue" must not include the "In:" prefix; the website adds it automatically.');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.id)) {
    fail('"id" must contain only lowercase letters, numbers, and single hyphens.');
  }

  const resources = prepareExternalResources(manifest);
  const copies = await prepareLocalCopies(sourceDirectory, resources);

  const record = {
    id: manifest.id,
    type,
    title: manifest.title.trim(),
    authors,
    firstAuthorCount,
    venue: manifest.venue.trim(),
    venueShort: manifest.venueShort.trim(),
    year: manifest.year.trim(),
    topic: typeof manifest.topic === 'string' ? manifest.topic.trim() : '',
    summary: manifest.summary.trim(),
  };
  if (Object.keys(resources).length > 0) record.resources = resources;

  return {
    record,
    copies,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const positional = args.filter((arg) => arg !== '--dry-run');
  if (positional.length !== 1) {
    fail('Usage: npm run publication:add -- <publication-folder|publication.json> [--dry-run]');
  }

  const manifestPath = await resolveManifestPath(positional[0]);
  await access(manifestPath, constants.R_OK).catch(() => fail(`Cannot read ${manifestPath}`));
  const sourceDirectory = path.dirname(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const { record, copies } = await publicationRecord(manifest, sourceDirectory);
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));

  if (!Array.isArray(catalog)) fail('src/data/publications.json must contain an array.');
  if (catalog.some(({ id }) => id === record.id)) fail(`Publication id "${record.id}" already exists.`);

  const targetDirectory = path.join(publicationAssetsRoot, record.id);
  const targetStat = await stat(targetDirectory).catch(() => null);
  if (targetStat) fail(`Asset directory already exists: ${targetDirectory}`);

  if (dryRun) {
    console.log(JSON.stringify({ position: 1, record, copies, targetDirectory }, null, 2));
    return;
  }

  if (copies.length) {
    await mkdir(targetDirectory, { recursive: false });
    await Promise.all(
      copies.map(({ source, filename }) => copyFile(source, path.join(targetDirectory, filename))),
    );
  }
  catalog.unshift(record);
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  await syncPublicationResources(projectRoot);
  console.log(`Added "${record.title}" as the first publication.`);
}

main().catch((error) => {
  console.error(`Unable to add publication: ${error.message}`);
  process.exitCode = 1;
});
