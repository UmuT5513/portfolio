import type { Lang } from '../lib/data';

export const LANGS: Lang[] = ['en', 'tr'];

export function switchLocale(pathname: string, search: string, current: Lang, target: Lang): string {
  if (current === target) return pathname + search;
  const rest = pathname === '/' ? '/' : pathname.replace(/^\/[^/]+/, '') || '/';
  return `/${target}${rest}${search}`;
}