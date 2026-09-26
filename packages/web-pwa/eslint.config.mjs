import { createConfig } from '@repo/eslint-config';
import globals from 'globals';

// Platform-scoped package (1.11): browser APIs are the point.
export default [
  ...createConfig({ kind: 'ui-package', tsconfigRootDir: import.meta.dirname }),
  { languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } } },
  { ignores: ['public/**'] },
];
