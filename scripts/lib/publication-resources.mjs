import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../..', import.meta.url));

const localResourceFiles = Object.freeze({
  pdf: 'paper.pdf',
  code: 'code.zip',
  poster: 'poster.png',
  bib: 'citation.bib',
});

async function isFile(filePath) {
  return (await stat(filePath).catch(() => null))?.isFile() || false;
}

export async function detectPublicationResources(root = projectRoot) {
  const catalogPath = path.join(root, 'content/publications.json');
  const assetsRoot = path.join(root, 'public/assets/publications');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const detected = {};

  for (const publication of catalog) {
    const publicationDirectory = path.join(assetsRoot, publication.id);
    const resources = {};

    for (const [key, filename] of Object.entries(localResourceFiles)) {
      const filePath = path.join(publicationDirectory, filename);
      if (!(await isFile(filePath))) continue;
      if (key !== 'bib') {
        resources[key] = true;
        continue;
      }

      const bib = (await readFile(filePath, 'utf8')).trim();
      if (!bib.startsWith('@')) {
        throw new Error(`Invalid BibTeX file: ${filePath}`);
      }
      resources.bib = bib;
    }

    if (Object.keys(resources).length > 0) detected[publication.id] = resources;
  }

  return detected;
}

export async function syncPublicationResources(root = projectRoot) {
  const outputPath = path.join(root, 'src/data/publication-resources.generated.json');
  const detected = await detectPublicationResources(root);
  await writeFile(outputPath, `${JSON.stringify(detected, null, 2)}\n`, 'utf8');
  return detected;
}

export { localResourceFiles };
