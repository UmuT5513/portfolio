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

- `src/data/projects.json` — project metadata (id, category, image, links,
  featured). Language-independent.
- `src/data/content.en.json` / `src/data/content.tr.json` — localized site and
  project text (title, summary, markdown description, tags). Same schema.
- `src/i18n/` — UI strings and category labels.

Categories: `chatbot | rag | agents | fine-tuning | traditional-machine-learning | other`.

The build fails fast on invalid categories, missing images, missing required
fields, or id mismatches between the metadata and language files.

## Deploy

```bash
docker compose up -d --build   # serves on host port 8090
```

Point the host nginx reverse proxy for a subdomain/path at port `8090`. The
container itself listens on port 80.