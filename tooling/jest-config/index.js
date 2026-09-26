// Shared Jest presets (13.4, 13.5).
//   node()      — pure packages (domain, utils, config, i18n formatters): plain Node, fast.
//   universal() — cross-platform packages: one project per platform (ios / android / web) so
//                 *.native.ts and *.web.ts splits are each exercised on their own platform.
//   app(platforms) — an Expo app; runs only the platforms that app targets.
const path = require('node:path');

// With pnpm, packages live under node_modules/.pnpm/<name>@<ver>/node_modules/<name>.
const TRANSFORM_ALLOW = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'expo(nent)?',
  '@expo(nent)?/.*',
  'expo-.*',
  'react-navigation',
  '@react-navigation/.*',
  '@sentry/react-native',
  'react-native-.*',
  '@shopify/flash-list',
  '@repo/.*',
  // MSW v2 and its ESM-only dependencies
  'msw',
  '@mswjs/.*',
  '@open-draft/.*',
  'rettime',
  'until-async',
  'outvariant',
  'strict-event-emitter',
  'headers-polyfill',
  'is-node-process',
];
const transformIgnorePatterns = [
  `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:${TRANSFORM_ALLOW.join('|')})/)`,
];

const common = {
  testMatch: ['**/?(*.)test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/.tsbuild/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.perf-test.tsx',
  ],
};
// Global-only options (not valid inside `projects`).
const globalOptions = { coverageReporters: ['text-summary', 'lcov', 'json-summary'] };

const setupFile = path.join(__dirname, 'setup.js');

/** @param {object} [overrides] @param {{ asProject?: boolean }} [opts] */
function node(overrides = {}, { asProject = false } = {}) {
  return {
    ...(asProject ? {} : globalOptions),
    ...common,
    displayName: 'node',
    testEnvironment: 'node',
    transform: {
      '^.+\\.[cm]?[jt]sx?$': [
        'babel-jest',
        {
          presets: [require.resolve('babel-preset-expo')],
          caller: { name: 'metro', platform: 'node' },
        },
      ],
    },
    transformIgnorePatterns,
    setupFilesAfterEnv: [setupFile],
    ...overrides,
  };
}

function platformProject(platform, extraSetup = []) {
  const { getIOSPreset, getAndroidPreset, getWebPreset } = require('jest-expo/config');
  const presets = { ios: getIOSPreset, android: getAndroidPreset, web: getWebPreset };
  // eslint-disable-next-line no-unused-vars
  const { watchPlugins: _watchPlugins, ...preset } = presets[platform]();
  // Workspace packages have no babel.config.js of their own: hand babel-preset-expo to babel-jest.
  const transform = Object.fromEntries(
    Object.entries(preset.transform || {}).map(([pattern, value]) => {
      const [transformer, options = {}] = Array.isArray(value) ? value : [value];
      return String(transformer).includes('babel-jest')
        ? [pattern, [transformer, { ...options, presets: [require.resolve('babel-preset-expo')] }]]
        : [pattern, value];
    }),
  );
  // ESM-only dependencies (MSW's) ship .mjs files.
  transform['\\.mjs$'] = ['babel-jest', { presets: [require.resolve('babel-preset-expo')] }];
  return {
    ...preset,
    ...common,
    transform,
    displayName: platform,
    // 13.7 — component tests (*.test.tsx) use React Native Testing Library and run on the native
    // projects; the web project runs logic tests (*.test.ts) and React Testing Library tests for
    // web-only components (*.web.test.tsx). Tests of a *.native.ts split (*.native.test.ts) run
    // only on the native projects.
    ...(platform === 'web'
      ? {
          testEnvironment: path.join(__dirname, 'env-web.js'),
          testMatch: ['**/?(*.)test.[jt]s', '**/*.web.test.[jt]sx'],
          testPathIgnorePatterns: [...common.testPathIgnorePatterns, '\\.native\\.test\\.[jt]sx?$'],
        }
      : { testPathIgnorePatterns: [...common.testPathIgnorePatterns, '\\.web\\.test\\.[jt]sx?$'] }),
    transformIgnorePatterns,
    // MSW v2 needs the default export conditions rather than "browser"/"react-native".
    testEnvironmentOptions: {
      ...(preset.testEnvironmentOptions || {}),
      customExportConditions: [''],
    },
    setupFilesAfterEnv: [
      ...(preset.setupFilesAfterEnv || []),
      setupFile,
      ...(platform === 'web' ? [] : [path.join(__dirname, 'setup-native.js')]),
      ...extraSetup,
    ],
  };
}

/** @param {{ platforms?: Array<'ios'|'android'|'web'>, setupFiles?: string[], coverageThreshold?: object }} [opts] */
function universal(opts = {}) {
  const platforms = opts.platforms || ['ios', 'android', 'web'];
  return {
    ...globalOptions,
    coverageThreshold: opts.coverageThreshold,
    projects: platforms.map((p) => platformProject(p, opts.setupFiles)),
  };
}

module.exports = { node, universal, transformIgnorePatterns };
