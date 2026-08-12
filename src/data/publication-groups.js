export const publicationGroupDefinitions = Object.freeze([
  Object.freeze({ type: 'conference', heading: 'Conference Paper' }),
  Object.freeze({ type: 'journal', heading: 'Journal Paper' }),
  Object.freeze({ type: 'preprint', heading: 'Preprint' }),
]);

export function groupPublications(publications) {
  return publicationGroupDefinitions
    .map(({ type, heading }) => ({
      type,
      heading,
      publications: publications
        .map((publication, sourceIndex) => ({ publication, sourceIndex }))
        .filter(({ publication }) => publication.type === type)
        .sort((left, right) => (
          Number(right.publication.year) - Number(left.publication.year)
          || left.sourceIndex - right.sourceIndex
        ))
        .map(({ publication }) => publication),
    }))
    .filter(({ publications: groupedPublications }) => groupedPublications.length > 0);
}
