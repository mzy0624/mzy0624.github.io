# Customizing the Single-User Homepage

Everything specific to the homepage owner lives in this directory. Reusing the template should not require edits under `src/`.

## Files

- `site.json`: owner name, publication name, Agent name, page metadata, copyright year, avatar path, startup-loader Cookie, source-repository button and hover Easter egg, composer placeholder, and hero greetings.
- `profile.json`: emails, affiliations, links, education, skills, hobbies, services, and correspondence addresses.
- `answers.json`: fixed answer variants, structured answer blocks, portrait metadata, unknown responses, and repeat responses.
- `questions.json`: labels, display prompts, synonymous questions, keyword fallback data, routing-data examples, Try Asking placement, and follow-up placement.
- `publications.json`: publication metadata and external publication-resource URLs.
- `router/label-boundaries.json`: semantic inclusion and exclusion rules for every label.
- `router/routing-evaluation-source.json`: calibration and test semantic groups used to evaluate routing changes.
- `router/question-bank.json`: the human-reviewed English prototypes embedded by the browser router.

Static files referenced by these JSON files live under `public/assets/`. Paths are written relative to `public/`, for example `assets/avatar.png`.

`site.json → startupLoading` controls the initial loading screen and its first-party cache Cookie. Increase `cookieVersion` whenever critical UI assets are replaced. On every visit, the loader waits only for the avatar and essential account/link icons, mounts the page, verifies that the corresponding DOM images are decoded, and waits for browser paint before it disappears. The Cookie records the validated asset version but never bypasses this display check. After entry, email icons, institution logos, answer icons, and portrait media are loaded one at a time during browser idle periods; portrait media is ordered last.

## Reuse checklist

1. Replace the values in `site.json`.
2. Replace all personal records in `profile.json`.
3. Replace answer text and portrait paths in `answers.json`.
4. Update the synonymous questions in `questions.json` when the supported knowledge changes.
   If labels or their semantic scope change, update the two files under `router/` as well.
5. Replace `publications.json` and the matching directories under `public/assets/publications/`.
6. Replace the avatar, portrait, institution logos, and other icons referenced by your content.
7. Validate and run the site:

```bash
npm install
npm run content:validate
npm run dev
```

`npm run content:validate` reports missing fields, broken answer/label references, invalid publication ownership, and missing local assets.

## Answer format

Each entry in `answers.json` has a stable `id`, a `repeatMode`, and one or more `variants`. Every variant requires `text` and may also contain:

- `content`: token-level rich text segments with optional `strong` or `href` fields.
- `blocks`: structured sections such as `education`, `skills`, `hobbies`, `services`, `publications`, `emails`, `correspondence`, `statement`, or `emphasisList`.
- `image`: an on-demand image with `src`, `fullSrc`, and `alt`.
- `samplingWeight`: a relative sampling weight for that variant.

Every label in `questions.json` points to an answer through `answerId`. Labels listed in `suggestionPlacements.tryAsking` appear on the home screen; `followUps` controls the questions shown after an answer. Labels omitted from both remain routable but hidden. `trainingQuestions` contains the English and Chinese semantic bases used when regenerating router data, while `nearScopePrompts` contains intentionally rejected boundary examples.

Changing an existing answer or question does not require application-code changes. A genuinely new structured block type still requires a renderer in `src/components/answers.js`.

## Publications

The name used to underline the homepage owner in author lists is `site.json → owner.publicationName`. Every publication must include that exact value in `authors`.

Local resources use fixed filenames under `public/assets/publications/<id>/`:

```text
paper.pdf
code.zip
poster.png
citation.bib
```

The publication manager reads the same content configuration:

```bash
npm run publication:manage
```
