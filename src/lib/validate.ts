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