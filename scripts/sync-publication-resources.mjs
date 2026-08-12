#!/usr/bin/env node

import { syncPublicationResources } from './lib/publication-resources.mjs';

syncPublicationResources()
  .then((resources) => {
    console.log(`Detected local resources for ${Object.keys(resources).length} publication(s).`);
  })
  .catch((error) => {
    console.error(`Unable to scan publication resources: ${error.message}`);
    process.exitCode = 1;
  });
