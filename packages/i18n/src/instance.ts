import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultLocale, namespaces, resources, type Locale } from './resources';

/** Creates an isolated i18next instance (one per app, one per test). */
export function createI18n(locale: Locale = defaultLocale): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: Object.keys(resources),
    resources,
    ns: namespaces,
    defaultNS: 'common',
    interpolation: { escapeValue: false }, // React escapes
    returnNull: false,
    initAsync: false,
    // Missing keys are a CI failure (10.2); at runtime, surface them loudly in dev.
    saveMissing: false,
  });
  return instance;
}
