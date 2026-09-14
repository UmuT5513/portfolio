import type { Category } from './categories';

export type Lang = 'en' | 'tr';

export interface ProjectLinks {
  github?: string;
  demo?: string;
  website?: string;
}

export interface ProjectMeta {
  id: string;
  date?: string;
  repo?: string;
  categories: Category[];
  image: string;
  links: ProjectLinks;
  featured: boolean;
  private?: boolean;
  in_live?: boolean;
}

export interface Contact {
  email?: string;
  linkedin?: string;
  github?: string;
  huggingface?: string;
  medium?: string;
}

export interface AnalyticsConfig {
  provider?: string;
  src?: string;
  websiteId?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string;
  description: string;
  projectIds: string[];
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  gpa?: string;
  current?: boolean;
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
  skills: string[];
  experience: Experience[];
  education: Education[];
}

export interface ProjectContent {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
}

export interface CertificateContent {
  id: string;
  name: string;
  note?: string;
}

export interface ContentFile {
  site: SiteInfo;
  projects: ProjectContent[];
  certificates: CertificateContent[];
}

export interface CertificateMeta {
  id: string;
  issuer: string;
  date: string;
  validUntil?: string;
  url?: string;
}

export interface LocalizedProject extends ProjectMeta {
  title: string;
  summary: string;
  description: string;
  tags: string[];
}

export interface LocalizedCertificate extends CertificateMeta {
  name: string;
  note?: string;
}
