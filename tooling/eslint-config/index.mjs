// Shared flat ESLint config (13.27) including dependency-boundary rules
// (1.4, 1.13, 13.3) — including folder-level layering inside a package. Every workspace calls `createConfig({ kind, ... })`.
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const TEST_FILES = [
  '**/*.test.{ts,tsx}',
  '**/*.perf-test.{ts,tsx}',
  '**/__tests__/**',
  '**/e2e/**',
  '**/*.stories.{ts,tsx}',
  '**/jest.setup.{js,ts}',
  '**/playwright.config.ts',
];

const PLATFORM_SPLIT_FILES = [
  '**/*.native.{ts,tsx}',
  '**/*.ios.{ts,tsx}',
  '**/*.android.{ts,tsx}',
  '**/*.web.{ts,tsx}',
];

/** 13.3 — packages/testing is dev-only: source code may never import it. */
const noTestingInSource = {
  group: ['@repo/testing', '@repo/testing/*'],
  message: '@repo/testing is test-only (13.3). Import it from *.test.tsx files only.',
};

/** 1.13 — apps never import from each other; only from packages/*. */
const noCrossAppImports = [
  {
    group: ['**/apps/*', '**/apps/**', 'mobile', 'mobile/*', 'web', 'web/*'],
    message: 'Apps never import from other apps (1.13). Move shared code into packages/*.',
  },
];

/** 1.4 — shared packages don't reach for platform APIs unless platform-split. */
const noPlatformModules = {
  group: [
    'react-native',
    'react-native/*',
    'react-native-*',
    'react-dom',
    'react-dom/*',
    'expo',
    'expo-*',
    '@react-native-*/*',
  ],
  message:
    'Shared packages must stay platform-neutral (1.4). Put this in a *.native.ts / *.web.ts split file, or in the app that needs it.',
};

const DOM_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'location',
].map((name) => ({
  name,
  message: `DOM global "${name}" is only allowed in *.web.ts files (1.4).`,
}));

const noReact = {
  group: ['react', 'react/*'],
  message: 'Pure areas are framework-free (13.5). Put React bindings in a react.tsx file.',
};

/**
 * @typedef {object} Area
 * @property {boolean} [pure]       no React and no platform APIs (13.5)
 * @property {string[]} [reactFiles] files inside a pure area that may use React (e.g. 'react.tsx')
 * @property {string[]} [mayImport] other areas this one may import (1.4 layering); default none
 */

/**
 * @param {object} options
 * @param {'app' | 'package' | 'ui-package' | 'testing' | 'tooling'} options.kind
 *   package:    shared code; platform APIs only in *.native.ts / *.web.ts splits (1.4)
 *   ui-package: react-native primitives allowed (rendered on web by react-native-web)
 * @param {Record<string, Area>} [options.areas] for `package`: folders under src/ and their rules.
 *   Each area is a boundary like a package used to be: it may only import the areas it lists.
 * @param {string} options.tsconfigRootDir
 */
export function createConfig({ kind, areas = {}, tsconfigRootDir }) {
  const sourcePatterns = [];
  if (kind !== 'testing') sourcePatterns.push(noTestingInSource);
  if (kind === 'app') {
    sourcePatterns.push(...noCrossAppImports);
  } else {
    sourcePatterns.push({
      group: ['**/apps/**', 'mobile', 'web'],
      message: 'Packages never import from apps (1.13).',
    });
  }

  /** @type {import('eslint').Linter.Config[]} */
  const configs = [
    {
      ignores: [
        '**/node_modules/**',
        '**/.tsbuild/**',
        '**/dist/**',
        '**/.expo/**',
        '**/coverage/**',
        '**/*.config.{js,cjs,mjs}',
        '**/babel.config.js',
        '**/metro.config.js',
        '**/expo-env.d.ts',
        '**/playwright-report/**',
        '**/test-results/**',
        '**/storybook-static/**',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        globals: { ...globals.es2022 },
        parserOptions: { tsconfigRootDir },
      },
      plugins: { 'react-hooks': reactHooks },
      rules: {
        ...reactHooks.configs.recommended.rules,
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
        'no-restricted-imports': ['error', { patterns: sourcePatterns }],
      },
    },
  ];

  if (kind === 'package') {
    const names = Object.keys(areas);
    for (const [name, area] of Object.entries(areas)) {
      const allowed = new Set([name, ...(area.mayImport ?? [])]);
      const layering = names
        .filter((other) => !allowed.has(other))
        .map((other) => ({
          group: [`../${other}`, `../${other}/*`, `**/src/${other}`, `**/src/${other}/*`],
          message: `src/${name} may not import src/${other}. Allowed: ${[...allowed].join(', ')} (1.4 layering).`,
        }));
      const files = [`src/${name}/**/*.{ts,tsx}`];
      const reactFiles = (area.reactFiles ?? []).map((f) => `src/${name}/${f}`);

      // Platform-neutral source: no platform modules or DOM globals (1.4), no React if pure (13.5).
      configs.push({
        files,
        ignores: [...PLATFORM_SPLIT_FILES, ...TEST_FILES, ...reactFiles],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                ...sourcePatterns,
                ...layering,
                noPlatformModules,
                ...(area.pure ? [noReact] : []),
              ],
            },
          ],
          'no-restricted-globals': ['error', ...DOM_GLOBALS],
        },
      });
      // Platform split files and a pure area's React binding: layering still applies.
      configs.push({
        files: [...PLATFORM_SPLIT_FILES.map((g) => `src/${name}/${g}`), ...reactFiles],
        ignores: TEST_FILES,
        rules: {
          'no-restricted-imports': ['error', { patterns: [...sourcePatterns, ...layering] }],
        },
      });
    }
  }

  // Test files may import @repo/testing and use node/jest globals.
  configs.push({
    files: TEST_FILES,
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-globals': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  });

  // Web split files and web apps may use the DOM.
  configs.push({
    files: ['**/*.web.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
  });

  // Node scripts (CI checks, jest global setup, generators).
  configs.push({
    files: ['**/scripts/**/*.{js,mjs}', '**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off', 'no-restricted-imports': 'off', 'no-restricted-globals': 'off' },
  });

  if (kind === 'tooling') {
    configs.push({
      languageOptions: { globals: { ...globals.node } },
      rules: { 'no-console': 'off' },
    });
  }

  return configs;
}

export default createConfig;
