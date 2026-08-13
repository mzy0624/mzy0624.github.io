import { asset, element } from '../api/dom.js';

function createProfileMenu({ id, label, title, emoji, items, compact = false }) {
  const popover = element(
    'div',
    {
      className: `header-popover${compact ? ' header-popover--compact' : ''}`,
      attributes: { id, role: 'menu', 'aria-label': label },
    },
    element('p', { className: 'header-popover-title', text: title }),
    items.map((item) =>
      element(
        'a',
        {
          className: `header-menu-option${item.eyebrow ? '' : ' header-menu-option--single-line'}`,
          attributes: {
            href: item.href,
            role: 'menuitem',
            ...(item.external ? { target: '_blank', rel: 'noreferrer' } : {}),
          },
        },
        element('img', {
          attributes: { src: asset(item.icon), alt: '', 'aria-hidden': 'true' },
        }),
        element(
          'span',
          {},
          item.eyebrow ? element('small', { text: item.eyebrow }) : null,
          element('strong', { text: item.text }),
        ),
      ),
    ),
  );
  const trigger = element(
    'button',
    {
      className: 'header-menu-trigger',
      attributes: {
        type: 'button',
        'aria-label': label,
        'aria-haspopup': 'menu',
        'aria-controls': id,
      },
    },
    element('span', {
      className: 'header-menu-trigger-emoji',
      text: emoji,
      attributes: { 'aria-hidden': 'true' },
    }),
  );
  const menu = element('div', { className: 'header-menu' }, trigger, popover);

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

export function createProfileMenus(profile, idPrefix) {
  return element(
    'nav',
    { className: 'profile-menus', attributes: { 'aria-label': 'Contact and profile links' } },
    createProfileMenu({
      id: `${idPrefix}-email-popover`,
      label: 'Show email addresses',
      title: 'Email me',
      emoji: '📬',
      items: profile.emails.map((email) => ({
        href: `mailto:${email.address}`,
        icon: email.icon,
        eyebrow: email.label,
        text: email.address,
      })),
    }),
    createProfileMenu({
      id: `${idPrefix}-social-popover`,
      label: 'Show external profiles',
      title: 'Find me online',
      emoji: '🔗',
      compact: true,
      items: profile.socialProfiles.map((socialProfile) => ({
      href: profile.links[socialProfile.hrefKey],
      icon: socialProfile.icon,
      text: socialProfile.label,
        external: true,
      })),
    }),
  );
}
