import { createConfig } from '@repo/eslint-config';

// 8.2 — ui is built on shared react-native primitives rendered on web by react-native-web,
// so importing react-native is allowed here (unlike the other shared packages).
export default createConfig({ kind: 'ui-package', tsconfigRootDir: import.meta.dirname });
