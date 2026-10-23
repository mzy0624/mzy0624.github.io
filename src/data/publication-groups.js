export const publicationGroupDefinitions = Object.freeze([
  Object.freeze({ type: 'conference', heading: 'Conference Paper', venuePrefix: 'In: ' }),
  Object.freeze({ type: 'journal', heading: 'Journal Paper', venuePrefix: 'In: ' }),
  Object.freeze({ type: 'technical-report', heading: 'Technical Report', venuePrefix: '' }),
  Object.freeze({ type: 'preprint', heading: 'Preprint', venuePrefix: '' }),
]);

export const publicationTypes = Object.freeze(publicationGroupDefinitions.map(({ type }) => type));

export function getPublicationVenuePrefix(type) {
  return publicationGroupDefinitions.find((group) => group.type === type)?.venuePrefix || '';
}

export function groupPublications(publications, authorName = '') {
  const authorPosition = (publication) => {
    const index = authorName ? publication.authors?.indexOf(authorName) ?? -1 : -1;
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };

  return publicationGroupDefinitions
    .map(({ type, heading }) => ({
      type,
      heading,
      publications: publications
        .map((publication, sourceIndex) => ({ publication, sourceIndex }))
        .filter(({ publication }) => publication.type === type)
        .sort((left, right) => (
          authorPosition(left.publication) - authorPosition(right.publication)
          || Number(right.publication.year) - Number(left.publication.year)
          || left.sourceIndex - right.sourceIndex
        ))
        .map(({ publication }) => publication),
    }))
    .filter(({ publications: groupedPublications }) => groupedPublications.length > 0);
}
