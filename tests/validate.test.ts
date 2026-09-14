import { describe, it, expect } from 'vitest';
import {
  validateAll,
  validateCertificates,
  validateCertificateCrossReference,
  validateContent,
  validateCrossReference,
  validateProjects,
  validateSite,
} from '../src/lib/validate';

const okFile = () => true;
const missingFile = () => false;

const validSite = {
  name: 'Your Name',
  role: 'AI Engineer',
  bio: 'Short bio.',
  profileImage: '/images/profile.png',
  contact: { email: '', linkedin: '', github: '' },
  cvFile: '/cv.pdf',
  analytics: { provider: 'umami', src: '', websiteId: '' },
  skills: ['Machine Learning'],
  experience: [
    { id: 'intern', company: 'Co', role: 'Intern', start: '2026-01', end: '2026-02', description: 'Did things', projectIds: [] },
  ],
  education: [{ school: 'Uni', degree: "Bachelor's", field: 'CS', start: '2022-01', end: '2027-01' }],
};

describe('validateSite', () => {
  it('passes a valid site', () => {
    expect(validateSite(validSite, okFile)).toEqual([]);
  });

  it('flags missing required fields', () => {
    const errors = validateSite({ name: '', role: 'AI Engineer', contact: {} }, okFile);
    expect(errors.some((e) => e.includes('site.name'))).toBe(true);
    expect(errors.some((e) => e.includes('site.bio'))).toBe(true);
  });

  it('flags a missing profile image file', () => {
    const site = { ...validSite, profileImage: '/images/missing.png' };
    const errors = validateSite(site, missingFile);
    expect(errors.some((e) => e.includes('profileImage'))).toBe(true);
  });

  it('flags invalid experience and skills', () => {
    const errors = validateSite(
      { ...validSite, skills: 'nope', experience: [{ company: 'Co' }] },
      okFile,
    );
    expect(errors.some((e) => e.includes('site.skills'))).toBe(true);
    expect(errors.some((e) => e.includes('site.experience[0].id'))).toBe(true);
  });
});

describe('validateProjects', () => {
  const validProject = {
    id: 'rag-chatbot',
    categories: ['rag'],
    image: '/images/projects/example.png',
    links: { github: '', demo: '', website: '' },
    featured: false,
  };

  it('passes valid projects', () => {
    expect(validateProjects([validProject], okFile)).toEqual([]);
  });

  it('rejects an invalid category', () => {
    const errors = validateProjects([{ ...validProject, categories: ['nope'] }], okFile);
    expect(errors.some((e) => e.includes('categories'))).toBe(true);
  });

  it('rejects empty or duplicated categories', () => {
    const empty = validateProjects([{ ...validProject, categories: [] }], okFile);
    expect(empty.some((e) => e.includes('categories'))).toBe(true);
    const dup = validateProjects([{ ...validProject, categories: ['rag', 'rag'] }], okFile);
    expect(dup.some((e) => e.includes('duplicated'))).toBe(true);
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

  it('accepts private and in_live flags', () => {
    expect(validateProjects([{ ...validProject, private: true, in_live: true }], okFile)).toEqual([]);
    expect(validateProjects([{ ...validProject, private: false, in_live: false }], okFile)).toEqual([]);
  });

  it('rejects non-boolean private or in_live flags', () => {
    const errors = validateProjects([{ ...validProject, private: 'yes', in_live: 1 }], okFile);
    expect(errors.some((e) => e.includes('private'))).toBe(true);
    expect(errors.some((e) => e.includes('in_live'))).toBe(true);
  });

  it('accepts an optional repo string and rejects non-strings', () => {
    expect(validateProjects([{ ...validProject, repo: 'Owner/Repo' }], okFile)).toEqual([]);
    const errors = validateProjects([{ ...validProject, repo: 123 }], okFile);
    expect(errors.some((e) => e.includes('repo'))).toBe(true);
  });

  it('accepts an optional YYYY-MM date and rejects invalid formats', () => {
    expect(validateProjects([{ ...validProject, date: '2026-08' }], okFile)).toEqual([]);
    const bad = validateProjects([{ ...validProject, date: 'Aug 2026' }], okFile);
    expect(bad.some((e) => e.includes('date'))).toBe(true);
    const badMonth = validateProjects([{ ...validProject, date: '2026-13' }], okFile);
    expect(badMonth.some((e) => e.includes('date'))).toBe(true);
  });
});

describe('validateCertificates', () => {
  const validCertificate = { id: 'yds', issuer: 'ÖSYM', date: '2026-04', validUntil: '2031-04', url: '' };

  it('passes valid certificates', () => {
    expect(validateCertificates([validCertificate])).toEqual([]);
  });

  it('rejects missing required fields', () => {
    const errors = validateCertificates([{ id: 'x' }]);
    expect(errors.some((e) => e.includes('issuer'))).toBe(true);
    expect(errors.some((e) => e.includes('date'))).toBe(true);
  });

  it('rejects duplicate ids', () => {
    const errors = validateCertificates([validCertificate, validCertificate]);
    expect(errors.some((e) => e.includes('duplicated'))).toBe(true);
  });
});

describe('validateContent', () => {
  const content = {
    site: validSite,
    projects: [{ id: 'rag-chatbot', title: 'T', summary: 'S', description: 'D', tags: ['RAG'] }],
    certificates: [{ id: 'yds', name: 'YDS', note: 'Note' }],
  };

  it('passes valid content', () => {
    expect(validateContent(content, 'en', okFile)).toEqual([]);
  });

  it('flags a missing title', () => {
    const bad = { ...content, projects: [{ id: 'x', summary: 'S', description: 'D', tags: [] }] };
    const errors = validateContent(bad, 'en', okFile);
    expect(errors.some((e) => e.includes('title'))).toBe(true);
  });

  it('flags a certificate without a name', () => {
    const bad = { ...content, certificates: [{ id: 'yds' }] };
    const errors = validateContent(bad, 'en', okFile);
    expect(errors.some((e) => e.includes('certificates'))).toBe(true);
  });
});

describe('validateCrossReference', () => {
  it('flags a content id with no metadata match', () => {
    const meta = [{ id: 'a', categories: ['rag'], image: '/i.png', featured: false }];
    const content = { en: { projects: [{ id: 'zzz' }] } };
    const errors = validateCrossReference(meta, content);
    expect(errors.some((e) => e.includes('zzz'))).toBe(true);
  });

  it('flags a metadata id missing from a language file', () => {
    const meta = [{ id: 'a', categories: ['rag'], image: '/i.png', featured: false }];
    const content = { en: { projects: [] } };
    const errors = validateCrossReference(meta, content);
    expect(errors.some((e) => e.includes('missing from content.en'))).toBe(true);
  });
});

describe('validateCertificateCrossReference', () => {
  it('flags a certificate id missing from a language file', () => {
    const meta = [{ id: 'yds', issuer: 'ÖSYM', date: '2026-04' }];
    const content = { en: { certificates: [] } };
    const errors = validateCertificateCrossReference(meta, content);
    expect(errors.some((e) => e.includes('missing from content.en'))).toBe(true);
  });
});

describe('validateAll', () => {
  it('aggregates errors from all sources', () => {
    const data = {
      projects: [{ id: 'a', categories: ['bad'], image: '', featured: false }],
      certificates: [{ id: 'c1', issuer: 'X', date: '2026-01' }],
      en: { projects: [{ id: 'nope' }], certificates: [] },
      tr: { projects: [], certificates: [{ id: 'c1', name: 'C' }] },
    };
    const errors = validateAll(data, okFile);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});