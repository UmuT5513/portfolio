# ML Portfolio

Bilingual (EN/TR) static portfolio site showcasing LLM projects, built with
Astro and Tailwind CSS.

## Development

```bash
npm install
npm run dev       # local dev server
npm run test      # data/validation unit tests
npm run check     # astro type check
npm run build     # static build into dist/
```

## Content

- `src/data/projects.json` — project metadata (id, repo, categories, image,
  links, featured, optional `private`/`in_live`). Language-independent. A
  project can belong to multiple `categories`; `private: true` hides its links
  and shows a "Private" badge, `in_live: true` shows a live link badge.
- `src/data/certificates.json` — language-independent certificate metadata
  (id, issuer, date, validUntil, url).
- `src/data/content.en.json` / `src/data/content.tr.json` — localized site and
  project text (title, summary, markdown description, tags), plus skills,
  experience, education and localized certificates. Same schema.
- `src/i18n/` — UI strings and category labels.

Categories: `chatbot | rag | agents | llm | fine-tuning | traditional-machine-learning | other`.

The build fails fast on invalid categories, missing images, missing required
fields, or id mismatches between the metadata and language files.

## Importing images

```bash
npm run import:images        # fills placeholder project images from GitHub
npm run import:images -- --force   # re-download and overwrite all images
```

For each project it uses the first non-badge README image, falling back to the
GitHub OpenGraph cover for public repos, and leaves the placeholder otherwise.

## Deploy

```bash
docker compose up -d --build   # serves on host port 8083
```

Point the host nginx reverse proxy for a subdomain/path at port `8083`. The
container itself listens on port 80.