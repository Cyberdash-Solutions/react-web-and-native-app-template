#!/usr/bin/env node
// 1.9 — Add or remove a deployment target later, without touching shared packages:
//   pnpm gen add-target web
//   pnpm gen remove-target mobile
//   pnpm gen package <name> [--react]     scaffold a new shared package
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
  case 'package': {
    scaffoldPackage(arg, flags.includes('--react'));
    syncWorkspace({ install: !skipInstall });
    break;
  }
  default:
    console.error(
      'Usage: pnpm gen add-target <mobile|web> | remove-target <mobile|web> | package <name> [--react]',
    );
    process.exit(1);
}

function scaffoldPackage(name, react) {
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('Package name must be kebab-case, e.g. `pnpm gen package payments`.');
    process.exit(1);
  }
  const dir = path.join(ROOT, 'packages', name);
  if (fs.existsSync(dir)) {
    console.error(`packages/${name} already exists.`);
    process.exit(1);
  }
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  };
  const json = (o) => JSON.stringify(o, null, 2) + '\n';
  write(
    'package.json',
    json({
      name: `@repo/${name}`,
      version: '0.0.0',
      private: true,
      sideEffects: false,
      exports: { '.': './src/index.ts' },
      scripts: { lint: 'eslint .', typecheck: 'tsc -p tsconfig.check.json', test: 'jest' },
      ...(react ? { peerDependencies: { react: '*' } } : {}),
      devDependencies: {
        '@repo/eslint-config': 'workspace:*',
        '@repo/jest-config': 'workspace:*',
        '@repo/tsconfig': 'workspace:*',
        '@types/jest': 'catalog:',
        '@types/node': 'catalog:',
        ...(react ? { '@types/react': 'catalog:', react: 'catalog:' } : {}),
        eslint: 'catalog:',
        jest: 'catalog:',
        typescript: 'catalog:',
      },
    }),
  );
  write(
    'tsconfig.json',
    json({
      extends: `@repo/tsconfig/${react ? 'react-library' : 'node'}.json`,
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  );
  write(
    'tsconfig.check.json',
    json({
      extends: './tsconfig.json',
      compilerOptions: {
        composite: false,
        noEmit: true,
        emitDeclarationOnly: false,
        declaration: false,
        declarationMap: false,
        declarationDir: null,
        tsBuildInfoFile: null,
      },
      include: ['src'],
      exclude: [],
    }),
  );
  write(
    'eslint.config.mjs',
    `import { createConfig } from '@repo/eslint-config';\n\nexport default createConfig({ kind: '${react ? 'package' : 'pure-package'}', tsconfigRootDir: import.meta.dirname });\n`,
  );
  write(
    'jest.config.js',
    `module.exports = require('@repo/jest-config').${react ? 'universal' : 'node'}();\n`,
  );
  write('src/index.ts', `export const hello = (name: string) => \`Hello, \${name}!\`;\n`);
  write(
    'src/index.test.ts',
    `import { hello } from './index';\n\ntest('hello', () => expect(hello('world')).toBe('Hello, world!'));\n`,
  );
  console.log(`Created packages/${name}. Add a CODEOWNERS entry for /packages/${name}/.`);
}
