import { createI18n } from './instance';
import { isRTL, resolveLocale } from './resources';

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
  it('knows RTL languages', () => {
    expect(isRTL('ar-EG')).toBe(true);
    expect(isRTL('en')).toBe(false);
  });
});
