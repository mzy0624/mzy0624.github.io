import { asset, element } from '../api/dom.js';
import { groupPublications } from '../data/publication-groups.js';

let publicationTooltipSequence = 0;

function isWebUrl(value) {
  return /^https?:\/\//i.test(value);
}

function externalLink(text, href) {
  return element('a', {
    className: 'response-link',
    text,
    attributes: { href, target: '_blank', rel: 'noreferrer' },
  });
}

function publicationResource(label, href, { download = false, className = '' } = {}) {
  if (!href) return null;

  const isExternal = isWebUrl(href);
  const resolvedHref = isExternal ? href : asset(href);
  const shouldDownload = download && !isExternal;

  return element('a', {
    className: ['paper-action', className].filter(Boolean).join(' '),
    text: label,
    attributes: {
      href: resolvedHref,
      target: shouldDownload ? null : '_blank',
      rel: shouldDownload ? null : 'noreferrer',
      download: shouldDownload,
    },
  });
}

function publicationSummaryButton(summary) {
  if (!summary) return null;
  publicationTooltipSequence += 1;
  const tooltipId = `publication-tldr-${publicationTooltipSequence}`;

  return element(
    'span',
    { className: 'publication-tldr-control' },
    element('button', {
      className: 'paper-action publication-tldr-trigger',
      text: 'TL;DR',
      attributes: {
        type: 'button',
        'aria-describedby': tooltipId,
      },
    }),
    element('span', {
      className: 'publication-tldr-tooltip',
      text: summary,
      attributes: { id: tooltipId, role: 'tooltip' },
    }),
  );
}

function bibliographyButton(bib) {
  if (!bib) return null;
  if (isWebUrl(bib)) return publicationResource('Bib', bib);

  const button = element('button', {
    className: 'paper-action',
    text: 'Copy Bib',
    attributes: { type: 'button' },
  });

  button.addEventListener('click', async () => {
    try {
      if (!globalThis.navigator?.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await globalThis.navigator.clipboard.writeText(bib);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy unavailable';
    }
    globalThis.setTimeout(() => {
      button.textContent = 'Copy Bib';
    }, 1400);
  });

  return button;
}

function publicationActions(publication) {
  const actions = [
    publicationSummaryButton(publication.summary),
    publicationResource('PDF', publication.resources.pdf),
    publicationResource('Code', publication.resources.code, { download: true }),
    publicationResource('Poster', publication.resources.poster),
    bibliographyButton(publication.resources.bib),
    publicationResource(publication.venueShort, publication.resources.official, {
      className: 'publication-venue-action',
    }),
  ].filter(Boolean);

  if (actions.length === 0) return null;
  return element(
    'div',
    {
      className: 'paper-actions',
      attributes: {
        'aria-label': `Resources for ${publication.title}`,
        'data-stream-atomic': '',
      },
    },
    actions,
  );
}

function publicationAuthors(publication, profileName) {
  const authors = Array.isArray(publication.authors)
    ? publication.authors
    : [publication.authors];
  const firstAuthorCount = Number.isInteger(publication.firstAuthorCount)
    ? publication.firstAuthorCount
    : 1;
  const hasEqualContribution = firstAuthorCount > 1;
  const authorLine = element('p', { className: 'response-muted publication-authors' });

  authors.forEach((author, index) => {
    if (index > 0) {
      authorLine.append(document.createTextNode(', '));
    }

    let authorName = element('span', { text: author });
    if (author === profileName) {
      authorName = element('u', { className: 'publication-self-author' }, authorName);
    }
    if (index < firstAuthorCount) {
      authorName = element('strong', { className: 'publication-first-author' }, authorName);
    }
    authorLine.append(authorName);

    if (hasEqualContribution && index < firstAuthorCount) {
      authorLine.append(element('sup', { className: 'publication-equal-marker', text: '*' }));
    }
  });

  return [
    authorLine,
    hasEqualContribution
      ? element('p', {
        className: 'publication-equal-contribution',
        text: '* Equal contribution.',
      })
      : null,
  ];
}

function publicationEntry(publication, profileName) {
  return element(
    'article',
    { className: 'publication-entry' },
    element('h2', { className: 'publication-title', text: publication.title }),
    element(
      'div',
      { className: 'publication-copy' },
      publicationAuthors(publication, profileName),
      element(
        'p',
        { className: 'publication-venue' },
        publication.type === 'preprint'
          ? null
          : element('span', { className: 'publication-venue-prefix', text: 'In: ' }),
        element('em', { text: publication.venue }),
      ),
    ),
    element(
      'div',
      { className: 'publication-details' },
      publicationActions(publication),
    ),
  );
}

function list(items, className = 'response-list') {
  return element(
    'ul',
    { className },
    items.map((item) => element('li', {}, item)),
  );
}

function hobbyDetails(details) {
  return element(
    'ul',
    { className: 'hobby-details' },
    details.map((detail) => {
      const content = typeof detail === 'string'
        ? detail
        : detail.content.map((part) =>
          typeof part === 'string'
            ? part
            : element(part.strong ? 'strong' : 'span', { text: part.text }),
        );
      return element('li', {}, content);
    }),
  );
}

function educationDetails(profile, details) {
  return element(
    'ul',
    { className: 'education-details' },
    details.map((parts) =>
      element(
        'li',
        {},
        parts.map((part) => (
          typeof part === 'string'
            ? part
            : externalLink(part.text, profile.links[part.hrefKey])
        )),
      ),
    ),
  );
}

const blockRenderers = {
  statement(_profile, block) {
    return element(
      'p',
      {
        className: [
          'response-detail',
          'answer-statement',
          block.centered ? 'is-centered' : '',
        ].filter(Boolean).join(' '),
      },
      element(block.strong ? 'strong' : 'span', { text: block.text }),
    );
  },

  publications(profile) {
    const sections = groupPublications(profile.publications);

    return element(
      'div',
      { className: 'response-detail publication-list' },
      sections.map(({ heading, publications }) =>
        element(
          'section',
          { className: 'publication-section' },
          element('h2', { className: 'publication-heading', text: heading }),
          publications.map((publication) => publicationEntry(publication, profile.name)),
        ),
      ),
    );
  },

  education(profile) {
    return element(
      'section',
      { className: 'response-detail education-list' },
      profile.education.map((education) =>
        element(
          'article',
          { className: 'education-item' },
          element(
            'div',
            { className: 'education-summary' },
            element('img', {
              className: 'education-icon',
              attributes: { src: asset(education.icon), alt: '', 'aria-hidden': 'true' },
            }),
            element(
              'div',
              { className: 'education-copy' },
              element('h2', { text: education.degree }),
              element('p', { className: 'education-period', text: education.period }),
            ),
          ),
          educationDetails(profile, education.details),
        ),
      ),
    );
  },

  skills(profile) {
    return element(
      'div',
      { className: 'response-detail skill-list' },
      profile.skills.map((skill) =>
        element(
          'div',
          { className: 'skill-item' },
          element('img', {
            className: 'skill-icon',
            attributes: { src: asset(skill.icon), alt: '', 'aria-hidden': 'true' },
          }),
          element(
            'div',
            { className: 'skill-copy' },
            element('strong', { text: skill.name }),
            element(
              'span',
              {},
              `Since ${skill.since}`,
              skill.note ? ` · ${skill.note}` : '',
            ),
          ),
        ),
      ),
    );
  },

  emails(profile) {
    return element(
      'ul',
      { className: 'response-detail contact-email-list' },
      profile.emails.map((email) =>
        element(
          'li',
          { className: 'contact-email-item' },
          element('img', {
            className: 'contact-email-icon',
            attributes: { src: asset(email.icon), alt: '', 'aria-hidden': 'true' },
          }),
          element(
            'div',
            { className: 'contact-email-copy' },
            element('strong', { text: email.label }),
            element('a', {
              className: 'response-link',
              text: email.address,
              attributes: { href: `mailto:${email.address}` },
            }),
          ),
        ),
      ),
    );
  },

  hobbies(profile) {
    return element(
      'section',
      { className: 'response-detail hobby-list' },
      profile.hobbies.map((hobby) =>
        element(
          'article',
          { className: 'hobby-item' },
          element(
            'div',
            { className: 'hobby-summary' },
            element('img', {
              className: 'hobby-icon',
              attributes: { src: asset(hobby.icon), alt: '', 'aria-hidden': 'true' },
            }),
            element(
              'div',
              { className: 'hobby-copy' },
              element('h2', { text: hobby.name }),
              element('p', { className: 'hobby-since', text: `Since ${hobby.since}` }),
            ),
          ),
          hobby.details.length ? hobbyDetails(hobby.details) : null,
        ),
      ),
    );
  },

  services(profile) {
    return element(
      'div',
      { className: 'response-detail service-list' },
      element(
        'section',
        { className: 'service-section' },
        element('h2', { className: 'service-heading', text: 'Conference Reviewer' }),
        profile.services.academic.map((service) =>
          element(
            'article',
            { className: 'service-item' },
            element('img', {
              className: 'service-item-icon',
              attributes: { src: asset(service.icon), alt: '', 'aria-hidden': 'true' },
            }),
            element(
              'div',
              { className: 'service-copy' },
              element('h3', { text: service.organization }),
              element('p', {}, element('strong', { text: 'Role: ' }), service.role),
            ),
          ),
        ),
      ),
      element(
        'section',
        { className: 'service-section' },
        element('h2', { className: 'service-heading', text: 'Teaching Assistant' }),
        profile.services.teachingAssistants.map((experience) =>
          element(
            'article',
            { className: 'service-item service-teaching-item' },
            element('img', {
              className: 'service-item-icon',
              attributes: { src: asset(experience.icon), alt: '', 'aria-hidden': 'true' },
            }),
            element(
              'div',
              { className: 'service-copy' },
              element('h3', { text: experience.course }),
              element(
                'div',
                { className: 'service-teaching-meta' },
                element('p', {}, element('strong', { text: 'Teacher: ' }), experience.teacher),
                element('p', {}, element('strong', { text: 'Semesters: ' }), experience.semesters.join(' · ')),
              ),
            ),
          ),
        ),
      ),
    );
  },

  correspondence(profile) {
    const addresses = [
      ['🏣 Laboratory', profile.correspondence.laboratory],
      ['📪 Mailing Address', profile.correspondence.mailAddress],
    ];

    return element(
      'section',
      { className: 'response-detail correspondence-list' },
      addresses.map(([title, lines]) =>
        element(
          'section',
          { className: 'correspondence-item' },
          element('h2', { text: title }),
          element(
            'address',
            {},
            lines.map((line, index) => [
              line,
              index < lines.length - 1 ? element('br') : null,
            ]),
          ),
        ),
      ),
    );
  },
};

export function renderAnswerBlocks(blocks, profile) {
  return blocks
    .map((block) => blockRenderers[block.type]?.(profile, block))
    .filter(Boolean);
}
