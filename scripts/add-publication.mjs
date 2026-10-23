#!/usr/bin/env node

import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  isRegularFile, localResourceFiles, publicationsPath, syncPublications,
  validatePublication, writePublication,
} from './lib/publications.mjs';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const positional = args.filter((arg) => arg !== '--dry-run');
  if (positional.length !== 1) {
    throw new Error('Usage: npm run publication:add -- <publication-folder|publication.json> [--dry-run]');
  }
  const source = path.resolve(process.cwd(), positional[0]);
  const sourceStat = await stat(source);
  const manifestPath = sourceStat.isDirectory() ? path.join(source, 'publication.json') : source;
  const sourceDirectory = path.dirname(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const record = validatePublication({
    ...manifest, id: manifest.id ?? path.basename(sourceDirectory), firstAuthorCount: manifest.firstAuthorCount ?? 1,
  });
  const targetDirectory = path.join(publicationsPath(), record.id);
  const alreadyInPlace = sourceDirectory === targetDirectory;
  if (!alreadyInPlace && await stat(targetDirectory).catch(() => null)) {
    throw new Error(`Publication directory already exists: ${targetDirectory}`);
  }
  const copies = [];
  for (const [key, filename] of Object.entries(localResourceFiles)) {
    const filenamePath = path.join(sourceDirectory, filename);
    if (!record.resources?.[key] && await isRegularFile(filenamePath)) {
      if (key === 'bib' && !(await readFile(filenamePath, 'utf8')).trim().startsWith('@')) {
        throw new Error(`Invalid BibTeX: ${filenamePath}`);
      }
      copies.push({ key, source: filenamePath, filename });
    }
  }
  if (dryRun) {
    console.log(JSON.stringify({ record, copies, targetDirectory, alreadyInPlace }, null, 2));
    return;
  }
  if (!alreadyInPlace) {
    await mkdir(publicationsPath(), { recursive: true });
    await mkdir(targetDirectory);
    await Promise.all(copies.map(({ source: filename, filename: target }) => copyFile(filename, path.join(targetDirectory, target))));
    await writePublication(record);
  }
  await syncPublications();
  console.log(`Publication ready: publications/${record.id}/publication.json`);
}

main().catch((error) => {
  console.error(`Unable to add publication: ${error.message}`);
  process.exitCode = 1;
});
