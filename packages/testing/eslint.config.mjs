import { createConfig } from '@repo/eslint-config';

export default createConfig({ kind: 'testing', tsconfigRootDir: import.meta.dirname });
