const { node, universal } = require('@repo/jest-config');

// 13.5 — pure areas run in plain Node. 13.4 — areas with *.native.ts / *.web.ts splits run as
// ios / android / web projects so each split is exercised on its own platform.
const NODE_AREAS = ['domain', 'utils', 'config', 'api-client'];
const PLATFORM_AREAS = ['state', 'data', 'auth', 'analytics'];

// Every folder under src/ must be listed above, or its tests would silently never run.
const unlisted = require('node:fs')
  .readdirSync(require('node:path').join(__dirname, 'src'), { withFileTypes: true })
  .filter(
    (d) =>
      d.isDirectory() &&
      d.name !== 'i18n' &&
      !NODE_AREAS.includes(d.name) &&
      !PLATFORM_AREAS.includes(d.name),
  )
  .map((d) => d.name);
if (unlisted.length) {
  throw new Error(
    `packages/core/jest.config.js: add ${unlisted.join(', ')} to NODE_AREAS or PLATFORM_AREAS.`,
  );
}

const platforms = universal();

module.exports = {
  coverageReporters: platforms.coverageReporters,
  // 13.23 — highest bars in domain, data and auth.
  coverageThreshold: {
    './src/domain/': { lines: 95, statements: 85, branches: 75, functions: 95 },
    './src/auth/': { lines: 90, statements: 85, branches: 70, functions: 75 },
    './src/data/': { lines: 75, statements: 70, branches: 60, functions: 65 },
  },
  projects: [
    node(
      {
        displayName: 'node',
        testMatch: [
          ...NODE_AREAS.map((a) => `<rootDir>/src/${a}/**/*.test.ts?(x)`),
          '<rootDir>/src/i18n/formatters.test.ts',
          '<rootDir>/src/i18n/resources.test.ts',
        ],
      },
      { asProject: true },
    ),
    ...platforms.projects.map((p) => ({
      ...p,
      rootDir: __dirname,
      // Same conventions as @repo/jest-config: RNTL component tests (*.test.tsx) run on the
      // native projects; web runs logic tests and *.web.test.tsx.
      testMatch: [
        ...PLATFORM_AREAS.map(
          (a) => `<rootDir>/src/${a}/**/*.test.${p.displayName === 'web' ? 'ts' : 'ts?(x)'}`,
        ),
        ...(p.displayName === 'web'
          ? PLATFORM_AREAS.map((a) => `<rootDir>/src/${a}/**/*.web.test.tsx`)
          : []),
        '<rootDir>/src/i18n/locale.test.ts',
      ],
    })),
  ],
};
