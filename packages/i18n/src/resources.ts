import en from './locales/en.json';
import es from './locales/es.json';

/**
 * 10.1 — Translation resources. Namespaces are the top-level keys (common, settings, consent,
 * errors, validation). Files are synced with Lokalise/Crowdin (10.2); `en` is the source of truth
 * and `pnpm i18n:check` fails CI when another locale is missing a key.
 */
export const resources = { en, es } as const;
export type Locale = keyof typeof resources;
export const supportedLocales = Object.keys(resources) as Locale[];
export const defaultLocale: Locale = 'en';
export const namespaces = Object.keys(en) as (keyof typeof en)[];

const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur']);
/** 10.3 — shared RTL decision; applying it differs per platform (I18nManager vs `dir`). */
export const isRTL = (locale: string) => RTL_LANGUAGES.has(locale.split('-')[0]!.toLowerCase());

export function resolveLocale(candidates: readonly (string | null | undefined)[]): Locale {
  for (const c of candidates) {
    if (!c) continue;
    const exact = supportedLocales.find((l) => l === c);
    if (exact) return exact;
    const lang = supportedLocales.find((l) => l === c.split('-')[0]!.toLowerCase());
    if (lang) return lang;
  }
  return defaultLocale;
}
