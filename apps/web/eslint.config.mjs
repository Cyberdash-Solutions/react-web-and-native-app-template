import { createConfig } from '@repo/eslint-config';
import globals from 'globals';

export default [
  ...createConfig({ kind: 'app', platform: 'web', tsconfigRootDir: import.meta.dirname }),
  // The web app is web-only: the DOM is fair game everywhere in it.
  { languageOptions: { globals: { ...globals.browser } } },
  { ignores: ['dist/**', 'public/**', '.lighthouseci/**'] },
];
