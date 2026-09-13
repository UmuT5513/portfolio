# LLM Portfolio Site — Design Spec

Date: 2026-09-13

## Overview

A personal portfolio website that showcases the owner's LLM/AI projects to
international clients. The owner manages the site themselves via file-based
content; visitors see a public showcase. The site is fully static, hosted on
the owner's own server behind an existing nginx reverse proxy, alongside two
other projects already running there.

Languages: Turkish and English, full site translation with a language switcher.

## Approach

Approach A — fully static build.

- `src/data/*.json` holds all content
- Astro reads the JSON at build time and generates static HTML for every page
- Each language gets its own route set (`/en/...`, `/tr/...`)
- Output is plain static files served by nginx inside a Docker container
- No runtime database, no server-side code at runtime
- Umami analytics script injected at build time (only if configured)

The user may add automatic rebuild-on-change later; it is explicitly out of
scope for this version.

## Architecture

```
src/data/projects.json + src/data/content.en.json + src/data/content.tr.json + public/images/
        |  Astro build (Tailwind, markdown descriptions, i18n)
        v
  static HTML/CSS/JS output (dist/ — /en/* and /tr/* route sets)
        |  Docker image (nginx-alpine)
        v
  container port 80  <-  host nginx reverse proxy (existing)
```

- All content is read at build time. No runtime data storage.
- The Docker image is nginx-based and serves only the `dist/` output.
- The existing host nginx reverse-proxies (subdomain or path) to the
  container port. Exact routing is the user's existing setup; the container
  itself listens on port 80.
- Docker image name: `ml-portfolio` (no clash with the two existing projects).

## Data Model

Content is split into language-independent and language-dependent files:

### src/data/projects.json (language-independent)

```json
{
  "projects": [
    {
      "id": "unique-slug",
      "category": "rag",
      "image": "/images/projects/example.png",
      "links": { "github": "", "demo": "", "website": "" },
      "featured": false
    }
  ]
}
```

- `id` must be a URL-safe unique slug.
- `category` must be one of:
  `chatbot | rag | agents | fine-tuning | traditional-machine-learning | other`
- `image` is a path under `public/images/`.
- `links` fields may be empty strings (link hidden when empty).
- `featured` controls display on the homepage.
- This file holds no display text; all human-readable strings live in the
  language content files.

### src/data/content.en.json and src/data/content.tr.json

Both files share the same schema. Site-level and per-project display text,
localized per language:

```json
{
  "site": {
    "name": "Your Name",
    "role": "AI Engineer",
    "bio": "Short bio text.",
    "profileImage": "/images/profile.png",
    "contact": { "email": "", "linkedin": "", "github": "" },
    "cvFile": "/cv.pdf",
    "analytics": { "provider": "umami", "src": "", "websiteId": "" }
  },
  "projects": [
    {
      "id": "unique-slug",
      "title": "Project Title",
      "summary": "One-line description",
      "description": "Longer markdown description",
      "tags": ["RAG", "LangChain"]
    }
  ]
}
```

- `site.name` and `site.role` may be the same in both languages; each file is
  still fully self-contained so either can be edited independently.
- `description` supports markdown.
- Every `projects[].id` in a content file must match an `id` in
  `projects.json` (validated at build time). Every project in `projects.json`
  should have a matching localized entry in each language file.
- `analytics.src` and `analytics.websiteId` may be empty strings; if either is
  empty, no analytics script is rendered. Analytics is read from the default
  language file only.
- No WhatsApp field in contact.

### UI strings (i18n)

Navigation labels, buttons, category label names, and other UI strings are in
`src/i18n/en.ts` and `src/i18n/tr.ts`.

### Images

- Project images live in `public/images/projects/`, referenced by path.
- Profile image lives in `public/images/`.
- Images are optimized at build time (Astro Image component).
- CV file: `public/cv.pdf`.

## Pages and Components

Every page exists once per language under `/en/` and `/tr/` prefixes. `/`
redirects to the default language (`/en`).

| Page            | Route                    | Content |
|-----------------|--------------------------|---------|
| Home            | `/en`, `/tr`             | Hero (name, role, bio, profile image, CTA contact links) + featured projects + about summary |
| Projects        | `/en/projects`, `/tr/projects` | All projects with category filtering |
| Project detail  | `/en/projects/[id]`, `/tr/projects/[id]` | Title, category, markdown description, image, tags, github/demo/website links |
| About           | `/en/about`, `/tr/about` | Bio, contact links, CV download button |
| 404             | —                        | Custom 404 page |

Components:
- `Header` — navigation (Home, Projects, About) + language switcher (EN/TR
  toggle that jumps to the same page in the other language)
- `Footer` — contact links
- `ProjectCard` — card on projects page (image, title, category, summary)
- `CategoryFilter` — category filter UI (client-side JS, URL query param)
- `SEOHead` — meta title/description, Open Graph tags (WhatsApp/LinkedIn
  preview, `og:locale`), Twitter card, `hreflang` alternate links, correct
  `<html lang>`
- `Analytics` — Umami script, rendered only when configured

## Styling

- Light, minimal theme
- Tailwind CSS
- Mobile-first responsive (WhatsApp/LinkedIn link sharing must preview nicely)
- Turkish and English

## Build-Time Validation (fail-fast)

- Invalid category value -> build error
- Missing image file -> build error
- Missing required fields -> build error
- Localized project entry with an `id` that has no match in `projects.json` ->
  build error
- Project in `projects.json` missing a localized entry in a language file ->
  build error
- Validation runs during `astro build`; the build fails fast instead of
  silently producing broken output.

## Deployment

- Dockerfile: multi-stage — Node build stage, then nginx-alpine final stage
  copying only `dist/`.
- nginx config inside container: serves static files on port 80, gzip, cache
  headers for assets.
- `docker-compose.yml`: build + port mapping.
- Image name `ml-portfolio`.
- Host nginx reverse proxy routes a subdomain/path to the container (existing
  setup; user handles it).

## Testing

- `astro build` must complete without errors.
- JSON schema validation covers required fields, category values, image
  existence, and the localized-entry/id cross-check between `projects.json`
  and both language files.
- No heavy test framework — static site, low risk.

## Error Handling

- Missing image file -> build error (not silent).
- Invalid category -> build error.
- Unknown project route -> custom 404 page.

## Out of Scope

- Automatic rebuild on content change (possible future enhancement).
- Admin/editor UI.
- Third/further languages beyond Turkish and English.
- Dark mode.
- Search functionality.