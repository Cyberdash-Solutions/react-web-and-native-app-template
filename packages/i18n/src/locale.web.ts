import { isRTL, resolveLocale, type Locale } from './resources';

/** 10.3 — Web: `?lang=` in the URL wins, then the browser's language list. */
export function detectLocale(preferred?: string | null): Locale {
  if (typeof window === 'undefined') return resolveLocale([preferred]);
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  return resolveLocale([fromUrl, preferred, ...(navigator.languages ?? [navigator.language])]);
}

/** 10.3 — Web: RTL via the `dir` and `lang` attributes on <html>. */
export function applyDirection(locale: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
}
