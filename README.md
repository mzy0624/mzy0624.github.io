# Single-User Academic Agent Template

[中文说明](README-ZH.md)

An agent-style, content-driven personal academic homepage. The site is fully static and does not call an LLM API. Free-form questions are routed to curated answers by a lightweight embedding model that runs locally in the browser.

The application supports one homepage owner at a time. Owner information lives in [`content/`](content/README.md), with self-contained paper directories under [`publications/`](publications/README.md), so another person can reuse the template by replacing JSON content and assets without editing application code.

## Features

- ChatGPT-inspired, responsive interface for desktop and mobile
- Suggested questions, follow-up questions, and multiple conversation sessions
- Token-by-token output for both text and structured content
- Curated, replaceable answers about the owner's background, research, publications, technical skills, hobbies, academic service, and contact information
- Browser-side semantic routing with no server or API key
- Calibrated `unknown` fallback for questions outside the supported knowledge base
- Answer-level repetition handling with multiple response variants
- Publication cards with TL;DR, PDF, Code, Poster, BibTeX, and venue links when available
- On-demand portrait output with an image-generation-style progress sequence and full-resolution lightbox
- An interactive CLI for maintaining the publication list

## Development

Install the dependencies and start the Vite development server:

```bash
npm install
npm run content:validate
npm run dev
```

To test the site from another device on the same local network:

```bash
npm run dev -- --host 0.0.0.0
```

Then open `http://<your-local-ip>:5173/` on that device.

Run the test suite and create a production build with:

```bash
npm test
npm run build
```

The production output is written to `dist/`. To inspect it locally:

```bash
npm run preview
```

## How Question Routing Works

Suggested questions and follow-up questions already carry a known label, so selecting one retrieves the corresponding answer directly without running semantic routing.

For a manually entered question, the site:

1. Loads `Xenova/all-MiniLM-L6-v2` in a Web Worker when the local router is first needed.
2. Generates a normalized 384-dimensional embedding for the input.
3. Compares it with precomputed embeddings from the curated question bank.
4. Scores every label using the mean of its five strongest similarities.
5. Routes to the best label when its score reaches the calibrated threshold; otherwise, it returns an `unknown` response.
6. Falls back to the deterministic router if browser-side model inference is unavailable.

The model, tokenizer, ONNX runtime, question-bank embeddings, and router configuration are served from `public/`. They do not require runtime access to Hugging Face. The first free-form question downloads roughly 35 MB of local model and WebAssembly assets, which the browser can cache for later visits.

The router only selects an answer ID. All answer content is fixed, local, and streamed through the Agent API as text tokens or structured block events. It is therefore a training-free retrieval and routing system rather than a generative chatbot.

More implementation details and the current calibration results are available in [training/EMBEDDING_ROUTER.md](training/EMBEDDING_ROUTER.md).

## Managing Publications

For routine maintenance, use the interactive publication manager:

```bash
npm run publication:manage
```

It supports listing, adding, editing, and removing publications. The same operations are also available as individual commands:

```bash
npm run publication:manage -- list
npm run publication:manage -- add
npm run publication:manage -- edit paper-id
npm run publication:manage -- remove paper-id
```

The manager maintains the publication type, title, author order, first or co-first authorship, full venue name, venue abbreviation, official URL, TL;DR, and optional PDF, Code, Poster, and BibTeX resources. Before editing or removing an entry, it creates a recoverable copy in `publication-backups/`.

Publications use one of the following types:

- `conference`
- `journal`
- `technical-report` (Technical Report)
- `preprint`

They are displayed in that order, with newer papers listed first within each group.

### Manifest-based import

Each paper lives in `publications/<id>/`, with its metadata in `publication.json` and optional attachments alongside it. Adding a directory is enough: there is no central publication list to register it in. The development server automatically refreshes when directories, metadata, or attachments change. Copy `scripts/publication.template.json` to get started; `id` is inferred from the directory name, or must match it if explicitly supplied.

```text
publications/
└── my-paper/
    ├── publication.json
    ├── paper.pdf
    ├── code.zip
    ├── poster.png
    └── citation.bib
```

Validate the import before applying it:

```bash
npm run publication:add -- /path/to/publication-folder --dry-run
npm run publication:add -- /path/to/publication-folder
```

The importer validates an externally prepared directory and copies its metadata and recognized resources into `publications/<id>/`. If the folder is already there, it only validates and refreshes the local index. Missing optional files have no corresponding buttons. The interactive manager writes the same per-paper manifests and backs up the complete directory before editing or removing it.

Local resource paths are not stored in `publication.json`. External `http(s)` URLs may be supplied under `resources.pdf`, `resources.code`, `resources.poster`, `resources.bib`, and `resources.official`; an external URL takes precedence over a local file of the same type. The website continues to serve permitted attachments at `assets/publications/<id>/<filename>`. Manifests and unrecognized files are not copied to the production site.

### Local-only papers

Put a paper's **whole directory** in `.gitignore`, including `publication.json`. The default rule `/publications/private-*/` already covers folders such as `publications/private-draft/`. Other folder names can be ignored explicitly, for example `/publications/unpublished-method/`.

- `npm run dev`: includes every local paper, including ignored directories. Anyone who can access this development server can see them.
- `npm run build`: excludes Git-ignored manifests and attachments before generating metadata, bundles, source maps, or copied resources. It rechecks the source directories rather than trusting a cached local index. Git must be available and the project must be in a Git checkout for production filtering.
- GitHub Actions builds from the checked-out repository, where untracked, ignored private directories are absent. An ignore rule does not remove information that has already been committed to Git.

Keep publication source files outside `public/`; that directory is copied as-is by Vite. `src/data/publications.generated.json` is a disposable, ignored local index and should never be edited or committed.

Additional formatting rules:

- List `authors` in publication order.
- `firstAuthorCount` is the number of first authors counted from the beginning of the author list.
- The page automatically bolds first authors, underlines the name configured in `content/site.json → owner.publicationName`, and adds an equal-contribution note when applicable.
- Store the complete venue text in `venue` without an initial `In:`. The page adds `In:` to conference and journal papers but not to technical reports or preprints.
- `summary` appears in the TL;DR tooltip.
- When `resources.official` is present, `venueShort` becomes the final venue button and links to the official page.

Author display and contribution notes are independent of author order:

- Keep the complete, ordered author list in `authors`. Set optional `authorDisplayCount` to show only the first N names, followed by `et al.`. Hover, focus, or tap it to see the remaining authors in their original order.
- `firstAuthorCount` controls bold names and the automatic `* Equal contribution.` note when greater than one. A team author can be the sole bold author with `firstAuthorCount: 1`.
- `authorNotes` assigns custom symbols to specific authors, with each explanation shown on its own line. These notes do not bold names or imply equal contribution. The manager prompts for the display count and notes during add/edit; the manifest importer supports the same optional fields.
- For a compact team credit, set `authorCredit` to `{ "team": "SinapisAI Team", "role": "Core contributor", "name": "Zi-Yu Mao" }`. This displays `SinapisAI Team (Core contributor: Zi-Yu Mao)` instead of individual authors, `et al.`, and contribution notes, while retaining the complete `authors` list. Choose `team` as the author display mode in the manager to configure these fields; the manifest importer supports `authorCredit` too.

For example, a lead can precede a group of core contributors without belonging to that group:

```json
"authorNotes": [
  { "symbol": "†", "text": "Tech lead.", "authors": ["Carol Smith"] },
  { "symbol": "‡", "text": "Core contributors; names are listed in alphabetic order by last name.", "authors": ["Alice Adams", "Bob Brown"] }
]
```

The page preserves the author order you enter; it does not automatically sort names.

The resource index is regenerated automatically before development, testing, and production builds. It can also be refreshed manually:

```bash
npm run publication:sync
```

## Maintaining Questions and Answers

To replace the current owner's information, edit only the JSON files documented in [`content/README.md`](content/README.md) and the referenced files under `public/assets/`.

To add or modify a supported answer label:

1. Define fixed answer variants and structured blocks in `content/answers.json`.
2. Maintain labels, representative questions, synonymous questions, and placements in `content/questions.json`.
3. Add a block renderer to `src/components/answers.js` if the answer needs a new structured presentation.
4. Update the semantic boundary in `content/router/label-boundaries.json`.
5. Regenerate the routing data and embeddings, add tests for the new behavior, and run the full test suite.

Useful data commands:

```bash
npm run data:generate
npm run evaluation:generate
npm run embedding:prepare
```

`embedding:prepare` rebuilds all question-bank embeddings, recalibrates the rejection threshold on the calibration set, updates the browser configuration, and evaluates the frozen configuration on the test set.

The datasets, label boundaries, question bank, evaluation sets, and reports are documented in [training/README.md](training/README.md) and [training/EVALUATION.md](training/EVALUATION.md).

## Agent API

`AcademicAgent` is independent of the page components. It exposes answers as an asynchronous event stream:

```js
for await (const event of agent.ask('Tell me about your research.')) {
  // loading-start | loading-end | thinking-start | thinking-end
  // token | blocks
  // emphasis-list-* | image-start | image-progress | image | done
}
```

A known label can be passed as the second argument to bypass semantic routing:

```js
agent.ask('How about your publications?', 'papers');
```

## Project Structure

```text
content/                        # Replaceable profile, answers, and router content
├── site.json                  # Owner, Agent, SEO, avatar, and UI text
├── profile.json               # Education, skills, hobbies, services, and contact data
├── answers.json               # Fixed and repeated answer variants
└── questions.json             # Labels, question banks, and placements

publications/                   # One directory per paper; ignored papers stay local
└── <id>/publication.json       # Metadata, alongside paper.pdf and other attachments

src/
├── api/
│   ├── academic-agent.js       # Sessions, response variants, and streaming events
│   ├── dom.js                  # DOM creation helpers
│   └── typing-speed.js         # Length-aware output timing
├── components/                 # Header, sidebar, conversation, composer, and answer views
├── data/                       # Validated content adapters and generated indexes
├── models/
│   ├── intent-model.js         # Router interface
│   ├── embedding-intent-model.js
│   ├── embedding-worker.js     # Local inference in a browser Worker
│   └── deterministic-intent-model.js # Fallback router
├── app.js                      # Application and conversation-state orchestration
├── main.js                     # Application entry point
└── styles/
    ├── main.css                # Shared styles
    ├── desktop.css             # Desktop-specific layout and values
    └── mobile.css              # Tablet and mobile layout and values

training/                       # Question bank, boundaries, datasets, and evaluations
scripts/                        # Data generation, calibration, and publication tools
public/                         # Models, WebAssembly runtime, and static assets
```

## Static Deployment

The Vite configuration uses relative asset paths, so the generated `dist/` directory can be hosted at either a domain root or a repository subpath. This makes it suitable for GitHub Pages and other static hosting services.

For GitHub Pages, configure a GitHub Actions workflow to install dependencies with `npm ci`, run `npm run build`, and publish `dist/` as the Pages artifact. The repository does not require a server-side runtime or any secret API keys.

Because the browser performs local inference, all model and WebAssembly files under `public/` must be included in the deployment. GitHub Pages cannot provide the cross-origin isolation headers needed by multithreaded WebAssembly, so the router intentionally uses a single WASM thread.

## Model Attribution

The browser router uses the quantized ONNX version of [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), distributed for Transformers.js as [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2). Its license is included in `public/models/Xenova/all-MiniLM-L6-v2/MODEL_LICENSE.md`.
