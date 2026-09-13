# LLM Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, bilingual (TR/EN) portfolio website that showcases the owner's LLM projects, deployed as an nginx Docker container behind an existing host reverse proxy.

**Architecture:** Astro reads file-based JSON content at build time and generates static HTML route sets for both languages (`/en/*`, `/tr/*`). Content is split into language-independent project metadata (`projects.json`) and localized site/project text (`content.en.json`, `content.tr.json`). A validation library fails the build fast on bad data. The output `dist/` is served by nginx-alpine inside a Docker image named `ml-portfolio`.

**Tech Stack:** Astro 5, Tailwind CSS 4 (via `@tailwindcss/vite`), `marked` (markdown descriptions), Astro Image component (image optimization), Vitest (unit tests for data/validation), Docker + nginx.

**Spec:** `docs/superpowers/specs/2026-09-13-llm-portfolio-design.md`

## Global Constraints

- Astro ^5 with built-in i18n routing; default locale `en`, locales `['en', 'tr']`, `prefixDefaultLocale: true`.
- Routes: `/en/*`, `/tr/*`; `/` redirects to `/en/`.
- Categories exactly: `chatbot | rag | agents | fine-tuning | traditional-machine-learning | other`.
- Content files: `src/data/projects.json` (language-independent), `src/data/content.en.json` and `src/data/content.tr.json` (identical schema, localized text). No display text in `projects.json`.
- UI strings (nav, buttons, category labels) in `src/i18n/`, never in `projects.json`.
- No WhatsApp contact field. Contact: `email`, `linkedin`, `github` only.
- Analytics read from the default language file (`en`) only; if `src` or `websiteId` is empty, render no script.
- Build must fail fast on: invalid category, missing image file, missing required fields, id cross-reference mismatch between `projects.json` and either language file.
- `role` = "AI Engineer" (default in template).
- Light, minimal theme; mobile-first; English + Turkish.
- Docker image name `ml-portfolio`; container listens on port 80; nginx-alpine final stage.
- English commit messages; one commit per task.

---

### Task 1: Scaffold Astro 5 + Tailwind 4 project with i18n config

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: `npm run dev` / `npm run build` / `npm run check` / `npm run test` scripts; Tailwind 4 loaded via Vite plugin; Astro i18n configured for `en`/`tr`.

- [ ] **Step 1: Write package.json, config files, and global stylesheet**

`package.json`:
```json
{
  "name": "ml-portfolio",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

`astro.config.mjs`:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
    routing: { prefixDefaultLocale: true },
  },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/base",
  "compilerOptions": {
    "resolveJsonModule": true,
    "types": ["node"]
  }
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

`.gitignore`:
```
node_modules/
dist/
.astro/
.DS_Store
```

`src/styles/global.css`:
```css
@import "tailwindcss";

@layer base {
  html {
    @apply antialiased;
  }
  body {
    @apply bg-white text-slate-800 font-sans;
  }
  h1, h2, h3 {
    @apply text-slate-900 font-semibold;
  }
  a {
    @apply text-slate-700 underline-offset-2 hover:text-slate-900;
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install astro @tailwindcss/vite tailwindcss marked && npm install -D typescript @astrojs/check @types/node vitest`
Expected: node_modules installed, no errors.

- [ ] **Step 3: Verify config loads**

Run: `npx astro check`
Expected: exits 0 with no errors (no pages yet, Astro emits a warning about no pages — acceptable; if it hard-errors, create an empty `src/pages/` dir and re-run).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts .gitignore src/styles/global.css
git commit -m "chore: scaffold Astro 5 + Tailwind 4 project with i18n config"
```

---

### Task 2: Data files, categories module, and validation library

**Files:**
- Create: `src/lib/categories.ts`
- Create: `src/lib/data.ts` (types only)
- Create: `src/lib/validate.ts`
- Create: `src/data/projects.json`
- Create: `src/data/content.en.json`
- Create: `src/data/content.tr.json`
- Create: `public/images/profile.png`
- Create: `public/images/projects/.gitkeep`
- Create: `public/cv.pdf`
- Test: `tests/categories.test.ts`
- Test: `tests/validate.test.ts`

**Interfaces:**
- Produces (consumed by later tasks):
  - `src/lib/categories.ts`: `CATEGORIES: readonly Category[]`, `Category` union, `isCategory(v: string): v is Category`
  - `src/lib/data.ts`: types `Lang = 'en' | 'tr'`, `ProjectLinks`, `ProjectMeta`, `Contact`, `AnalyticsConfig`, `SiteInfo`, `ProjectContent`, `ContentFile`, `LocalizedProject`
  - `src/lib/validate.ts`: `validateSite(site, checkFile?): string[]`, `validateProjects(projects, checkFile?): string[]`, `validateContent(file, lang, checkFile?): string[]`, `validateCrossReference(metaProjects, contentFiles): string[]`, `validateAll(data, checkFile?): string[]`, `FileChecker` type

- [ ] **Step 1: Write the failing tests**

`tests/categories.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CATEGORIES, isCategory } from '../src/lib/categories';

describe('isCategory', () => {
  it('accepts every defined category', () => {
    for (const c of CATEGORIES) {
      expect(isCategory(c)).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    expect(isCategory('random')).toBe(false);
    expect(isCategory('llm')).toBe(false);
  });
});
```

`tests/validate.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateAll, validateContent, validateCrossReference, validateProjects, validateSite } from '../src/lib/validate';

const okFile = () => true;
const missingFile = () => false;

describe('validateSite', () => {
  it('passes a valid site', () => {
    const site = {
      name: 'Your Name',
      role: 'AI Engineer',
      bio: 'Short bio.',
      profileImage: '/images/profile.png',
      contact: { email: '', linkedin: '', github: '' },
      cvFile: '/cv.pdf',
      analytics: { provider: 'umami', src: '', websiteId: '' },
    };
    expect(validateSite(site, okFile)).toEqual([]);
  });

  it('flags missing required fields', () => {
    const errors = validateSite({ name: '', role: 'AI Engineer' }, okFile);
    expect(errors.some((e) => e.includes('site.name'))).toBe(true);
    expect(errors.some((e) => e.includes('site.bio'))).toBe(true);
  });

  it('flags a missing profile image file', () => {
    const site = {
      name: 'A', role: 'R', bio: 'B',
      profileImage: '/images/missing.png',
      contact: {}, cvFile: '/cv.pdf',
      analytics: {},
    };
    const errors = validateSite(site, missingFile);
    expect(errors.some((e) => e.includes('profileImage'))).toBe(true);
  });
});

describe('validateProjects', () => {
  const validProject = {
    id: 'rag-chatbot',
    category: 'rag',
    image: '/images/projects/example.png',
    links: { github: '', demo: '', website: '' },
    featured: false,
  };

  it('passes valid projects', () => {
    expect(validateProjects([validProject], okFile)).toEqual([]);
  });

  it('rejects an invalid category', () => {
    const errors = validateProjects([{ ...validProject, category: 'nope' }], okFile);
    expect(errors.some((e) => e.includes('category'))).toBe(true);
  });

  it('rejects a bad slug', () => {
    const errors = validateProjects([{ ...validProject, id: 'Bad Slug!' }], okFile);
    expect(errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('rejects duplicate ids', () => {
    const errors = validateProjects([validProject, validProject], okFile);
    expect(errors.some((e) => e.includes('duplicated'))).toBe(true);
  });

  it('rejects a missing image file', () => {
    const errors = validateProjects([validProject], missingFile);
    expect(errors.some((e) => e.includes('image'))).toBe(true);
  });
});

describe('validateContent', () => {
  const content = {
    site: {
      name: 'A', role: 'R', bio: 'B',
      profileImage: '/images/profile.png',
      contact: {}, cvFile: '/cv.pdf',
      analytics: {},
    },
    projects: [{ id: 'rag-chatbot', title: 'T', summary: 'S', description: 'D', tags: ['RAG'] }],
  };

  it('passes valid content', () => {
    expect(validateContent(content, 'en', okFile)).toEqual([]);
  });

  it('flags a missing title', () => {
    const bad = { ...content, projects: [{ id: 'x', summary: 'S', description: 'D', tags: [] }] };
    const errors = validateContent(bad, 'en', okFile);
    expect(errors.some((e) => e.includes('title'))).toBe(true);
  });
});

describe('validateCrossReference', () => {
  it('flags a content id with no metadata match', () => {
    const meta = [{ id: 'a', category: 'rag', image: '/i.png', featured: false }];
    const content = { en: { projects: [{ id: 'zzz' }] } };
    const errors = validateCrossReference(meta, content);
    expect(errors.some((e) => e.includes('zzz'))).toBe(true);
  });

  it('flags a metadata id missing from a language file', () => {
    const meta = [{ id: 'a', category: 'rag', image: '/i.png', featured: false }];
    const content = { en: { projects: [] } };
    const errors = validateCrossReference(meta, content);
    expect(errors.some((e) => e.includes('missing from content.en'))).toBe(true);
  });
});

describe('validateAll', () => {
  it('aggregates errors from all sources', () => {
    const data = {
      projects: [{ id: 'a', category: 'bad', image: '', featured: false }],
      en: { projects: [{ id: 'nope' }] },
      tr: { projects: [] },
    };
    const errors = validateAll(data, okFile);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `src/lib/categories.ts`, `src/lib/validate.ts`, `src/lib/data.ts` do not exist.

- [ ] **Step 3: Write minimal implementation**

`src/lib/categories.ts`:
```ts
export const CATEGORIES = [
  'chatbot',
  'rag',
  'agents',
  'fine-tuning',
  'traditional-machine-learning',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
```

`src/lib/data.ts`:
```ts
import type { Category } from './categories';

export type Lang = 'en' | 'tr';

export interface ProjectLinks {
  github?: string;
  demo?: string;
  website?: string;
}

export interface ProjectMeta {
  id: string;
  category: Category;
  image: string;
  links: ProjectLinks;
  featured: boolean;
}

export interface Contact {
  email?: string;
  linkedin?: string;
  github?: string;
}

export interface AnalyticsConfig {
  provider?: string;
  src?: string;
  websiteId?: string;
}

export interface SiteInfo {
  name: string;
  role: string;
  bio: string;
  profileImage: string;
  contact: Contact;
  cvFile: string;
  analytics: AnalyticsConfig;
}

export interface ProjectContent {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
}

export interface ContentFile {
  site: SiteInfo;
  projects: ProjectContent[];
}

export interface LocalizedProject extends ProjectMeta {
  title: string;
  summary: string;
  description: string;
  tags: string[];
}
```

`src/lib/validate.ts`:
```ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isCategory } from './categories';

export type FileChecker = (publicPath: string) => boolean;

const realFileChecker: FileChecker = (publicPath) =>
  existsSync(join(process.cwd(), 'public', publicPath.replace(/^\//, '')));

const REQUIRED_SITE_KEYS = ['name', 'role', 'bio', 'profileImage', 'cvFile'] as const;
const REQUIRED_PROJECT_META_KEYS = ['id', 'category', 'image', 'featured'] as const;
const REQUIRED_CONTENT_PROJECT_KEYS = ['id', 'title', 'summary', 'description', 'tags'] as const;
const CATEGORY_LIST = 'chatbot | rag | agents | fine-tuning | traditional-machine-learning | other';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateSite(site: unknown, checkFile: FileChecker = realFileChecker): string[] {
  const errors: string[] = [];
  if (!isRecord(site)) return ['site must be an object'];
  for (const key of REQUIRED_SITE_KEYS) {
    if (typeof site[key] !== 'string' || site[key] === '') {
      errors.push(`site.${key} must be a non-empty string`);
    }
  }
  if (typeof site.profileImage === 'string' && site.profileImage !== '') {
    if (!checkFile(site.profileImage)) errors.push(`site.profileImage file not found: ${site.profileImage}`);
  }
  if (typeof site.cvFile === 'string' && site.cvFile !== '') {
    if (!checkFile(site.cvFile)) errors.push(`site.cvFile file not found: ${site.cvFile}`);
  }
  return errors;
}

export function validateProjects(projects: unknown, checkFile: FileChecker = realFileChecker): string[] {
  const errors: string[] = [];
  if (!Array.isArray(projects)) return ['projects must be an array'];
  const ids = new Set<string>();
  projects.forEach((p, i) => {
    const at = `projects[${i}]`;
    if (!isRecord(p)) {
      errors.push(`${at} must be an object`);
      return;
    }
    for (const key of REQUIRED_PROJECT_META_KEYS) {
      if (p[key] === undefined) errors.push(`${at}.${key} is required`);
    }
    if (typeof p.featured !== 'undefined' && typeof p.featured !== 'boolean') {
      errors.push(`${at}.featured must be a boolean`);
    }
    if (typeof p.id === 'string') {
      if (!/^[a-z0-9-]+$/.test(p.id)) {
        errors.push(`${at}.id must be a lowercase URL-safe slug (a-z0-9 and hyphens)`);
      } else if (ids.has(p.id)) {
        errors.push(`${at}.id is duplicated: ${p.id}`);
      } else {
        ids.add(p.id);
      }
    }
    if (typeof p.category !== 'string' || !isCategory(p.category)) {
      errors.push(`${at}.category must be one of: ${CATEGORY_LIST}`);
    }
    if (typeof p.image === 'string' && p.image !== '') {
      if (!checkFile(p.image)) errors.push(`${at}.image file not found: ${p.image}`);
    } else {
      errors.push(`${at}.image must be a non-empty string`);
    }
    if (p.links !== undefined && !isRecord(p.links)) {
      errors.push(`${at}.links must be an object`);
    }
  });
  return errors;
}

export function validateContent(file: unknown, lang: string, checkFile: FileChecker = realFileChecker): string[] {
  const errors: string[] = [];
  if (!isRecord(file)) return [`content.${lang} must be an object`];
  errors.push(...validateSite(file.site, checkFile));
  if (!Array.isArray(file.projects)) {
    errors.push(`content.${lang}.projects must be an array`);
    return errors;
  }
  file.projects.forEach((p, i) => {
    const at = `content.${lang}.projects[${i}]`;
    if (!isRecord(p)) {
      errors.push(`${at} must be an object`);
      return;
    }
    for (const key of REQUIRED_CONTENT_PROJECT_KEYS) {
      if (p[key] === undefined) errors.push(`${at}.${key} is required`);
    }
    if (typeof p.id !== 'string') errors.push(`${at}.id must be a string`);
    if (p.tags !== undefined && !Array.isArray(p.tags)) errors.push(`${at}.tags must be an array`);
  });
  return errors;
}

export function validateCrossReference(metaProjects: unknown, contentFiles: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!Array.isArray(metaProjects)) return errors;
  const metaIds = new Set(metaProjects.filter(isRecord).map((p) => p.id));
  for (const [lang, file] of Object.entries(contentFiles)) {
    if (!isRecord(file) || !Array.isArray(file.projects)) continue;
    for (const p of file.projects) {
      if (isRecord(p) && typeof p.id === 'string' && !metaIds.has(p.id)) {
        errors.push(`content.${lang}.projects[${p.id}] has no matching id in projects.json`);
      }
    }
    const contentIds = new Set(file.projects.filter(isRecord).map((p) => p.id));
    for (const meta of metaProjects) {
      if (isRecord(meta) && typeof meta.id === 'string' && !contentIds.has(meta.id)) {
        errors.push(`projects.json id "${meta.id}" is missing from content.${lang}`);
      }
    }
  }
  return errors;
}

export function validateAll(
  data: { projects: unknown; en: unknown; tr: unknown },
  checkFile: FileChecker = realFileChecker,
): string[] {
  return [
    ...validateProjects(data.projects, checkFile),
    ...validateContent(data.en, 'en', checkFile),
    ...validateContent(data.tr, 'tr', checkFile),
    ...validateCrossReference(data.projects, { en: data.en, tr: data.tr }),
  ];
}
```

- [ ] **Step 4: Create the empty template data files and placeholder assets**

`src/data/projects.json`:
```json
{
  "projects": []
}
```

`src/data/content.en.json`:
```json
{
  "site": {
    "name": "Your Name",
    "role": "AI Engineer",
    "bio": "Write a short introduction about yourself here.",
    "profileImage": "/images/profile.png",
    "contact": { "email": "", "linkedin": "", "github": "" },
    "cvFile": "/cv.pdf",
    "analytics": { "provider": "umami", "src": "", "websiteId": "" }
  },
  "projects": []
}
```

`src/data/content.tr.json`:
```json
{
  "site": {
    "name": "Your Name",
    "role": "AI Engineer",
    "bio": "Buraya kendinizi kısa bir tanıtım yazısı ekleyin.",
    "profileImage": "/images/profile.png",
    "contact": { "email": "", "linkedin": "", "github": "" },
    "cvFile": "/cv.pdf",
    "analytics": { "provider": "umami", "src": "", "websiteId": "" }
  },
  "projects": []
}
```

Placeholder profile image (1x1 PNG) and CV (minimal valid PDF):

Run:
```bash
mkdir -p public/images/projects
printf 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' | base64 -d > public/images/profile.png
touch public/images/projects/.gitkeep
```

`public/cv.pdf`:
```
%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
151
%%EOF
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all category and validation tests green.

- [ ] **Step 6: Commit**

```bash
git add src/lib src/data public/images public/cv.pdf tests
git commit -m "feat: add data files, categories, and fail-fast validation library"
```

---

### Task 3: Data loader, i18n UI strings, and locale helper

**Files:**
- Create: `src/lib/loadData.ts`
- Create: `src/i18n/ui.ts`
- Create: `src/i18n/locale.ts`
- Test: `tests/loadData.test.ts`
- Test: `tests/i18n.test.ts`

**Interfaces:**
- Consumes: types from `src/lib/data.ts`; `validateAll` from `src/lib/validate.ts`; `CATEGORIES`/`Category` from `src/lib/categories.ts`.
- Produces (consumed by later tasks):
  - `src/lib/loadData.ts`: `loadData(): LoadedData` (throws `Error` listing validation failures), `mergeProjects(content: ContentFile, meta: ProjectMeta[]): LocalizedProject[]`, `LoadedData` type
  - `src/i18n/ui.ts`: `getUI(lang: Lang): UIStrings`, `getCategoryLabel(lang: Lang, category: Category): string`, `CATEGORY_LABELS`
  - `src/i18n/locale.ts`: `LANGS: Lang[]`, `switchLocale(pathname: string, search: string, current: Lang, target: Lang): string`

- [ ] **Step 1: Write the failing tests**

`tests/loadData.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { loadData, mergeProjects } from '../src/lib/loadData';
import type { ContentFile, ProjectMeta } from '../src/lib/data';

describe('loadData', () => {
  it('loads the empty template without errors', () => {
    const data = loadData();
    expect(data.projects).toEqual([]);
    expect(data.en.site.role).toBe('AI Engineer');
    expect(data.tr.site.role).toBe('AI Engineer');
  });
});

describe('mergeProjects', () => {
  it('merges localized content with metadata by id', () => {
    const meta: ProjectMeta[] = [
      { id: 'a', category: 'rag', image: '/i.png', links: {}, featured: true },
    ];
    const content: ContentFile = {
      site: { name: '', role: '', bio: '', profileImage: '', contact: {}, cvFile: '', analytics: {} },
      projects: [{ id: 'a', title: 'Title A', summary: 'Sum', description: 'Desc', tags: ['RAG'] }],
    };
    const merged = mergeProjects(content, meta);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe('Title A');
    expect(merged[0].category).toBe('rag');
  });
});
```

`tests/i18n.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getUI, getCategoryLabel } from '../src/i18n/ui';
import { LANGS, switchLocale } from '../src/i18n/locale';

describe('getUI', () => {
  it('exposes the same key structure for both languages', () => {
    const en = getUI('en');
    const tr = getUI('tr');
    expect(Object.keys(en.nav)).toEqual(Object.keys(tr.nav));
    expect(Object.keys(en.projects)).toEqual(Object.keys(tr.projects));
    expect(Object.keys(en.home)).toEqual(Object.keys(tr.home));
    expect(Object.keys(en.about)).toEqual(Object.keys(tr.about));
    expect(Object.keys(en.project)).toEqual(Object.keys(tr.project));
  });
});

describe('getCategoryLabel', () => {
  it('returns localized category labels', () => {
    expect(getCategoryLabel('en', 'rag')).toBe('RAG');
    expect(getCategoryLabel('tr', 'rag')).toBe('RAG');
    expect(getCategoryLabel('tr', 'agents')).toBe('Ajanlar');
  });
});

describe('switchLocale', () => {
  it('swaps the locale prefix and keeps the rest of the path', () => {
    expect(switchLocale('/en/projects', '', 'en', 'tr')).toBe('/tr/projects');
    expect(switchLocale('/tr/projects/rag-chatbot', '?x=1', 'tr', 'en')).toBe('/en/projects/rag-chatbot?x=1');
    expect(switchLocale('/en/', '', 'en', 'tr')).toBe('/tr/');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `loadData.ts`, `ui.ts`, `locale.ts` do not exist.

- [ ] **Step 3: Write minimal implementation**

`src/lib/loadData.ts`:
```ts
import projects from '../data/projects.json';
import en from '../data/content.en.json';
import tr from '../data/content.tr.json';
import type { ContentFile, LoadedData, LocalizedProject, ProjectMeta } from './data';
import { validateAll } from './validate';

export interface LoadedData {
  projects: ProjectMeta[];
  en: ContentFile;
  tr: ContentFile;
}

export function loadData(): LoadedData {
  const errors = validateAll({ projects, en, tr });
  if (errors.length > 0) {
    throw new Error(`Invalid site data:\n  - ${errors.join('\n  - ')}`);
  }
  return { projects: projects as unknown as ProjectMeta[], en: en as unknown as ContentFile, tr: tr as unknown as ContentFile };
}

export function mergeProjects(content: ContentFile, meta: ProjectMeta[]): LocalizedProject[] {
  const byId = new Map(content.projects.map((p) => [p.id, p]));
  return meta
    .map((m) => {
      const c = byId.get(m.id);
      return c ? { ...m, ...c } : null;
    })
    .filter((p): p is LocalizedProject => p !== null);
}
```

`src/i18n/ui.ts`:
```ts
import type { Category } from '../lib/categories';
import type { Lang } from '../lib/data';

export const CATEGORY_LABELS: Record<Lang, Record<Category, string>> = {
  en: {
    chatbot: 'Chatbot',
    rag: 'RAG',
    agents: 'Agents',
    'fine-tuning': 'Fine-Tuning',
    'traditional-machine-learning': 'Traditional ML',
    other: 'Other',
  },
  tr: {
    chatbot: 'Chatbot',
    rag: 'RAG',
    agents: 'Ajanlar',
    'fine-tuning': 'İnce Ayarlama',
    'traditional-machine-learning': 'Geleneksel Makine Öğrenmesi',
    other: 'Diğer',
  },
};

export function getCategoryLabel(lang: Lang, category: Category): string {
  return CATEGORY_LABELS[lang][category];
}

export interface UIStrings {
  nav: { home: string; projects: string; about: string };
  projects: { title: string; all: string };
  home: { viewProjects: string; featuredTitle: string; aboutTitle: string; moreAbout: string };
  about: { title: string; downloadCV: string };
  project: { visitGithub: string; visitDemo: string; visitWebsite: string };
  footer: { rights: string };
  notFound: { title: string; message: string; backHome: string };
}

const UI: Record<Lang, UIStrings> = {
  en: {
    nav: { home: 'Home', projects: 'Projects', about: 'About' },
    projects: { title: 'Projects', all: 'All' },
    home: {
      viewProjects: 'View Projects',
      featuredTitle: 'Featured Projects',
      aboutTitle: 'About Me',
      moreAbout: 'More about me',
    },
    about: { title: 'About Me', downloadCV: 'Download CV' },
    project: { visitGithub: 'GitHub', visitDemo: 'Live Demo', visitWebsite: 'Website' },
    footer: { rights: 'All rights reserved.' },
    notFound: { title: 'Page not found', message: 'The page you are looking for does not exist.', backHome: 'Back to home' },
  },
  tr: {
    nav: { home: 'Ana Sayfa', projects: 'Projeler', about: 'Hakkımda' },
    projects: { title: 'Projeler', all: 'Tümü' },
    home: {
      viewProjects: 'Projeleri Gör',
      featuredTitle: 'Öne Çıkan Projeler',
      aboutTitle: 'Hakkımda',
      moreAbout: 'Daha fazla',
    },
    about: { title: 'Hakkımda', downloadCV: 'CV İndir' },
    project: { visitGithub: 'GitHub', visitDemo: 'Canlı Demo', visitWebsite: 'Web Sitesi' },
    footer: { rights: 'Tüm hakları saklıdır.' },
    notFound: { title: 'Sayfa bulunamadı', message: 'Aradığınız sayfa bulunmuyor.', backHome: 'Ana sayfaya dön' },
  },
};

export function getUI(lang: Lang): UIStrings {
  return UI[lang];
}
```

`src/i18n/locale.ts`:
```ts
import type { Lang } from '../lib/data';

export const LANGS: Lang[] = ['en', 'tr'];

export function switchLocale(pathname: string, search: string, current: Lang, target: Lang): string {
  if (current === target) return pathname + search;
  const rest = pathname === '/' ? '/' : pathname.replace(/^\/[^/]+/, '') || '/';
  return `/${target}${rest}${search}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — loadData and i18n tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/loadData.ts src/i18n tests/loadData.test.ts tests/i18n.test.ts
git commit -m "feat: add data loader, i18n UI strings, and locale switching helper"
```

---

### Task 4: Base layout, SEO head, analytics, and global styles

**Files:**
- Create: `src/components/SEOHead.astro`
- Create: `src/components/Analytics.astro`
- Create: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: `loadData` from `src/lib/loadData.ts`, `getUI` from `src/i18n/ui.ts`, `LANGS`/`switchLocale` from `src/i18n/locale.ts`.
- Produces (consumed by later tasks):
  - `SEOHead` props: `{ lang: Lang; title: string; description?: string; ogImage?: string; siteName: string }`
  - `Analytics` props: none (reads analytics from the `en` content file internally)
  - `BaseLayout` props: `{ lang: Lang; title: string; description?: string; ogImage?: string }`; renders `<slot />` in `<main>`; includes Header/Footer placeholders rendered later (include Header/Footer in Task 5 — for this task render `<slot />` only).

- [ ] **Step 1: Write the component code**

`src/components/SEOHead.astro`:
```astro
---
import { LANGS, switchLocale } from '../i18n/locale';
import type { Lang } from '../lib/data';

interface Props {
  lang: Lang;
  title: string;
  description?: string;
  ogImage?: string;
  siteName: string;
}

const { lang, title, description, ogImage, siteName } = Astro.props;
const path = Astro.url.pathname;
const alternates = LANGS.map((l) => ({
  lang: l,
  href: switchLocale(path, '', lang, l),
}));
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
{description && <meta name="description" content={description} />}
<meta property="og:type" content="website" />
<meta property="og:site_name" content={siteName} />
<meta property="og:title" content={title} />
{description && <meta property="og:description" content={description} />}
{ogImage && <meta property="og:image" content={ogImage} />}
<meta property="og:locale" content={lang === 'en' ? 'en_US' : 'tr_TR'} />
<meta property="og:locale:alternate" content={lang === 'en' ? 'tr_TR' : 'en_US'} />
<meta name="twitter:card" content="summary_large_image" />
{alternates.map((a) => <link rel="alternate" hreflang={a.lang} href={a.href} />)}
```

`src/components/Analytics.astro`:
```astro
---
import { loadData } from '../lib/loadData';

const analytics = loadData().en.site.analytics;
const enabled = Boolean(analytics?.src && analytics?.websiteId);
---
{enabled && <script is:inline async defer src={analytics.src} data-website-id={analytics.websiteId}></script>}
```

`src/layouts/BaseLayout.astro`:
```astro
---
import '../styles/global.css';
import Analytics from '../components/Analytics.astro';
import SEOHead from '../components/SEOHead.astro';
import { loadData } from '../lib/loadData';
import type { Lang } from '../lib/data';

interface Props {
  lang: Lang;
  title: string;
  description?: string;
  ogImage?: string;
}

const { lang, title, description, ogImage } = Astro.props;
const data = loadData();
const site = data[lang].site;
---
<html lang={lang}>
  <head>
    <SEOHead {lang} {title} description={description} ogImage={ogImage ?? site.profileImage} siteName={site.name} />
    <meta name="generator" content={Astro.generator} />
  </head>
  <body class="min-h-screen flex flex-col">
    <main class="flex-1">
      <slot />
    </main>
    <Analytics />
  </body>
</html>
```

- [ ] **Step 2: Verify it type-checks and builds**

Run: `npm run check && npm run build`
Expected: `astro check` exits 0; `astro build` completes and prints `Completed in` with no errors. (No pages yet, so `dist/` may be near-empty; that is expected.)

- [ ] **Step 3: Commit**

```bash
git add src/components/SEOHead.astro src/components/Analytics.astro src/layouts/BaseLayout.astro
git commit -m "feat: add base layout, SEO head with hreflang, and analytics component"
```

---

### Task 5: Header (navigation + language switcher) and Footer

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Modify: `src/layouts/BaseLayout.astro` (import and render Header + Footer)

**Interfaces:**
- Consumes: `getUI`, `switchLocale`/`LANGS`, `loadData`.
- Produces:
  - `Header` props: `{ lang: Lang }`
  - `Footer` props: `{ lang: Lang }`

- [ ] **Step 1: Write the components**

`src/components/Header.astro`:
```astro
---
import { getUI } from '../i18n/ui';
import { switchLocale } from '../i18n/locale';
import type { Lang } from '../lib/data';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const ui = getUI(lang);
const path = Astro.url.pathname;
const search = Astro.url.search;
const otherLang: Lang = lang === 'en' ? 'tr' : 'en';
const nav = [
  { href: `/${lang}/`, label: ui.nav.home },
  { href: `/${lang}/projects/`, label: ui.nav.projects },
  { href: `/${lang}/about/`, label: ui.nav.about },
];
---
<header class="border-b border-slate-200">
  <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
    <a href={`/${lang}/`} class="font-semibold text-slate-900">{getUI(lang).nav.home}</a>
    <nav>
      <ul class="flex items-center gap-6">
        {nav.map((item) => (
          <li><a href={item.href} class="text-sm hover:text-slate-900">{item.label}</a></li>
        ))}
        <li>
          <a
            href={switchLocale(path, search, lang, otherLang)}
            class="rounded-full border border-slate-300 px-3 py-1 text-sm font-medium hover:border-slate-500"
            hreflang={otherLang}
          >
            {otherLang.toUpperCase()}
          </a>
        </li>
      </ul>
    </nav>
  </div>
</header>
```

`src/components/Footer.astro`:
```astro
---
import { getUI } from '../i18n/ui';
import { loadData } from '../lib/loadData';
import type { Lang } from '../lib/data';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const ui = getUI(lang);
const { contact, name } = loadData()[lang].site;
const year = new Date().getFullYear();
---
<footer class="border-t border-slate-200">
  <div class="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-6 text-sm sm:flex-row sm:justify-between">
    <p>&copy; {year} {name}. {ui.footer.rights}</p>
    <ul class="flex items-center gap-4">
      {contact.email && <li><a href={`mailto:${contact.email}`}>Email</a></li>}
      {contact.github && <li><a href={contact.github} rel="me">GitHub</a></li>}
      {contact.linkedin && <li><a href={contact.linkedin} rel="me">LinkedIn</a></li>}
    </ul>
  </div>
</footer>
```

- [ ] **Step 2: Render them from the base layout**

In `src/layouts/BaseLayout.astro`, add imports and render Header above `<main>` and Footer below it:
```astro
---
import '../styles/global.css';
import Analytics from '../components/Analytics.astro';
import Footer from '../components/Footer.astro';
import Header from '../components/Header.astro';
import SEOHead from '../components/SEOHead.astro';
import { loadData } from '../lib/loadData';
import type { Lang } from '../lib/data';

interface Props {
  lang: Lang;
  title: string;
  description?: string;
  ogImage?: string;
}

const { lang, title, description, ogImage } = Astro.props;
const data = loadData();
const site = data[lang].site;
---
<html lang={lang}>
  <head>
    <SEOHead {lang} {title} description={description} ogImage={ogImage ?? site.profileImage} siteName={site.name} />
    <meta name="generator" content={Astro.generator} />
  </head>
  <body class="min-h-screen flex flex-col">
    <Header {lang} />
    <main class="flex-1">
      <slot />
    </main>
    <Footer {lang} />
    <Analytics />
  </body>
</html>
```

- [ ] **Step 3: Verify it type-checks and builds**

Run: `npm run check && npm run build`
Expected: both exit 0 with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro src/layouts/BaseLayout.astro
git commit -m "feat: add header navigation with language switcher and footer"
```

---

### Task 6: Home page (hero + featured projects) and ProjectCard

**Files:**
- Create: `src/components/ProjectCard.astro`
- Create: `src/pages/[lang]/index.astro`

**Interfaces:**
- Consumes: `BaseLayout` props `{ lang, title, description? }`; `loadData`/`mergeProjects`; `getUI`/`getCategoryLabel`; `LocalizedProject`.
- Produces:
  - `ProjectCard` props: `{ project: LocalizedProject; lang: Lang }`
  - Home route `/en/` and `/tr/` (static, from `getStaticPaths` over `LANGS`)

- [ ] **Step 1: Write ProjectCard**

`src/components/ProjectCard.astro`:
```astro
---
import { Image } from 'astro:assets';
import { getCategoryLabel } from '../i18n/ui';
import type { Lang, LocalizedProject } from '../lib/data';

interface Props {
  project: LocalizedProject;
  lang: Lang;
}

const { project, lang } = Astro.props;
const href = `/${lang}/projects/${project.id}/`;
---
<a
  href={href}
  data-project
  data-category={project.category}
  class="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-400"
>
  <div class="aspect-video overflow-hidden bg-slate-100">
    <Image src={project.image} alt={project.title} width={640} height={360} class="h-full w-full object-cover transition group-hover:scale-105" />
  </div>
  <div class="p-4">
    <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{getCategoryLabel(lang, project.category)}</p>
    <h3 class="mt-1 text-lg">{project.title}</h3>
    <p class="mt-1 text-sm text-slate-600">{project.summary}</p>
  </div>
</a>
```

- [ ] **Step 2: Write the home page**

`src/pages/[lang]/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import { Image } from 'astro:assets';
import { LANGS } from '../../i18n/locale';
import { getUI } from '../../i18n/ui';
import { loadData, mergeProjects } from '../../lib/loadData';
import type { Lang } from '../../lib/data';

export const getStaticPaths = () => LANGS.map((lang) => ({ params: { lang } }));

const { lang } = Astro.params as { lang: Lang };
const data = loadData();
const content = data[lang];
const ui = getUI(lang);
const featured = mergeProjects(content, data.projects).filter((p) => p.featured);
const hasContact = Boolean(content.site.contact.email || content.site.contact.linkedin || content.site.contact.github);
---
<BaseLayout lang={lang} title={`${content.site.name} — ${content.site.role}`} description={content.site.bio}>
  <section class="mx-auto max-w-4xl px-4 py-16">
    <div class="flex flex-col items-center gap-8 sm:flex-row">
      <div class="h-32 w-32 shrink-0 overflow-hidden rounded-full bg-slate-100">
        <Image src={content.site.profileImage} alt={content.site.name} width={256} height={256} class="h-full w-full object-cover" />
      </div>
      <div class="text-center sm:text-left">
        <h1 class="text-3xl">{content.site.name}</h1>
        <p class="mt-1 font-medium text-slate-500">{content.site.role}</p>
        <p class="mt-4 text-slate-600">{content.site.bio}</p>
        <div class="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
          <a href={`/${lang}/projects/`} class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            {ui.home.viewProjects}
          </a>
          {hasContact && <a href={`/${lang}/about/`} class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-slate-500">
            {ui.home.moreAbout}
          </a>}
        </div>
      </div>
    </div>
  </section>

  {featured.length > 0 && (
    <section class="mx-auto max-w-4xl px-4 pb-16">
      <h2 class="text-2xl">{ui.home.featuredTitle}</h2>
      <div class="mt-6 grid gap-6 sm:grid-cols-2">
        {featured.map((p) => <ProjectCard project={p} lang={lang} />)}
      </div>
    </section>
  )}
</BaseLayout>
```

- [ ] **Step 3: Verify it builds and generates both locale home pages**

Run: `npm run check && npm run build && ls dist/en/index.html dist/tr/index.html`
Expected: check + build exit 0; both `dist/en/index.html` and `dist/tr/index.html` exist; root `dist/index.html` is a redirect to `/en/` (generated by Astro i18n).

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectCard.astro src/pages/[lang]/index.astro
git commit -m "feat: add home page with hero and featured projects"
```

---

### Task 7: Projects page with category filtering

**Files:**
- Create: `src/components/CategoryFilter.astro`
- Create: `src/pages/[lang]/projects/index.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `ProjectCard`, `CATEGORIES`, `getUI`/`getCategoryLabel`, `loadData`/`mergeProjects`.
- Produces:
  - `CategoryFilter` props: `{ lang: Lang }` (reads the active category from `?category=` query param client-side)
  - Projects route `/en/projects/` and `/tr/projects/`

- [ ] **Step 1: Write the category filter component**

`src/components/CategoryFilter.astro`:
```astro
---
import { CATEGORIES } from '../../lib/categories';
import { getCategoryLabel, getUI } from '../../i18n/ui';
import type { Lang } from '../../lib/data';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const ui = getUI(lang);
const base = 'rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium transition hover:border-slate-500';
---
<div class="flex flex-wrap gap-2" data-category-filter>
  <button type="button" data-category="all" class={base}>{ui.projects.all}</button>
  {CATEGORIES.map((c) => (
    <button type="button" data-category={c} class={base}>{getCategoryLabel(lang, c)}</button>
  ))}
</div>
<script>
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-category-filter] [data-category]'));
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-project]'));

  function apply(category: string) {
    for (const b of buttons) {
      const active = b.dataset.category === category;
      b.classList.toggle('bg-slate-900', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('border-slate-900', active);
    }
    for (const card of cards) {
      card.style.display = category === 'all' || card.dataset.category === category ? '' : 'none';
    }
  }

  for (const b of buttons) {
    b.addEventListener('click', () => {
      const category = b.dataset.category ?? 'all';
      const url = new URL(window.location.href);
      if (category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', category);
      history.replaceState(null, '', url);
      apply(category);
    });
  }

  apply(new URLSearchParams(window.location.search).get('category') ?? 'all');
</script>
```

- [ ] **Step 2: Write the projects page**

`src/pages/[lang]/projects/index.astro`:
```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import CategoryFilter from '../../../components/CategoryFilter.astro';
import ProjectCard from '../../../components/ProjectCard.astro';
import { LANGS } from '../../../i18n/locale';
import { getUI } from '../../../i18n/ui';
import { loadData, mergeProjects } from '../../../lib/loadData';
import type { Lang } from '../../../lib/data';

export const getStaticPaths = () => LANGS.map((lang) => ({ params: { lang } }));

const { lang } = Astro.params as { lang: Lang };
const data = loadData();
const content = data[lang];
const ui = getUI(lang);
const projects = mergeProjects(content, data.projects);
---
<BaseLayout lang={lang} title={ui.projects.title} description={ui.projects.title}>
  <section class="mx-auto max-w-4xl px-4 py-16">
    <h1 class="text-3xl">{ui.projects.title}</h1>
    <div class="mt-6">
      <CategoryFilter lang={lang} />
    </div>
    <div class="mt-8 grid gap-6 sm:grid-cols-2">
      {projects.map((p) => <ProjectCard project={p} lang={lang} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Verify it builds and generates the projects pages**

Run: `npm run check && npm run build && ls dist/en/projects/index.html dist/tr/projects/index.html`
Expected: check + build exit 0; both files exist.

- [ ] **Step 4: Commit**

```bash
git add src/components/CategoryFilter.astro "src/pages/[lang]/projects/index.astro"
git commit -m "feat: add projects page with client-side category filtering"
```

---

### Task 8: Project detail page

**Files:**
- Create: `src/pages/[lang]/projects/[id].astro`

**Interfaces:**
- Consumes: `BaseLayout`, `LANGS`, `loadData`/`mergeProjects`, `getUI`/`getCategoryLabel`, `marked`.
- Produces: dynamic routes `/en/projects/[id]/` and `/tr/projects/[id]/` from `getStaticPaths`.

- [ ] **Step 1: Write the project detail page**

`src/pages/[lang]/projects/[id].astro`:
```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { Image } from 'astro:assets';
import { marked } from 'marked';
import { LANGS } from '../../../i18n/locale';
import { getCategoryLabel, getUI } from '../../../i18n/ui';
import { loadData, mergeProjects } from '../../../lib/loadData';
import type { Lang } from '../../../lib/data';

export function getStaticPaths() {
  const data = loadData();
  return LANGS.flatMap((lang) =>
    data.projects.map((p) => ({ params: { lang, id: p.id } })),
  );
}

const { lang, id } = Astro.params as { lang: Lang; id: string };
const data = loadData();
const content = data[lang];
const ui = getUI(lang);
const project = mergeProjects(content, data.projects).find((p) => p.id === id);
if (!project) throw new Error(`Project "${id}" not found in ${lang}`);
const descriptionHtml = await marked.parse(project.description);
---
<BaseLayout lang={lang} title={`${project.title} — ${content.site.name}`} description={project.summary} ogImage={project.image}>
  <article class="mx-auto max-w-3xl px-4 py-16">
    <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{getCategoryLabel(lang, project.category)}</p>
    <h1 class="mt-2 text-3xl">{project.title}</h1>
    <p class="mt-3 text-slate-600">{project.summary}</p>

    <div class="mt-8 overflow-hidden rounded-xl border border-slate-200">
      <Image src={project.image} alt={project.title} width={960} height={540} class="aspect-video w-full object-cover" />
    </div>

    <div class="mt-8 space-y-4 text-slate-700">
      <div set:html={descriptionHtml} />
    </div>

    <div class="mt-8 flex flex-wrap items-center gap-3">
      {project.links?.github && <a href={project.links.github} rel="noopener" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-slate-500">{ui.project.visitGithub}</a>}
      {project.links?.demo && <a href={project.links.demo} rel="noopener" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-slate-500">{ui.project.visitDemo}</a>}
      {project.links?.website && <a href={project.links.website} rel="noopener" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-slate-500">{ui.project.visitWebsite}</a>}
    </div>

    {project.tags.length > 0 && (
      <ul class="mt-8 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{tag}</li>
        ))}
      </ul>
    )}
  </article>
</BaseLayout>
```

- [ ] **Step 2: Add a temporary sample project to verify the detail page builds**

Temporarily add one project to the three data files so `getStaticPaths` emits routes:

`src/data/projects.json`:
```json
{
  "projects": [
    {
      "id": "sample-project",
      "category": "rag",
      "image": "/images/profile.png",
      "links": { "github": "", "demo": "", "website": "" },
      "featured": true
    }
  ]
}
```

Add to `projects` in both `src/data/content.en.json` and `src/data/content.tr.json`:
```json
{ "id": "sample-project", "title": "Sample Project", "summary": "A sample project to verify detail pages.", "description": "## Overview\n\nThis is a **sample** description rendered from markdown.", "tags": ["RAG"] }
```

- [ ] **Step 3: Verify the detail pages build**

Run: `npm run check && npm run build && ls dist/en/projects/sample-project/index.html dist/tr/projects/sample-project/index.html`
Expected: check + build exit 0; both detail pages exist.

- [ ] **Step 4: Revert the temporary sample data, then rebuild**

Restore `src/data/projects.json` and both content files to the empty-template state from Task 2 (empty `projects: []`), then:

Run: `npm run build`
Expected: build exits 0.

- [ ] **Step 5: Commit**

```bash
git add "src/pages/[lang]/projects/[id].astro" src/data
git commit -m "feat: add project detail pages with markdown descriptions"
```

---

### Task 9: About page and 404 page

**Files:**
- Create: `src/pages/[lang]/about.astro`
- Create: `src/pages/404.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `getUI`, `loadData`.
- Produces: `/en/about/`, `/tr/about/`, and global `/404.html`.

- [ ] **Step 1: Write the about page**

`src/pages/[lang]/about.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { Image } from 'astro:assets';
import { LANGS } from '../../i18n/locale';
import { getUI } from '../../i18n/ui';
import { loadData } from '../../lib/loadData';
import type { Lang } from '../../lib/data';

export const getStaticPaths = () => LANGS.map((lang) => ({ params: { lang } }));

const { lang } = Astro.params as { lang: Lang };
const ui = getUI(lang);
const { site } = loadData()[lang];
const contactItems = [
  { label: 'Email', href: site.contact.email ? `mailto:${site.contact.email}` : '' },
  { label: 'GitHub', href: site.contact.github ?? '' },
  { label: 'LinkedIn', href: site.contact.linkedin ?? '' },
].filter((c) => c.href !== '');
---
<BaseLayout lang={lang} title={`${ui.about.title} — ${site.name}`} description={site.bio}>
  <section class="mx-auto max-w-3xl px-4 py-16">
    <div class="flex flex-col items-center gap-6 sm:flex-row">
      <div class="h-32 w-32 shrink-0 overflow-hidden rounded-full bg-slate-100">
        <Image src={site.profileImage} alt={site.name} width={256} height={256} class="h-full w-full object-cover" />
      </div>
      <div class="text-center sm:text-left">
        <h1 class="text-3xl">{ui.about.title}</h1>
        <p class="mt-2 font-medium text-slate-500">{site.role}</p>
      </div>
    </div>

    <div class="mt-8 whitespace-pre-line text-slate-700">{site.bio}</div>

    <div class="mt-8 flex flex-wrap items-center gap-3">
      <a href={site.cvFile} download class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        {ui.about.downloadCV}
      </a>
      {contactItems.map((c) => (
        <a href={c.href} rel="me" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-slate-500">
          {c.label}
        </a>
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Write the 404 page**

`src/pages/404.astro`:
```astro
---
import '../styles/global.css';
import SEOHead from '../components/SEOHead.astro';
import { getUI } from '../i18n/ui';
import { loadData } from '../lib/loadData';
import { LANGS } from '../i18n/locale';
import type { Lang } from '../lib/data';

const siteName = loadData().en.site.name;
---
<html lang="en">
  <head>
    <SEOHead lang="en" title="404" siteName={siteName} />
    <meta name="generator" content={Astro.generator} />
  </head>
  <body class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 class="text-6xl">404</h1>
    <p class="text-slate-600">{getUI('en' as Lang).notFound.message}</p>
    <div class="flex gap-3">
      {LANGS.map((lang) => (
        <a href={`/${lang}/`} class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-slate-500">
          {getUI(lang).notFound.backHome} ({lang.toUpperCase()})
        </a>
      ))}
    </div>
  </body>
</html>
```

- [ ] **Step 3: Verify it builds and generates the about pages and 404**

Run: `npm run check && npm run build && ls dist/en/about/index.html dist/tr/about/index.html dist/404.html`
Expected: check + build exit 0; all three files exist.

- [ ] **Step 4: Commit**

```bash
git add "src/pages/[lang]/about.astro" src/pages/404.astro
git commit -m "feat: add about page and custom 404 page"
```

---

### Task 10: Docker image with nginx

**Files:**
- Create: `Dockerfile`
- Create: `nginx.conf`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Interfaces:**
- Produces: image `ml-portfolio` (nginx serving `dist/` on port 80), compose service `ml-portfolio` exposing host port `8090`.

- [ ] **Step 1: Write the Docker and nginx files

`Dockerfile`:
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location = / {
        return 301 /en/;
    }

    location / {
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;

    location ~* \.(?:js|css|png|jpe?g|gif|svg|webp|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

`docker-compose.yml`:
```yaml
services:
  ml-portfolio:
    build: .
    image: ml-portfolio
    container_name: ml-portfolio
    ports:
      - "8090:80"
    restart: unless-stopped
```

`.dockerignore`:
```
node_modules
dist
.astro
.git
docs
tests
```

- [ ] **Step 2: Build the image**

Run: `docker build -t ml-portfolio .`
Expected: build succeeds; final image contains the site at `/usr/share/nginx/html`.

- [ ] **Step 3: Run it and verify the site is served**

Run: `docker run --rm -d --name ml-portfolio-test -p 8090:80 ml-portfolio && sleep 2 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/en/ && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/tr/ && curl -s -I -o /dev/null -w "%{http_code}\n" http://localhost:8090/`
Expected: `200`, `200`, `301` (root redirects to `/en/`).

Then stop the test container:
Run: `docker rm -f ml-portfolio-test`
Expected: container removed.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile nginx.conf docker-compose.yml .dockerignore
git commit -m "feat: add nginx Docker image for static deployment"
```

---

### Task 11: README and final verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

`README.md`:
```markdown
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
```

- [ ] **Step 2: Final end-to-end verification**

Run: `npm test && npm run check && npm run build`
Expected: unit tests pass, `astro check` exits 0, `astro build` succeeds.

- [ ] **Step 3: Confirm the empty-template site builds with all routes**

Run: `ls dist/en/index.html dist/tr/index.html dist/en/projects/index.html dist/tr/projects/index.html dist/en/about/index.html dist/tr/about/index.html dist/404.html`
Expected: all files listed exist.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with dev and deploy instructions"
```

---

## Self-Review

- **Spec coverage:** Data model (Task 2), loader + i18n (Task 3), SEO/hreflang + analytics (Task 4), header/footer + language switcher (Task 5), home + featured (Task 6), projects + filter (Task 7), detail + markdown (Task 8), about + 404 (Task 9), Docker/nginx deploy (Task 10), README (Task 11). Root `/` redirect, `/en`/`/tr` prefixes, categories, empty template, fail-fast validation all covered.
- **Placeholders:** No TBD/TODO; every step carries concrete code or commands.
- **Type consistency:** `Lang`, `LocalizedProject`, `ProjectMeta`, `ContentFile`, `LoadedData`, `getUI`, `getCategoryLabel`, `switchLocale`, `loadData`, `mergeProjects`, `CATEGORIES`, `isCategory` are defined once and referenced with identical names across all tasks.