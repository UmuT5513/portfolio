// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
    routing: { prefixDefaultLocale: true },
  },
  redirects: {
    '/': '/en/',
    '/en/about/': '/en/',
    '/tr/about/': '/tr/',
  },
});