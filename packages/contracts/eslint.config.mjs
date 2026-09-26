import { createConfig } from '@repo/eslint-config';

export default createConfig({ kind: 'pure-package', tsconfigRootDir: import.meta.dirname });
