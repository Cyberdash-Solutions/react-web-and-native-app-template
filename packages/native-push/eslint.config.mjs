import { createConfig } from '@repo/eslint-config';

// Platform-scoped package (1.11): native APIs are the point, so no 1.4 restriction applies.
export default createConfig({ kind: 'ui-package', tsconfigRootDir: import.meta.dirname });
