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