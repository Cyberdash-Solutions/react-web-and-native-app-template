import 'i18next';

import type en from './locales/en.json';

// Typed keys: t('common:hello') is checked against the English source file.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof en;
  }
}
