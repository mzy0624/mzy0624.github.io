import siteContent from '../../content/site.json' with { type: 'json' };
import { deepFreeze, requireNonEmptyString, requireStringArray } from './content-loader.js';

if (siteContent.schemaVersion !== 1) {
  throw new TypeError('content/site.json requires schemaVersion 1.');
}
requireNonEmptyString(siteContent.owner?.name, 'owner.name');
requireNonEmptyString(siteContent.owner?.publicationName, 'owner.publicationName');
requireNonEmptyString(siteContent.agentName, 'agentName');
requireNonEmptyString(siteContent.pageTitle, 'pageTitle');
requireNonEmptyString(siteContent.description, 'description');
requireNonEmptyString(siteContent.composerPlaceholder, 'composerPlaceholder');
requireNonEmptyString(siteContent.startupLoading?.text, 'startupLoading.text');
requireNonEmptyString(siteContent.startupLoading?.cookieName, 'startupLoading.cookieName');
requireNonEmptyString(siteContent.startupLoading?.cookieVersion, 'startupLoading.cookieVersion');
if (!Number.isInteger(siteContent.startupLoading?.cookieMaxAgeDays)) {
  throw new TypeError('Content field "startupLoading.cookieMaxAgeDays" must be an integer.');
}
if (typeof siteContent.identityAffiliationLogos !== 'boolean') {
  throw new TypeError('Content field "identityAffiliationLogos" must be a boolean.');
}
requireNonEmptyString(siteContent.assets?.avatar, 'assets.avatar');
requireNonEmptyString(siteContent.assets?.profileLink, 'assets.profileLink');
requireNonEmptyString(siteContent.assets?.externalLink, 'assets.externalLink');
requireStringArray(siteContent.heroGreetings, 'heroGreetings');
if (!Number.isInteger(siteContent.copyrightStartYear)) {
  throw new TypeError('Content field "copyrightStartYear" must be an integer.');
}

export const site = deepFreeze(siteContent);
