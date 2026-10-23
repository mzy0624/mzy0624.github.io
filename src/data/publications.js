import publicationRecords from './publications.generated.json' with { type: 'json' };

export { publicationTypes } from './publication-groups.js';

export const publications = Object.freeze(publicationRecords.map((publication) => Object.freeze({
  ...publication,
  resources: Object.freeze(publication.resources),
})));
