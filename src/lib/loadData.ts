import projects from '../data/projects.json';
import en from '../data/content.en.json';
import tr from '../data/content.tr.json';
import type { ContentFile, LocalizedProject, ProjectMeta } from './data';
import { validateAll } from './validate';

export interface LoadedData {
  projects: ProjectMeta[];
  en: ContentFile;
  tr: ContentFile;
}

export function loadData(): LoadedData {
  const projectMeta = projects as unknown as { projects: ProjectMeta[] };
  const errors = validateAll({ projects: projectMeta.projects, en, tr });
  if (errors.length > 0) {
    throw new Error(`Invalid site data:\n  - ${errors.join('\n  - ')}`);
  }
  return { projects: projectMeta.projects, en: en as unknown as ContentFile, tr: tr as unknown as ContentFile };
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