import { createI18n } from './instance';
import { isRTL, languageName, resolveLocale, supportedLocales } from './resources';

describe('i18n resources', () => {
  it('interpolates and pluralizes', () => {
    const i18n = createI18n('en');
    expect(i18n.t('hello', { name: 'Ada' })).toBe('Hello, Ada!');
    expect(i18n.t('messages', { count: 1 })).toBe('1 message');
    expect(i18n.t('messages', { count: 3 })).toBe('3 messages');
    expect(i18n.t('errors:network')).toMatch(/offline/);
  });
  it('translates to Spanish', () => expect(createI18n('es').t('helloWorld')).toBe('¡Hola, mundo!'));
  it('resolves locales with language fallback', () => {
    expect(resolveLocale(['es-MX'])).toBe('es');
    expect(resolveLocale([null, 'fr-FR'])).toBe('en');
  });
  it('names every language in that language, without Intl.DisplayNames (Hermes lacks it)', () => {
    expect(languageName('en')).toBe('English');
    expect(languageName('es')).toBe('Español');
    for (const l of supportedLocales) expect(languageName(l)).toBeTruthy();
  });
  it('knows RTL languages', () => {
    expect(isRTL('ar-EG')).toBe(true);
    expect(isRTL('en')).toBe(false);
  });
});
