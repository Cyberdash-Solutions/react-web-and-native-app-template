import { createConfig } from '@repo/eslint-config';

export default [
  ...createConfig({ kind: 'pure-package', tsconfigRootDir: import.meta.dirname }),
  // The optional React binding lives in its own subpath so the core stays framework-free.
  { files: ['src/react.tsx'], rules: { 'no-restricted-imports': 'off' } },
];
