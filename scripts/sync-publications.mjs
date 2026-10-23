#!/usr/bin/env node

import { syncPublications } from './lib/publications.mjs';

syncPublications(undefined, { includeIgnored: !process.argv.includes('--production') })
  .then(({ publications }) => {
    console.log(`Indexed ${publications.length} publication(s) from publications/*/publication.json.`);
  })
  .catch((error) => {
    console.error(`Unable to scan publications: ${error.message}`);
    process.exitCode = 1;
  });
