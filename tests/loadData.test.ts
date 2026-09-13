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