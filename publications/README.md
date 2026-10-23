# Paper Directories

Every immediate subdirectory with a `publication.json` is discovered automatically. There is no central registry.

```text
publications/my-paper/
├── publication.json
├── paper.pdf       # optional
├── code.zip        # optional
├── poster.png      # optional
└── citation.bib    # optional
```

Copy `scripts/publication.template.json` as a starting point. The directory name supplies `id`; if specified in the JSON, `id` must match the directory name. Use lowercase letters, digits, and hyphens. Set `type` to `conference`, `journal`, `technical-report`, or `preprint` to choose the section. Missing attachments simply have no buttons. `resources` is only needed for external URLs, which take priority over local files.

The development server refreshes automatically when paper directories or their files change. The optional manager (`npm run publication:manage`) and importer (`npm run publication:add -- /path/to/paper`) maintain the same directory format.

Sections appear in the order Conference Paper, Journal Paper, Technical Report, then Preprint. Within each section, papers are sorted by the owner's position in the full `authors` list (matching `owner.publicationName` in `content/site.json`), then by `year` newest first. Papers without the owner in their author list go last. Equal positions and years retain source order; author truncation and team display do not change the ranking.

## Local-only Papers

The root `.gitignore` already excludes `/publications/private-*/`. A complete paper in `publications/private-draft/` therefore appears in development but is omitted from production. You can add an explicit rule for any other paper directory instead.

Production builds use Git's ignore rules before reading metadata or bundling attachments, independently of the generated local index. They require Git and a Git checkout. Keep all publication sources here, outside `public/`, so ignored material cannot be copied by Vite's static-public-directory handling. GitHub Actions only receives the checked-out repository; ignore rules do not erase previously committed information.

The generated `src/data/publications.generated.json` index is ignored and disposable. Browser builds rescan directly, so a local development index containing private drafts cannot cause them to enter a production build. Development includes private papers for anyone with access to the development server.
