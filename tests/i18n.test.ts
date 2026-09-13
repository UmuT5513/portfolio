import { describe, it, expect } from 'vitest';
import { getUI, getCategoryLabel } from '../src/i18n/ui';
import { LANGS, switchLocale } from '../src/i18n/locale';

describe('getUI', () => {
  it('exposes the same key structure for both languages', () => {
    const en = getUI('en');
    const tr = getUI('tr');
    expect(Object.keys(en.nav)).toEqual(Object.keys(tr.nav));
    expect(Object.keys(en.projects)).toEqual(Object.keys(tr.projects));
    expect(Object.keys(en.home)).toEqual(Object.keys(tr.home));
    expect(Object.keys(en.about)).toEqual(Object.keys(tr.about));
    expect(Object.keys(en.project)).toEqual(Object.keys(tr.project));
  });
});

describe('getCategoryLabel', () => {
  it('returns localized category labels', () => {
    expect(getCategoryLabel('en', 'rag')).toBe('RAG');
    expect(getCategoryLabel('tr', 'rag')).toBe('RAG');
    expect(getCategoryLabel('tr', 'agents')).toBe('Ajanlar');
  });
});

describe('switchLocale', () => {
  it('swaps the locale prefix and keeps the rest of the path', () => {
    expect(switchLocale('/en/projects', '', 'en', 'tr')).toBe('/tr/projects');
    expect(switchLocale('/tr/projects/rag-chatbot', '?x=1', 'tr', 'en')).toBe('/en/projects/rag-chatbot?x=1');
    expect(switchLocale('/en/', '', 'en', 'tr')).toBe('/tr/');
  });
});