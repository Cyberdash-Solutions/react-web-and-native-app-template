import fs from 'node:fs';
import path from 'node:path';

import { createConfig } from '@repo/eslint-config';

/**
 * Each folder under src/ is a boundary (1.4, 13.5): `pure` areas use neither React nor platform
 * APIs, and an area may only import the areas listed in `mayImport`. This keeps the old
 * package graph as a lint rule instead of 14 package.json files.
 */
const areas = {
  utils: { pure: true },
  domain: { pure: true },
  config: { pure: true, reactFiles: ['react.tsx'] },
  'api-client': { pure: true, mayImport: ['domain', 'utils'] },
  state: {},
  i18n: {},
  data: { mayImport: ['api-client', 'domain', 'utils'] },
  auth: { mayImport: ['data', 'domain', 'utils'] },
  analytics: { mayImport: ['state', 'utils'] },
};

// A folder without an entry would have no boundary rules at all.
const unlisted = fs
  .readdirSync(path.join(import.meta.dirname, 'src'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !(d.name in areas))
  .map((d) => d.name);
if (unlisted.length) {
  throw new Error(`packages/core/eslint.config.mjs: add ${unlisted.join(', ')} to areas.`);
}

export default createConfig({ kind: 'package', tsconfigRootDir: import.meta.dirname, areas });
