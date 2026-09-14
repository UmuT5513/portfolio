import type { Category } from '../lib/categories';
import type { Lang } from '../lib/data';

export const CATEGORY_LABELS: Record<Lang, Record<Category, string>> = {
  en: {
    chatbot: 'Chatbot',
    rag: 'RAG',
    agents: 'Agents',
    llm: 'LLM',
    'fine-tuning': 'Fine-Tuning',
    'traditional-machine-learning': 'Traditional ML',
    other: 'Other',
  },
  tr: {
    chatbot: 'Chatbot',
    rag: 'RAG',
    agents: 'Ajanlar',
    llm: 'LLM',
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
  projects: { title: string; all: string; newest: string; oldest: string };
  home: {
    viewProjects: string;
    featuredTitle: string;
    aboutTitle: string;
    moreAbout: string;
    skillsTitle: string;
    experienceTitle: string;
    educationTitle: string;
    certificatesTitle: string;
    viewCertificate: string;
  };
  about: { title: string; downloadCV: string; present: string; expected: string; gpa: string; validUntil: string };
  project: { visitGithub: string; visitDemo: string; visitWebsite: string; private: string; live: string; relatedProjects: string };
  footer: { rights: string };
  notFound: { title: string; message: string; backHome: string };
}

const UI: Record<Lang, UIStrings> = {
  en: {
    nav: { home: 'Home', projects: 'Projects', about: 'About' },
    projects: { title: 'Projects', all: 'All', newest: 'Newest', oldest: 'Oldest' },
    home: {
      viewProjects: 'View Projects',
      featuredTitle: 'Featured Projects',
      aboutTitle: 'About Me',
      moreAbout: 'More about me',
      skillsTitle: 'Skills',
      experienceTitle: 'Experience',
      educationTitle: 'Education',
      certificatesTitle: 'Certificates',
      viewCertificate: 'View certificate',
    },
    about: { title: 'About Me', downloadCV: 'Download CV', present: 'Present', expected: '(expected)', gpa: 'GPA', validUntil: 'Valid until' },
    project: {
      visitGithub: 'GitHub',
      visitDemo: 'Live Demo',
      visitWebsite: 'Website',
      private: 'Private repository',
      live: 'Live',
      relatedProjects: 'Related projects',
    },
    footer: { rights: 'All rights reserved.' },
    notFound: { title: 'Page not found', message: 'The page you are looking for does not exist.', backHome: 'Back to home' },
  },
  tr: {
    nav: { home: 'Ana Sayfa', projects: 'Projeler', about: 'Hakkımda' },
    projects: { title: 'Projeler', all: 'Tümü', newest: 'En Yeni', oldest: 'En Eski' },
    home: {
      viewProjects: 'Projeleri Gör',
      featuredTitle: 'Öne Çıkan Projeler',
      aboutTitle: 'Hakkımda',
      moreAbout: 'Daha fazla',
      skillsTitle: 'Yetenekler',
      experienceTitle: 'Deneyim',
      educationTitle: 'Eğitim',
      certificatesTitle: 'Sertifikalar',
      viewCertificate: 'Sertifikayı Gör',
    },
    about: { title: 'Hakkımda', downloadCV: 'CV İndir', present: 'Devam ediyor', expected: '(bekleniyor)', gpa: 'Not ortalaması', validUntil: 'Geçerlilik' },
    project: {
      visitGithub: 'GitHub',
      visitDemo: 'Canlı Demo',
      visitWebsite: 'Web Sitesi',
      private: 'Özel depo',
      live: 'Canlı',
      relatedProjects: 'İlgili projeler',
    },
    footer: { rights: 'Tüm hakları saklıdır.' },
    notFound: { title: 'Sayfa bulunamadı', message: 'Aradığınız sayfa bulunmuyor.', backHome: 'Ana sayfaya dön' },
  },
};

export function getUI(lang: Lang): UIStrings {
  return UI[lang];
}