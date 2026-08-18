import { asset, element } from '../api/dom.js';
import { selectHeroGreeting } from '../data/hero-greetings.js';
import { site } from '../data/site.js';
import { createProfileMenus } from './profile-menus.js';

export function createHeader(profile) {
  return element(
    'header',
    { className: 'site-header' },
    element(
      'div',
      { className: 'header-identity' },
      element(
        'a',
        { className: 'brand', attributes: { href: './', 'aria-label': `${site.owner.name} home` } },
        element('img', {
          className: 'brand-avatar',
          attributes: { src: asset(site.assets.avatar), alt: '' },
        }),
        element('span', { className: 'brand-title', text: site.owner.name }),
      ),
      createProfileMenus(profile, 'header'),
    ),
  );
}

export function createHero() {
  return element(
    'section',
    { className: 'hero', attributes: { 'aria-labelledby': 'hero-title' } },
    element('h1', { text: selectHeroGreeting(), attributes: { id: 'hero-title' } }),
  );
}
