import profileContent from '../../content/profile.json' with { type: 'json' };
import { deepFreeze } from './content-loader.js';
import { publications } from './publications.js';
import { site } from './site.js';

export const profile = deepFreeze({
  ...profileContent,
  name: site.owner.name,
  publicationName: site.owner.publicationName,
  publications,
});
