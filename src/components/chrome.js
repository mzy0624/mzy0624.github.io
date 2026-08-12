import { asset, element } from '../api/dom.js';
import { selectHeroGreeting } from '../data/hero-greetings.js';

function createEmailMenu(profile) {
  const popoverId = 'header-email-popover';
  const popover = element(
    'div',
    {
      className: 'email-popover',
      attributes: { id: popoverId, role: 'menu', 'aria-label': 'Email addresses' },
    },
    element('p', { className: 'email-popover-title', text: 'Email me' }),
    profile.emails.map((email) =>
      element(
        'a',
        {
          className: 'email-option',
          attributes: { href: `mailto:${email.address}`, role: 'menuitem' },
        },
        element('img', {
          attributes: { src: asset(email.icon), alt: '', 'aria-hidden': 'true' },
        }),
        element(
          'span',
          {},
          element('small', { text: email.label }),
          element('strong', { text: email.address }),
        ),
      ),
    ),
  );
  const trigger = element(
    'button',
    {
      className: 'email-trigger',
      attributes: {
        type: 'button',
        'aria-label': 'Show email addresses',
        'aria-haspopup': 'menu',
        'aria-controls': popoverId,
      },
    },
    element('span', {
      className: 'email-trigger-emoji',
      text: '📬',
      attributes: { 'aria-hidden': 'true' },
    }),
  );
  const menu = element('div', { className: 'email-menu' }, trigger, popover);

  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.activeElement?.blur();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!menu.contains(event.target) && menu.contains(document.activeElement)) {
      document.activeElement?.blur();
    }
  });

  return menu;
}

function profileIconLink({ href, icon, label }) {
  return element(
    'a',
    {
      className: 'profile-icon-link',
      attributes: { href, target: '_blank', rel: 'noreferrer', 'aria-label': label, title: label },
    },
    element('img', { attributes: { src: asset(icon), alt: '', 'aria-hidden': 'true' } }),
  );
}

export function createHeader(profile) {
  return element(
    'header',
    { className: 'site-header' },
    element(
      'div',
      { className: 'header-identity' },
      element(
        'a',
        { className: 'brand', attributes: { href: './', 'aria-label': 'Zi-Yu Mao home' } },
        element('img', {
          className: 'brand-avatar',
          attributes: { src: asset('assets/avatar.png'), alt: '' },
        }),
        element('span', { className: 'brand-title', text: 'Zi-Yu Mao (毛子钰)' }),
      ),
    ),
    element(
      'nav',
      { className: 'header-nav', attributes: { 'aria-label': 'Profile links' } },
      createEmailMenu(profile),
      profileIconLink({
        href: profile.links.github,
        icon: 'assets/icons/github.svg',
        label: 'GitHub',
      }),
      profileIconLink({
        href: profile.links.googleScholar,
        icon: 'assets/icons/google-scholar.svg',
        label: 'Google Scholar',
      }),
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
