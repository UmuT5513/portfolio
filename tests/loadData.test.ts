import { describe, it, expect } from 'vitest';
import { loadData, mergeProjects } from '../src/lib/loadData';
import type { ContentFile, ProjectMeta } from '../src/lib/data';

describe('loadData', () => {
  it('loads the site data without errors', () => {
    const data = loadData();
    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.en.site.role).toBe('AI Engineer');
    expect(data.tr.site.role).toBe('Yapay Zeka Mühendisi');
  });

  it('has a localized entry for every project in both languages', () => {
    const data = loadData();
    const enIds = new Set(data.en.projects.map((p) => p.id));
    const trIds = new Set(data.tr.projects.map((p) => p.id));
    for (const project of data.projects) {
      expect(enIds.has(project.id)).toBe(true);
      expect(trIds.has(project.id)).toBe(true);
    }
  });

  it('loads certificates with matching localized entries', () => {
    const data = loadData();
    expect(data.certificates.length).toBeGreaterThan(0);
    for (const cert of data.certificates) {
      const en = data.en.certificates.find((c) => c.id === cert.id);
      const tr = data.tr.certificates.find((c) => c.id === cert.id);
      expect(en).toBeDefined();
      expect(tr).toBeDefined();
    }
  });
});

describe('mergeProjects', () => {
  it('merges localized content with metadata by id', () => {
    const meta: ProjectMeta[] = [
      { id: 'a', categories: ['rag'], image: '/i.png', links: {}, featured: true },
    ];
    const content: ContentFile = {
      site: {
        name: '', role: '', bio: '', profileImage: '', contact: {},
        cvFile: '', analytics: {}, skills: [], experience: [], education: [],
      },
      projects: [{ id: 'a', title: 'Title A', summary: 'Sum', description: 'Desc', tags: ['RAG'] }],
      certificates: [],
    };
    const merged = mergeProjects(content, meta);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe('Title A');
    expect(merged[0].categories).toEqual(['rag']);
  });
});