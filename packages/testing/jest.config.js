const path = require('node:path');

const { node } = require('@repo/jest-config');

module.exports = {
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  projects: [
    // 13.6 — fixtures and factories match the domain schemas.
    node(
      { displayName: 'fixtures', testMatch: ['<rootDir>/fixtures/**/*.test.ts'] },
      { asProject: true },
    ),
    // 13.13 — consumer contract tests against a live backend: CONTRACT_API_URL in CI, or the
    // seeded mock API (./mock-api) started by global-setup when it's unset.
    node(
      {
        displayName: 'contracts',
        testMatch: ['<rootDir>/contracts/**/*.test.ts'],
        globalSetup: path.join(__dirname, 'contracts/global-setup.mjs'),
        globalTeardown: path.join(__dirname, 'contracts/global-teardown.mjs'),
      },
      { asProject: true },
    ),
  ],
};
