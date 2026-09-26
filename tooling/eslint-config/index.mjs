// Shared flat ESLint config (13.27) including dependency-boundary rules
// (1.4, 1.11, 1.13, 13.3). Every workspace calls `createConfig({ kind, ... })`.
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
    'Shared packages must stay platform-neutral (1.4). Put this in a *.native.ts / *.web.ts split file or a platform-scoped package.',
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

/** 1.11 — platform-exclusive packages are only used by the matching app. */
const platformExclusive = {
  native: { group: ['@repo/web-pwa', '@repo/web-pwa/*'], message: 'web-only package (1.11).' },
  web: {
    group: ['@repo/native-push', '@repo/native-push/*'],
    message: 'native-only package (1.11).',
  },
};

/**
 * @param {object} options
 * @param {'app' | 'package' | 'pure-package' | 'ui-package' | 'testing' | 'tooling'} options.kind
 *   pure-package: no React, no platform APIs (domain, utils, config)
 *   package:      React allowed; platform APIs only in *.native.ts / *.web.ts splits
 *   ui-package:   react-native primitives allowed (ui, via react-native-web) or a platform-scoped package
 * @param {'native' | 'web' | 'both'} [options.platform] — for apps: which platform they target.
 * @param {string} options.tsconfigRootDir
 */
export function createConfig({ kind, platform = 'both', tsconfigRootDir }) {
  const sourcePatterns = [];
  if (kind !== 'testing') sourcePatterns.push(noTestingInSource);
  if (kind === 'app') {
    sourcePatterns.push(...noCrossAppImports);
    if (platform !== 'both') sourcePatterns.push(platformExclusive[platform]);
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

  if (kind === 'pure-package' || kind === 'package') {
    // 1.4: platform APIs only inside platform-split files.
    configs.push({
      files: ['**/*.{ts,tsx}'],
      ignores: [...PLATFORM_SPLIT_FILES, ...TEST_FILES],
      rules: {
        'no-restricted-imports': ['error', { patterns: [...sourcePatterns, noPlatformModules] }],
        'no-restricted-globals': ['error', ...DOM_GLOBALS],
      },
    });
  }

  if (kind === 'pure-package') {
    // 13.5: pure packages don't depend on React either.
    configs.push({
      files: ['**/*.{ts,tsx}'],
      ignores: TEST_FILES,
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...sourcePatterns,
              noPlatformModules,
              {
                group: ['react', 'react/*'],
                message: 'Pure packages are framework-free (13.5). Use a /react subpath export.',
              },
            ],
          },
        ],
      },
    });
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
