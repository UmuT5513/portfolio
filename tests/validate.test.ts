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