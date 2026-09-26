import { createConfig } from '@repo/eslint-config';

export default [
  ...createConfig({ kind: 'app', platform: 'native', tsconfigRootDir: import.meta.dirname }),
  { ignores: ['dist/**', 'ios/**', 'android/**'] },
];
