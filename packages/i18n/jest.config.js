const { node, universal } = require('@repo/jest-config');

// 13.5 — formatters and resources run in plain Node; locale detection runs per platform (13.4).
const platforms = universal();
module.exports = {
  coverageReporters: platforms.coverageReporters,
  projects: [
    node(
      {
        displayName: 'node',
        testMatch: ['<rootDir>/src/**/formatters.test.ts', '<rootDir>/src/**/resources.test.ts'],
      },
      { asProject: true },
    ),
    ...platforms.projects.map((p) => ({
      ...p,
      rootDir: __dirname,
      testMatch: ['<rootDir>/src/**/locale.test.ts'],
    })),
  ],
};
