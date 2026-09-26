import { Platform } from 'react-native';

import { detectLocale } from './locale';

describe(`detectLocale (${Platform.OS})`, () => {
  it('prefers an explicit user choice', () => expect(detectLocale('es')).toBe('es'));
  it('falls back to a supported locale', () => expect(['en', 'es']).toContain(detectLocale(null)));
});
