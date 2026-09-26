import { createConfig } from '@repo/eslint-config';

export default createConfig({ kind: 'package', tsconfigRootDir: import.meta.dirname });
