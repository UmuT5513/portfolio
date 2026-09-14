import type { Lang } from './data';

const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
};

export function formatMonth(iso: string, lang: Lang): string {
  const [y, m] = iso.split('-');
  const month = Number(m);
  if (!y || !m || month < 1 || month > 12) return iso;
  return `${MONTHS[lang][month - 1]} ${y}`;
}