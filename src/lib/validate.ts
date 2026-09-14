import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isCategory } from './categories';

export type FileChecker = (publicPath: string) => boolean;

const realFileChecker: FileChecker = (publicPath) =>
  existsSync(join(process.cwd(), 'public', publicPath.replace(/^\//, '')));

const REQUIRED_SITE_KEYS = ['name', 'role', 'bio', 'profileImage', 'cvFile'] as const;
const REQUIRED_PROJECT_META_KEYS = ['id', 'categories', 'image', 'featured'] as const;
const REQUIRED_CONTENT_PROJECT_KEYS = ['id', 'title', 'summary', 'description', 'tags'] as const;
const REQUIRED_CERTIFICATE_META_KEYS = ['id', 'issuer', 'date'] as const;
const REQUIRED_CERTIFICATE_CONTENT_KEYS = ['id', 'name'] as const;
const CATEGORY_LIST = 'chatbot | rag | agents | llm | fine-tuning | traditional-machine-learning | other';
const SLUG_RE = /^[a-z0-9-]+$/;
const ISO_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v !== '';
}

function isOptionalString(v: unknown): boolean {
  return typeof v === 'undefined' || typeof v === 'string';
}

function validateContact(contact: unknown, errors: string[]): void {
  if (typeof contact === 'undefined') return;
  if (!isRecord(contact)) {
    errors.push('site.contact must be an object');
    return;
  }
  for (const key of ['email', 'linkedin', 'github', 'huggingface', 'medium']) {
    if (!isOptionalString(contact[key])) errors.push(`site.contact.${key} must be a string`);
  }
}

function validateExperience(experience: unknown, errors: string[]): void {
  if (!Array.isArray(experience)) {
    errors.push('site.experience must be an array');
    return;
  }
  experience.forEach((e, i) => {
    const at = `site.experience[${i}]`;
    if (!isRecord(e)) {
      errors.push(`${at} must be an object`);
      return;
    }
    for (const key of ['id', 'company', 'role', 'start', 'end', 'description']) {
      if (!isNonEmptyString(e[key])) errors.push(`${at}.${key} must be a non-empty string`);
    }
    if (typeof e.id === 'string' && !SLUG_RE.test(e.id)) {
      errors.push(`${at}.id must be a lowercase URL-safe slug (a-z0-9 and hyphens)`);
    }
    if (!Array.isArray(e.projectIds) || e.projectIds.some((id) => typeof id !== 'string')) {
      errors.push(`${at}.projectIds must be an array of strings`);
    }
  });
}

function validateEducation(education: unknown, errors: string[]): void {
  if (!Array.isArray(education)) {
    errors.push('site.education must be an array');
    return;
  }
  education.forEach((e, i) => {
    const at = `site.education[${i}]`;
    if (!isRecord(e)) {
      errors.push(`${at} must be an object`);
      return;
    }
    for (const key of ['school', 'degree', 'field', 'start', 'end']) {
      if (!isNonEmptyString(e[key])) errors.push(`${at}.${key} must be a non-empty string`);
    }
    if (!isOptionalString(e.gpa)) errors.push(`${at}.gpa must be a string`);
    if (typeof e.current !== 'undefined' && typeof e.current !== 'boolean') {
      errors.push(`${at}.current must be a boolean`);
    }
  });
}

export function validateSite(site: unknown, checkFile: FileChecker = realFileChecker): string[] {
  const errors: string[] = [];
  if (!isRecord(site)) return ['site must be an object'];
  for (const key of REQUIRED_SITE_KEYS) {
    if (!isNonEmptyString(site[key])) errors.push(`site.${key} must be a non-empty string`);
  }
  if (isNonEmptyString(site.profileImage) && !checkFile(site.profileImage)) {
    errors.push(`site.profileImage file not found: ${site.profileImage}`);
  }
  if (isNonEmptyString(site.cvFile) && !checkFile(site.cvFile)) {
    errors.push(`site.cvFile file not found: ${site.cvFile}`);
  }
  validateContact(site.contact, errors);
  if (!Array.isArray(site.skills) || site.skills.some((s) => !isNonEmptyString(s))) {
    errors.push('site.skills must be an array of non-empty strings');
  }
  validateExperience(site.experience, errors);
  validateEducation(site.education, errors);
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
    if (typeof p.private !== 'undefined' && typeof p.private !== 'boolean') {
      errors.push(`${at}.private must be a boolean`);
    }
    if (typeof p.in_live !== 'undefined' && typeof p.in_live !== 'boolean') {
      errors.push(`${at}.in_live must be a boolean`);
    }
    if (typeof p.repo !== 'undefined' && !isNonEmptyString(p.repo)) {
      errors.push(`${at}.repo must be a non-empty string`);
    }
    if (typeof p.date !== 'undefined' && !ISO_MONTH_RE.test(String(p.date))) {
      errors.push(`${at}.date must be a YYYY-MM date`);
    }
    if (typeof p.id === 'string') {
      if (!SLUG_RE.test(p.id)) {
        errors.push(`${at}.id must be a lowercase URL-safe slug (a-z0-9 and hyphens)`);
      } else if (ids.has(p.id)) {
        errors.push(`${at}.id is duplicated: ${p.id}`);
      } else {
        ids.add(p.id);
      }
    }
    if (!Array.isArray(p.categories) || p.categories.length === 0) {
      errors.push(`${at}.categories must be a non-empty array`);
    } else {
      const seen = new Set<string>();
      p.categories.forEach((c, j) => {
        if (typeof c !== 'string' || !isCategory(c)) {
          errors.push(`${at}.categories[${j}] must be one of: ${CATEGORY_LIST}`);
        } else if (seen.has(c)) {
          errors.push(`${at}.categories[${j}] is duplicated: ${c}`);
        } else {
          seen.add(c);
        }
      });
    }
    if (isNonEmptyString(p.image)) {
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

export function validateCertificates(certificates: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(certificates)) return ['certificates must be an array'];
  const ids = new Set<string>();
  certificates.forEach((c, i) => {
    const at = `certificates[${i}]`;
    if (!isRecord(c)) {
      errors.push(`${at} must be an object`);
      return;
    }
    for (const key of REQUIRED_CERTIFICATE_META_KEYS) {
      if (!isNonEmptyString(c[key])) errors.push(`${at}.${key} must be a non-empty string`);
    }
    if (typeof c.id === 'string') {
      if (!SLUG_RE.test(c.id)) {
        errors.push(`${at}.id must be a lowercase URL-safe slug (a-z0-9 and hyphens)`);
      } else if (ids.has(c.id)) {
        errors.push(`${at}.id is duplicated: ${c.id}`);
      } else {
        ids.add(c.id);
      }
    }
    if (!isOptionalString(c.validUntil)) errors.push(`${at}.validUntil must be a string`);
    if (!isOptionalString(c.url)) errors.push(`${at}.url must be a string`);
  });
  return errors;
}

export function validateContent(file: unknown, lang: string, checkFile: FileChecker = realFileChecker): string[] {
  const errors: string[] = [];
  if (!isRecord(file)) return [`content.${lang} must be an object`];
  errors.push(...validateSite(file.site, checkFile));
  if (!Array.isArray(file.projects)) {
    errors.push(`content.${lang}.projects must be an array`);
  } else {
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
  }
  if (!Array.isArray(file.certificates)) {
    errors.push(`content.${lang}.certificates must be an array`);
  } else {
    file.certificates.forEach((c, i) => {
      const at = `content.${lang}.certificates[${i}]`;
      if (!isRecord(c)) {
        errors.push(`${at} must be an object`);
        return;
      }
      for (const key of REQUIRED_CERTIFICATE_CONTENT_KEYS) {
        if (!isNonEmptyString(c[key])) errors.push(`${at}.${key} must be a non-empty string`);
      }
      if (!isOptionalString(c.note)) errors.push(`${at}.note must be a string`);
    });
  }
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

export function validateCertificateCrossReference(
  metaCertificates: unknown,
  contentFiles: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  if (!Array.isArray(metaCertificates)) return errors;
  const metaIds = new Set(metaCertificates.filter(isRecord).map((c) => c.id));
  for (const [lang, file] of Object.entries(contentFiles)) {
    if (!isRecord(file) || !Array.isArray(file.certificates)) continue;
    for (const c of file.certificates) {
      if (isRecord(c) && typeof c.id === 'string' && !metaIds.has(c.id)) {
        errors.push(`content.${lang}.certificates[${c.id}] has no matching id in certificates.json`);
      }
    }
    const contentIds = new Set(file.certificates.filter(isRecord).map((c) => c.id));
    for (const meta of metaCertificates) {
      if (isRecord(meta) && typeof meta.id === 'string' && !contentIds.has(meta.id)) {
        errors.push(`certificates.json id "${meta.id}" is missing from content.${lang}`);
      }
    }
  }
  return errors;
}

export function validateAll(
  data: { projects: unknown; certificates: unknown; en: unknown; tr: unknown },
  checkFile: FileChecker = realFileChecker,
): string[] {
  const contentFiles = { en: data.en, tr: data.tr };
  return [
    ...validateProjects(data.projects, checkFile),
    ...validateCertificates(data.certificates),
    ...validateContent(data.en, 'en', checkFile),
    ...validateContent(data.tr, 'tr', checkFile),
    ...validateCrossReference(data.projects, contentFiles),
    ...validateCertificateCrossReference(data.certificates, contentFiles),
  ];
}
