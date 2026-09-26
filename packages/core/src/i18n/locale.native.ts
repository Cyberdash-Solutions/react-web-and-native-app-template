import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import { isRTL, resolveLocale, type Locale } from './resources';

/** 10.3 — Mobile: the device locale list. */
export function detectLocale(preferred?: string | null): Locale {
  return resolveLocale([preferred, ...getLocales().map((l) => l.languageTag)]);
}

/** 10.3 — Mobile: RTL via I18nManager (takes effect after an app reload). */
export function applyDirection(locale: string): void {
  const rtl = isRTL(locale);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}
