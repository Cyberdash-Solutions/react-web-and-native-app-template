#!/usr/bin/env node
// 1.9 — Add or remove a deployment target later, without touching shared packages:
//   pnpm gen add-target web
//   pnpm gen remove-target mobile
//   pnpm gen area <name>                   add a folder (and import path) to @repo/core
import fs from 'node:fs';
import path from 'node:path';

import {
  presentTargets,
  removeTarget,
  restoreTarget,
  ROOT,
  syncWorkspace,
  TARGET_NAMES,
} from './targets.mjs';

const [command, arg, ...flags] = process.argv.slice(2);
const skipInstall = flags.includes('--skip-install');

function assertTarget(t) {
  if (!TARGET_NAMES.includes(t)) {
    console.error(`Unknown target "${t}". Expected one of: ${TARGET_NAMES.join(', ')}`);
    process.exit(1);
  }
}

switch (command) {
  case 'add-target': {
    assertTarget(arg);
    if (presentTargets().includes(arg)) {
      console.error(`apps/${arg} already exists.`);
      process.exit(1);
    }
    console.log(`Adding target "${arg}":`);
    restoreTarget(arg);
    syncWorkspace({ install: !skipInstall });
    break;
  }
  case 'remove-target': {
    assertTarget(arg);
    if (!presentTargets().includes(arg)) {
      console.error(`apps/${arg} does not exist.`);
      process.exit(1);
    }
    if (presentTargets().length === 1) {
      console.error('Refusing to remove the last remaining target.');
      process.exit(1);
    }
    console.log(
      `Removing target "${arg}" (app folder, CI workflow, deploy config, platform-scoped packages):`,
    );
    removeTarget(arg);
    syncWorkspace({ install: !skipInstall });
    break;
  }
  case 'area': {
    scaffoldArea(arg);
    break;
  }
  default:
    console.error(
      'Usage: pnpm gen add-target <mobile|web> | remove-target <mobile|web> | package <name> [--react]',
    );
    process.exit(1);
}

/**
 * Shared code is one package (ADR 0008): a new concern is a folder in packages/core/src with its
 * own subpath export, not a new workspace package.
 */
function scaffoldArea(name) {
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('Area name must be kebab-case, e.g. `pnpm gen area payments`.');
    process.exit(1);
  }
  const core = path.join(ROOT, 'packages/core');
  const dir = path.join(core, 'src', name);
  if (fs.existsSync(dir)) {
    console.error(`packages/core/src/${name} already exists.`);
    process.exit(1);
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.ts'),
    'export const hello = (name: string) => `Hello, ${name}!`;\n',
  );
  fs.writeFileSync(
    path.join(dir, 'index.test.ts'),
    "import { hello } from './index';\n\ntest('hello', () => expect(hello('world')).toBe('Hello, world!'));\n",
  );

  const pkgFile = path.join(core, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  pkg.exports = Object.fromEntries(
    Object.entries({ ...pkg.exports, [`./${name}`]: `./src/${name}/index.ts` }).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  );
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`Created packages/core/src/${name} → import from '@repo/core/${name}'.`);
  console.log('Next:');
  console.log(
    `  - packages/core/eslint.config.mjs: add \`${name}: { mayImport: [...] }\` to areas (pure: true if it has no React)`,
  );
  console.log(`  - packages/core/jest.config.js: add '${name}' to NODE_AREAS or PLATFORM_AREAS`);
  console.log(`  - .github/CODEOWNERS: add /packages/core/src/${name}/`);
}
