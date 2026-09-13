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
  siteUrl?: string;
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