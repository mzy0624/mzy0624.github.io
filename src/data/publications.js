import publicationRecords from '../../content/publications.json' with { type: 'json' };
import detectedResources from './publication-resources.generated.json' with { type: 'json' };

const defaultFilenames = Object.freeze({
  pdf: 'paper.pdf',
  code: 'code.zip',
  poster: 'poster.png',
});

export const publicationTypes = Object.freeze(['preprint', 'conference', 'journal']);

function localResourceUrl(id, key) {
  if (!detectedResources[id]?.[key]) return null;
  return `assets/publications/${id}/${defaultFilenames[key]}`;
}

export const publications = Object.freeze(publicationRecords.map((publication) => {
  if (!publicationTypes.includes(publication.type)) {
    throw new Error(`Unsupported publication type for ${publication.id}: ${publication.type}`);
  }
  if (/^\s*In\s*:/i.test(publication.venue)) {
    throw new Error(`Publication venue must not include the "In:" prefix: ${publication.id}`);
  }
  const overrides = publication.resources || {};
  const local = detectedResources[publication.id] || {};

  return Object.freeze({
    ...publication,
    resources: Object.freeze({
      pdf: overrides.pdf || localResourceUrl(publication.id, 'pdf'),
      code: overrides.code || localResourceUrl(publication.id, 'code'),
      poster: overrides.poster || localResourceUrl(publication.id, 'poster'),
      bib: overrides.bib || local.bib || null,
      official: overrides.official || null,
    }),
  });
}));
